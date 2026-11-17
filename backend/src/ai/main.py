from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

os.environ.setdefault("KERAS_BACKEND", "tensorflow")

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict

ASSETS_DIR = Path(__file__).resolve().parent / "assets"
MODEL_NAMES = ("random_forest", "xgboost", "ann")
ModelChoice = Literal["all", "random_forest", "xgboost", "ann"]


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Feature names are supplied by the training manifest and can change after
    # data-driven selection; values are already expressed in the training schema.
    features: dict[str, float | None]
    model: ModelChoice = "all"


def prepare_features(
    features: dict[str, float | None], feature_order: list[str],
    feature_schema: list[dict],
) -> pd.DataFrame:
    received = set(features)
    expected = set(feature_order)
    if received != expected:
        missing = sorted(expected - received)
        extra = sorted(received - expected)
        raise ValueError(f"Feature schema mismatch; missing={missing}, extra={extra}")

    schema_by_name = {field['name']: field for field in feature_schema}
    values: list[float] = []
    for name in feature_order:
        field = schema_by_name[name]
        value = features[name]
        if value is None:
            if field.get('required', False):
                raise ValueError(
                    f"Vui lòng cung cấp thông tin bắt buộc: {field['label']}."
                )
            values.append(np.nan)
            continue
        number = float(value)
        if not np.isfinite(number):
            raise ValueError(f"{name} must be a finite number or null")
        if field['kind'] == 'categorical':
            allowed = {float(option['value']) for option in field['options']}
            if number not in allowed:
                raise ValueError(f"{name} must use one of the listed BRFSS values")
        else:
            minimum, maximum = field.get('min'), field.get('max')
            if minimum is not None and number < minimum:
                raise ValueError(f"{name} is below the training range")
            if maximum is not None and number > maximum:
                raise ValueError(f"{name} is above the training range")
        values.append(number)
    return pd.DataFrame([values], columns=feature_order, dtype=np.float64)


def adjust_probability(raw_probability, model_name, probability_method,
                       positive_weight_ratio, probability_calibrators):
    if probability_method == "weighted_isotonic":
        calibrated = probability_calibrators[model_name].predict(
            np.asarray([raw_probability], dtype=float)
        )
        return float(np.clip(calibrated[0], 0.0, 1.0))
    return float(raw_probability / max(
        positive_weight_ratio * (1.0 - raw_probability) + raw_probability,
        1e-12,
    ))


def describe_risk_score(score: float) -> str:
    if score >= 0.80:
        return "Nguy cơ rất cao"
    if score >= 0.70:
        return "Nguy cơ cao"
    if score >= 0.60:
        return "Nguy cơ khá cao"
    if score >= 0.50:
        return "Có thể có nguy cơ"
    return "Chưa thấy nguy cơ rõ rệt"


def load_xgboost_model_from_snapshot(model_path: Path, expected_feature_count: int):
    import pickletools
    import zlib

    import xgboost

    payload = zlib.decompress(model_path.read_bytes())
    buffers = [
        bytes(argument)
        for opcode, argument, _ in pickletools.genops(payload)
        if opcode.name == "BINBYTES" and isinstance(argument, (bytes, bytearray))
    ]
    if len(buffers) != 1:
        raise RuntimeError(
            f"Expected one XGBoost snapshot buffer, found {len(buffers)}"
        )

    snapshot = buffers[0]
    model_marker = snapshot.find(b"Model{")
    if (not snapshot.startswith(b"{L")
            or model_marker < 0
            or snapshot.count(b"Model{") != 1
            or b"Config{" not in snapshot[:model_marker]):
        raise RuntimeError("The XGBoost pickle does not contain a supported model snapshot")

    booster = xgboost.Booster()
    booster.load_model(bytearray(snapshot[model_marker + len(b"Model"):]))
    if booster.num_features() != expected_feature_count:
        raise RuntimeError(
            f"Recovered XGBoost model expects {booster.num_features()} features, "
            f"expected {expected_feature_count}"
        )
    objective = json.loads(booster.save_config())["learner"]["objective"]["name"]
    if objective != "binary:logistic":
        raise RuntimeError(
            f"Recovered XGBoost model has unsupported objective {objective!r}"
        )

    classifier = xgboost.XGBClassifier()
    classifier._Booster = booster
    classifier.n_classes_ = 2
    return classifier


def load_models():
    import keras
    import xgboost

    with (ASSETS_DIR / "selected_input_features.json").open(encoding="utf-8") as file:
        input_manifest = json.load(file)
    feature_order = input_manifest.get("feature_order")
    feature_schema = input_manifest.get("feature_schema")
    imbalance_method = input_manifest.get("imbalance_method", "")
    training_class_counts = input_manifest.get("training_class_counts")
    probability_method = input_manifest.get("probability_method", "prior_correction")
    decision_score = input_manifest.get("decision_score", "")
    if (not isinstance(feature_order, list) or not feature_order
            or len(feature_order) > 10
            or not all(isinstance(name, str) and name for name in feature_order)
            or len(set(feature_order)) != len(feature_order)):
        raise RuntimeError("selected_input_features.json has an invalid feature_order")
    if (not isinstance(imbalance_method, str)
            or "random undersampling" not in imbalance_method.lower()
            or not isinstance(training_class_counts, list)
            or len(training_class_counts) != 2
            or any(isinstance(count, bool) or not isinstance(count, int) or count <= 0
                   for count in training_class_counts)
            or training_class_counts[0] != training_class_counts[1]):
        raise RuntimeError(
            "The loaded model bundle is not the expected 1:1 undersampled training bundle. "
            "Restore the complete app_assets.zip produced by the BRFSS training notebook."
        )
    if decision_score != "raw_model_score":
        raise RuntimeError(
            "The asset bundle must use raw_model_score for the displayed score and decision. "
            "Export it from the updated BRFSS training notebook."
        )
    if (not isinstance(feature_schema, list) or len(feature_schema) != len(feature_order)
            or not all(isinstance(field, dict) for field in feature_schema)
            or [field.get("name") for field in feature_schema] != feature_order):
        raise RuntimeError("feature_schema must match feature_order in selected_input_features.json")
    for field in feature_schema:
        if (not isinstance(field, dict)
                or not isinstance(field.get("name"), str)
                or field.get("kind") not in {"numeric", "categorical"}
                or not isinstance(field.get("label"), str)
                or not field["label"].strip()):
            field_name = field.get("name") if isinstance(field, dict) else "<invalid entry>"
            raise RuntimeError(f"Invalid UI metadata for feature {field_name}")
        if field["kind"] == "categorical":
            options = field.get("options")
            if (not isinstance(options, list) or not options
                    or any(not isinstance(option, dict)
                           or isinstance(option.get("value"), bool)
                           or not isinstance(option.get("value"), (int, float))
                           or not np.isfinite(option["value"])
                           or not isinstance(option.get("label"), str)
                           or not option["label"].strip()
                           for option in options)
                    or len({float(option["value"]) for option in options}) != len(options)):
                raise RuntimeError(f"Categorical feature {field['name']} has invalid options")
        else:
            for bound in ("min", "max"):
                value = field.get(bound)
                if (value is not None and
                        (isinstance(value, bool) or not isinstance(value, (int, float))
                         or not np.isfinite(value))):
                    raise RuntimeError(f"Numeric feature {field['name']} has invalid {bound}")
            if (field.get("min") is not None and field.get("max") is not None
                    and field["min"] > field["max"]):
                raise RuntimeError(f"Numeric feature {field['name']} has min greater than max")

    preprocessor = joblib.load(ASSETS_DIR / "preprocessor.pkl")
    with (ASSETS_DIR / "model_thresholds.json").open(encoding="utf-8") as file:
        thresholds = json.load(file)
    thresholds_are_valid = (
        isinstance(thresholds, dict)
        and set(thresholds) == set(MODEL_NAMES)
        and all(not isinstance(value, bool)
                and isinstance(value, (int, float))
                and np.isfinite(value)
                and 0 <= value <= 1
                for value in thresholds.values())
    )
    probability_calibrators = None
    if probability_method == "weighted_isotonic":
        calibrator_path = ASSETS_DIR / "probability_calibrators.pkl"
        if not calibrator_path.is_file():
            raise FileNotFoundError(
                f"Isotonic calibration bundle is missing: {calibrator_path}. "
                "Export and install the complete app_assets.zip from the updated Colab notebook."
            )
        try:
            probability_calibrators = joblib.load(calibrator_path)
        except Exception as error:
            raise RuntimeError(f"Could not load probability calibrators: {calibrator_path}") from error
        if (not isinstance(probability_calibrators, dict)
                or set(probability_calibrators) != set(MODEL_NAMES)
                or any(not callable(getattr(calibrator, "predict", None))
                       for calibrator in probability_calibrators.values())):
            raise RuntimeError("probability_calibrators.pkl must contain one calibrator per model")
        calibration_metadata_path = ASSETS_DIR / "probability_calibration.json"
        if not calibration_metadata_path.is_file():
            raise FileNotFoundError(
                f"Calibration metadata is missing: {calibration_metadata_path}"
            )
        with calibration_metadata_path.open(encoding="utf-8") as file:
            calibration_metadata = json.load(file)
        cutoff = calibration_metadata.get("threshold_cutoff")
        recorded_thresholds = calibration_metadata.get("model_thresholds")
        thresholds_match = (
            thresholds_are_valid
            and isinstance(recorded_thresholds, dict)
            and set(recorded_thresholds) == set(MODEL_NAMES)
            and all(
                isinstance(recorded_thresholds[name], (int, float))
                and not isinstance(recorded_thresholds[name], bool)
                and np.isfinite(recorded_thresholds[name])
                and 0 <= recorded_thresholds[name] <= 1
                and abs(float(recorded_thresholds[name]) - float(thresholds[name])) <= 1e-9
                for name in MODEL_NAMES
            )
        )
        if (thresholds_are_valid and recorded_thresholds is None
                and isinstance(cutoff, (int, float)) and not isinstance(cutoff, bool)):
            thresholds_match = all(abs(float(value) - float(cutoff)) <= 1e-9
                                    for value in thresholds.values())
        if (not isinstance(calibration_metadata.get("method"), str)
                or "isotonic" not in calibration_metadata["method"].lower()
                or calibration_metadata.get("threshold_score") != "raw_model_score"
                or not thresholds_are_valid
                or not thresholds_match):
            raise RuntimeError(
                "Calibration metadata, probability calibrators, and model thresholds do not match"
            )
        positive_weight_ratio = 1.0
    elif probability_method == "prior_correction":
        correction_path = ASSETS_DIR / "probability_correction.json"
        if not correction_path.is_file():
            raise FileNotFoundError(f"Probability correction metadata is missing: {correction_path}")
        with correction_path.open(encoding="utf-8") as file:
            probability_correction = json.load(file)
        positive_weight_ratio = probability_correction.get("positive_weight_ratio")
        if (isinstance(positive_weight_ratio, bool)
                or not isinstance(positive_weight_ratio, (int, float))
                or not np.isfinite(positive_weight_ratio)
                or positive_weight_ratio <= 0):
            raise RuntimeError("probability_correction.json has an invalid positive_weight_ratio")
    else:
        raise RuntimeError(f"Unsupported probability calibration method: {probability_method}")
    feature_names = np.load(ASSETS_DIR / "feature_names.npy", allow_pickle=True).tolist()
    if preprocessor.get_feature_names_out().tolist() != feature_names:
        raise RuntimeError("preprocessor.pkl does not match feature_names.npy")
    if set(thresholds) != set(MODEL_NAMES) or any(
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not 0 <= value <= 1
        for value in thresholds.values()
    ):
        raise RuntimeError("model_thresholds.json must define a valid threshold for each model")

    xgboost_path = ASSETS_DIR / "xgboost.pkl"
    if not xgboost_path.is_file():
        raise FileNotFoundError(
            f"Trained model is missing: {xgboost_path}. "
            "Restore xgboost.pkl from the same app_assets.zip as the other model assets."
        )
    try:
        xgboost_model = joblib.load(xgboost_path)
    except xgboost.core.XGBoostError as error:
        try:
            xgboost_model = load_xgboost_model_from_snapshot(
                xgboost_path, len(feature_names)
            )
        except Exception as recovery_error:
            raise RuntimeError(
                f"Could not load the trained XGBoost model at {xgboost_path}. "
                f"Original pickle error: {error}. "
                f"Loading its native model section also failed: {recovery_error}"
            ) from error
        logging.getLogger(__name__).warning(
            "Loaded the unchanged native XGBoost model section after the full "
            "pickle snapshot failed to load: %s",
            error,
        )
    except Exception as error:
        raise RuntimeError(
            f"Could not load the trained XGBoost model at {xgboost_path}. "
            "The backend will not substitute a newly trained model. "
            "Replace the complete assets bundle and install the versions in requirements.txt."
        ) from error
    if getattr(xgboost_model, "n_features_in_", None) != len(feature_names):
        raise RuntimeError(
            "xgboost.pkl does not match preprocessor.pkl/feature_names.npy "
            "(transformed feature count differs). Restore all files from one app_assets.zip."
        )

    models = {
        "random_forest": joblib.load(ASSETS_DIR / "random_forest.pkl"),
        "xgboost": xgboost_model,
        "ann": keras.models.load_model(ASSETS_DIR / "ann_model.keras", compile=False),
    }
    for name, model in models.items():
        input_count = getattr(model, "n_features_in_", None)
        if name == "ann":
            input_count = model.input_shape[-1]
        if input_count != len(feature_names):
            raise RuntimeError(f"{name} expects {input_count} features, expected {len(feature_names)}")

    probe_values = {}
    for field in feature_schema:
        if field["kind"] == "categorical":
            probe_values[field["name"]] = float(field["options"][0]["value"])
        else:
            low, high = field.get("min"), field.get("max")
            if low is not None and high is not None:
                probe_values[field["name"]] = (float(low) + float(high)) / 2
            elif low is not None:
                probe_values[field["name"]] = float(low)
            elif high is not None:
                probe_values[field["name"]] = float(high)
            else:
                probe_values[field["name"]] = 0.0
    probe = preprocessor.transform(
        prepare_features(probe_values, feature_order, feature_schema)
    )
    try:
        for name, model in models.items():
            if name != "ann" and list(np.asarray(model.classes_, dtype=int)) != [0, 1]:
                raise ValueError(f"{name} class order is not [0, 1]")
            scores = (
                np.asarray(model.predict(probe, verbose=0), dtype=float).reshape(-1)
                if name == "ann"
                else np.asarray(model.predict_proba(probe), dtype=float)[:, 1]
            )
            if scores.shape != (1,) or not np.isfinite(scores[0]) or not 0 <= scores[0] <= 1:
                raise ValueError(f"{name} returned an invalid probability for the startup probe")
            adjusted = adjust_probability(
                scores[0], name, probability_method, positive_weight_ratio,
                probability_calibrators,
            )
            if not np.isfinite(adjusted) or not 0 <= adjusted <= 1:
                raise ValueError(f"{name} calibration returned an invalid probability")
    except Exception as error:
        raise RuntimeError(
            "The trained model files do not form a working inference bundle. "
            "Restore all assets together from one app_assets.zip."
        ) from error
    return (preprocessor, models, thresholds, float(positive_weight_ratio),
            probability_method, probability_calibrators, feature_order, feature_schema)


@asynccontextmanager
async def lifespan(app: FastAPI):
    (app.state.preprocessor, app.state.models, app.state.thresholds,
     app.state.positive_weight_ratio, app.state.probability_method,
     app.state.probability_calibrators, app.state.feature_order,
     app.state.feature_schema) = load_models()
    yield


app = FastAPI(title="Heart Disease Prediction API", version="1.1.0", lifespan=lifespan)


@app.get("/health")
def health_check():
    ready = hasattr(app.state, "models")
    return {"status": "ok" if ready else "loading",
            "models": list(MODEL_NAMES) if ready else [],
            "probability_method": app.state.probability_method if ready else None,
            "decision_score": "raw_model_score" if ready else None,
            "thresholds": app.state.thresholds if ready else {}}


@app.get("/schema")
def get_input_schema():
    if not hasattr(app.state, "feature_schema"):
        raise HTTPException(status_code=503, detail="Prediction schema is not loaded")
    return {"feature_order": app.state.feature_order,
            "features": app.state.feature_schema}


@app.post("/predict")
def predict(request: PredictionRequest):
    if not hasattr(app.state, "models"):
        raise HTTPException(status_code=503, detail="Prediction models are not loaded")

    try:
        row = prepare_features(
            request.features, app.state.feature_order, app.state.feature_schema
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    try:
        transformed = app.state.preprocessor.transform(row)
        names = MODEL_NAMES if request.model == "all" else (request.model,)
        results = {}
        for name in names:
            model = app.state.models[name]
            if name == "ann":
                raw_probability = float(np.asarray(model.predict(transformed, verbose=0)).reshape(-1)[0])
            else:
                raw_probability = float(model.predict_proba(transformed)[0, 1])
            probability = adjust_probability(
                raw_probability, name, app.state.probability_method,
                app.state.positive_weight_ratio, app.state.probability_calibrators,
            )
            threshold = app.state.thresholds[name]
            # Use the same unadjusted model score for the displayed score and label.
            risk_score = raw_probability
            prediction = int(risk_score >= threshold)
            risk_level = describe_risk_score(risk_score)
            results[name] = {
                "risk_score": risk_score,
                "probability": probability,
                "threshold": threshold,
                "prediction": prediction,
                "risk_level": risk_level,
                "label": risk_level,
            }
        return {"model": request.model, "results": results}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail="Prediction failed") from error
