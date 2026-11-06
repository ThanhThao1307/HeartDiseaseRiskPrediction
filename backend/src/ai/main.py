import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

os.environ.setdefault("KERAS_BACKEND", "tensorflow")

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

ASSETS_DIR = Path(__file__).resolve().parent / "assets"
FEATURE_ORDER = [
    "_AGE80",
    "_SEX",
    "_BMI5",
    "BPHIGH6",
    "TOLDHI3",
    "DIABETE4",
    "_SMOKER3",
    "EXERANY2",
    "GENHLTH",
    "PHYSHLTH",
    "DIFFWALK",
    "CVDSTRK3",
]
MODEL_NAMES = ("random_forest", "xgboost", "ann")
ModelChoice = Literal["all", "random_forest", "xgboost", "ann"]


class FeatureInput(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    age: int | None = Field(..., alias="_AGE80")
    sex: int | None = Field(..., alias="_SEX")
    bmi: float | None = Field(..., alias="_BMI5")
    high_blood_pressure: int | None = Field(..., alias="BPHIGH6")
    high_cholesterol: int | None = Field(..., alias="TOLDHI3")
    diabetes: int | None = Field(..., alias="DIABETE4")
    smoking_status: int | None = Field(..., alias="_SMOKER3")
    physical_activity: int | None = Field(..., alias="EXERANY2")
    general_health: int | None = Field(..., alias="GENHLTH")
    poor_physical_health_days: int | None = Field(..., alias="PHYSHLTH")
    difficulty_walking: int | None = Field(..., alias="DIFFWALK")
    stroke_history: int | None = Field(..., alias="CVDSTRK3")

    @field_validator("age")
    @classmethod
    def validate_age(cls, value):
        if value is not None and not 18 <= value <= 80:
            raise ValueError("_AGE80 must be between 18 and 80")
        return value

    @field_validator("bmi")
    @classmethod
    def validate_bmi(cls, value):
        if value is not None and (not np.isfinite(value) or value <= 0):
            raise ValueError("_BMI5 must be a positive BMI value")
        return value

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, value):
        return _validate_code(value, {1, 2}, "_SEX")

    @field_validator("high_blood_pressure")
    @classmethod
    def validate_blood_pressure(cls, value):
        return _validate_code(value, {1, 2, 3, 4, 7, 9}, "BPHIGH6")

    @field_validator("high_cholesterol")
    @classmethod
    def validate_cholesterol(cls, value):
        return _validate_code(value, {1, 2, 7, 9}, "TOLDHI3")

    @field_validator("diabetes")
    @classmethod
    def validate_diabetes(cls, value):
        return _validate_code(value, {1, 2, 3, 4, 7, 9}, "DIABETE4")

    @field_validator("smoking_status")
    @classmethod
    def validate_smoking(cls, value):
        return _validate_code(value, {1, 2, 3, 4, 9}, "_SMOKER3")

    @field_validator("physical_activity", "difficulty_walking", "stroke_history")
    @classmethod
    def validate_binary_survey_code(cls, value, info):
        return _validate_code(value, {1, 2, 7, 9}, info.field_name)

    @field_validator("general_health")
    @classmethod
    def validate_general_health(cls, value):
        return _validate_code(value, {1, 2, 3, 4, 5, 7, 9}, "GENHLTH")

    @field_validator("poor_physical_health_days")
    @classmethod
    def validate_health_days(cls, value):
        if value is not None and value not in {*range(31), 77, 88, 99}:
            raise ValueError("PHYSHLTH must be 0-30, 77, 88, or 99")
        return value


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    features: FeatureInput
    model: ModelChoice = "all"


def _validate_code(value, allowed, field_name):
    if value is not None and value not in allowed:
        raise ValueError(f"{field_name} has an unsupported survey code")
    return value


def prepare_features(features: FeatureInput) -> pd.DataFrame:
    row = features.model_dump(by_alias=True)
    row["_BMI5"] = row["_BMI5"] / 100

    for key in ("BPHIGH6", "DIABETE4", "GENHLTH"):
        if row[key] in (7, 9):
            row[key] = np.nan

    if row["TOLDHI3"] == 2:
        row["TOLDHI3"] = 0
    elif row["TOLDHI3"] in (7, 9):
        row["TOLDHI3"] = np.nan

    if row["_SMOKER3"] == 9:
        row["_SMOKER3"] = np.nan

    if row["EXERANY2"] == 2:
        row["EXERANY2"] = 0
    elif row["EXERANY2"] in (7, 9):
        row["EXERANY2"] = np.nan

    if row["PHYSHLTH"] == 88:
        row["PHYSHLTH"] = 0
    elif row["PHYSHLTH"] in (77, 99):
        row["PHYSHLTH"] = np.nan

    for key in ("DIFFWALK", "CVDSTRK3"):
        if row[key] == 2:
            row[key] = 0
        elif row[key] in (7, 9):
            row[key] = np.nan

    return pd.DataFrame([[row[name] for name in FEATURE_ORDER]], columns=FEATURE_ORDER)


def load_models():
    import keras

    preprocessor = joblib.load(ASSETS_DIR / "preprocessor.pkl")
    with (ASSETS_DIR / "model_thresholds.json").open(encoding="utf-8") as file:
        thresholds = json.load(file)
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

    models = {
        "random_forest": joblib.load(ASSETS_DIR / "random_forest.pkl"),
        "xgboost": joblib.load(ASSETS_DIR / "xgboost.pkl"),
        "ann": keras.models.load_model(ASSETS_DIR / "ann_model.keras", compile=False),
    }
    for name, model in models.items():
        input_count = getattr(model, "n_features_in_", None)
        if name == "ann":
            input_count = model.input_shape[-1]
        if input_count != len(feature_names):
            raise RuntimeError(f"{name} expects {input_count} features, expected {len(feature_names)}")
    return preprocessor, models, thresholds


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.preprocessor, app.state.models, app.state.thresholds = load_models()
    yield


app = FastAPI(title="Heart Disease Prediction API", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health_check():
    ready = hasattr(app.state, "models")
    return {"status": "ok" if ready else "loading", "models": list(MODEL_NAMES) if ready else []}


@app.post("/predict")
def predict(request: PredictionRequest):
    if not hasattr(app.state, "models"):
        raise HTTPException(status_code=503, detail="Prediction models are not loaded")

    try:
        row = prepare_features(request.features)
        transformed = app.state.preprocessor.transform(row)
        names = MODEL_NAMES if request.model == "all" else (request.model,)
        results = {}
        for name in names:
            model = app.state.models[name]
            if name == "ann":
                probability = float(np.asarray(model.predict(transformed, verbose=0)).reshape(-1)[0])
            else:
                probability = float(model.predict_proba(transformed)[0, 1])
            threshold = app.state.thresholds[name]
            prediction = int(probability >= threshold)
            results[name] = {
                "probability": probability,
                "threshold": threshold,
                "prediction": prediction,
                "label": (
                    "Tín hiệu sàng lọc dương tính"
                    if prediction
                    else "Không phát hiện tín hiệu ở ngưỡng này"
                ),
            }
        return {"model": request.model, "results": results}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail="Prediction failed") from error