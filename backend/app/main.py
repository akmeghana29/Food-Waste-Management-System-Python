
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.prediction import router as prediction_router
from app.routes.history import router as history_router


app = FastAPI(
    title="Food Waste Management System API",
    description="Backend API for food waste prediction and management",
    version="1.0.0"
)

# Allow local development and the deployed frontend
frontend_url = os.getenv("FRONTEND_URL", "")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Food Waste Management System API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "Backend is healthy"
    }


app.include_router(prediction_router)
app.include_router(history_router)
