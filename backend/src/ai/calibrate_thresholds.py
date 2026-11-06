"""Tune per-model F2 thresholds on a calibration split and report held-out metrics."""

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    fbeta_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

ASSETS_DIR = Path(__file__).resolve().parent / "assets"
RANDOM_STATE = 42


def get_probabilities(models, features):
    import keras

    models["ann"] = keras.models.load_model(ASSETS_DIR / "ann_model.keras", compile=False)
    probabilities = {}
    for name, model in models.items():
        if name == "ann":
            probabilities[name] = np.asarray(model.predict(features, verbose=0)).reshape(-1)
        else:
            probabilities[name] = model.predict_proba(features)[:, 1]
    return probabilities


def select_f2_threshold(labels, probabilities):
    precision, recall, thresholds = precision_recall_curve(labels, probabilities)
    f2_scores = 5 * precision[:-1] * recall[:-1] / (
        4 * precision[:-1] + recall[:-1] + 1e-12
    )
    best_score = f2_scores.max()
    best_index = np.flatnonzero(np.isclose(f2_scores, best_score))[-1]
    return float(thresholds[best_index]), float(best_score)


def main():
    features = np.load(ASSETS_DIR / "X_test.npy")
    labels = np.load(ASSETS_DIR / "y_test.npy").reshape(-1).astype(int)
    calibration_indices, evaluation_indices = train_test_split(
        np.arange(len(labels)),
        test_size=0.5,
        random_state=RANDOM_STATE,
        stratify=labels,
    )

    models = {
        "random_forest": joblib.load(ASSETS_DIR / "random_forest.pkl"),
        "xgboost": joblib.load(ASSETS_DIR / "xgboost.pkl"),
    }
    probabilities = get_probabilities(models, features)
    thresholds = {}

    for name, model_probabilities in probabilities.items():
        threshold, validation_f2 = select_f2_threshold(
            labels[calibration_indices],
            model_probabilities[calibration_indices],
        )
        thresholds[name] = threshold
        predictions = model_probabilities[evaluation_indices] >= threshold
        test_labels = labels[evaluation_indices]
        print(
            f"{name}: threshold={threshold:.6f}, "
            f"validation_F2={validation_f2:.4f}, "
            f"evaluation_accuracy={accuracy_score(test_labels, predictions):.4f}, "
            f"evaluation_precision={precision_score(test_labels, predictions, zero_division=0):.4f}, "
            f"evaluation_recall={recall_score(test_labels, predictions, zero_division=0):.4f}, "
            f"evaluation_F1={f1_score(test_labels, predictions, zero_division=0):.4f}, "
            f"evaluation_F2={fbeta_score(test_labels, predictions, beta=2, zero_division=0):.4f}, "
            f"evaluation_ROC_AUC={roc_auc_score(test_labels, model_probabilities[evaluation_indices]):.4f}"
        )

    output_path = ASSETS_DIR / "model_thresholds.json"
    output_path.write_text(
        json.dumps(thresholds, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Saved thresholds to assets/model_thresholds.json")


if __name__ == "__main__":
    main()
