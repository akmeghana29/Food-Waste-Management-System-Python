from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    week_number: int = Field(ge=1, le=53)
    month: int = Field(ge=1, le=12)
    is_weekend: int = Field(ge=0, le=1)
    is_holiday: int = Field(ge=0, le=1)
    is_vacation_period: int = Field(ge=0, le=1)
    is_event_day: int = Field(ge=0, le=1)
    hostel_capacity: float = Field(gt=0)
    students_present: float = Field(ge=0)
    prev_day_same_meal_consumed_kg: float = Field(ge=0)
    last_7_days_avg_consumed_kg: float = Field(ge=0)
    last_7_days_avg_wasted_kg: float = Field(ge=0)
    menu_category_encoded: int = Field(ge=0)
    meal_Breakfast: int = Field(ge=0, le=1)
    meal_Brunch: int = Field(ge=0, le=1)
    meal_Dinner: int = Field(ge=0, le=1)
    meal_Lunch: int = Field(ge=0, le=1)
    meal_Snacks: int = Field(ge=0, le=1)
    event_College_Event: int = Field(ge=0, le=1)
    event_Festival: int = Field(ge=0, le=1)
    day_of_week_encoded: int = Field(ge=0)