
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.schemas.prediction import PredictionRequest
from app.services.model_service import predict_food_waste
from app.database.connection import predictions_collection


router = APIRouter(
    prefix="/api",
    tags=["Prediction"]
)


@router.post("/predict")
def predict(request: PredictionRequest):

    try:
        input_data = request.model_dump()

        prediction = predict_food_waste(input_data)

        # Save prediction to MongoDB
        prediction_record = {
            "input_data": input_data,
            "predicted_food_waste": prediction,
            "unit": "kg",
            "created_at": datetime.now(timezone.utc)
        }

        result = predictions_collection.insert_one(
            prediction_record
        )

        return {
            "success": True,
            "record_id": str(result.inserted_id),
            "predicted_food_waste": prediction,
            "unit": "kg",
            "message": "Prediction saved successfully"
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Prediction or database operation failed."
        )
