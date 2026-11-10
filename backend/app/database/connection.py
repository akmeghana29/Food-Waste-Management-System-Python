import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

if not MONGODB_URL or not DATABASE_NAME:
    raise ValueError("MongoDB environment variables are missing.")

client = MongoClient(
    MONGODB_URL,
    authSource="admin",
    serverSelectionTimeoutMS=5000
)

database = client[DATABASE_NAME]


def test_database_connection():
    client.admin.command("ping")
    return True

predictions_collection = database["predictions"]