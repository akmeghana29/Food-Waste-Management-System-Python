
from fastapi import APIRouter, Query

from app.database.connection import predictions_collection


router = APIRouter(
    prefix="/api",
    tags=["Prediction History"]
)


@router.get("/history")
def get_prediction_history(
    limit: int = Query(default=50, ge=1, le=500)
):
    records = list(
        predictions_collection
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    history = []

    for record in records:
        history.append({
            "record_id": str(record["_id"]),
            "input_data": record["input_data"],
            "predicted_food_waste": record["predicted_food_waste"],
            "unit": record["unit"],
            "created_at": record["created_at"]
        })

    return {
        "success": True,
        "count": len(history),
        "history": history
    }



@router.get("/dashboard-stats")
def get_dashboard_stats():

    total_predictions = predictions_collection.count_documents({})

    pipeline = [
        {
            "$group": {
                "_id": None,
                "average_waste": {
                    "$avg": "$predicted_food_waste"
                },
                "highest_waste": {
                    "$max": "$predicted_food_waste"
                }
            }
        }
    ]

    result = list(predictions_collection.aggregate(pipeline))

    if result:
        average_waste = round(result[0]["average_waste"], 2)
        highest_waste = round(result[0]["highest_waste"], 2)
    else:
        average_waste = 0
        highest_waste = 0

    latest_record = predictions_collection.find_one(
        sort=[("created_at", -1)]
    )

    latest_prediction = None

    if latest_record:
        latest_prediction = {
            "predicted_food_waste": latest_record["predicted_food_waste"],
            "unit": latest_record["unit"],
            "created_at": latest_record["created_at"]
        }

    return {
        "success": True,
        "total_predictions": total_predictions,
        "average_waste": average_waste,
        "highest_waste": highest_waste,
        "latest_prediction": latest_prediction
    }
