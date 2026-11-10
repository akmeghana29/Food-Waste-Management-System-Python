from pathlib import Path

import joblib
import numpy as np


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "final_model_FWMS.pkl"
FEATURES_PATH = MODEL_DIR / "feature_names_FWMS.pkl"


# Load the trained model and its feature names
model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURES_PATH)


def predict_food_waste(data: dict) -> float:
    """
    Predict food waste quantity using the trained ML model.
    """

    missing_features = [
        feature for feature in feature_names
        if feature not in data
    ]

    if missing_features:
        raise ValueError(
            f"Missing input features: {missing_features}"
        )

    features = [
        float(data[feature])
        for feature in feature_names
    ]

    input_array = np.array(features).reshape(1, -1)

    prediction = float(model.predict(input_array)[0])

    return round(max(0, prediction), 2)