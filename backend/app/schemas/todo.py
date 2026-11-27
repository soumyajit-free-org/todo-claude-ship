from datetime import date
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.types import UTCDatetime


class Priority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


def _clean_title(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Title must not be empty")
    return value


class TodoCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    due_date: date | None = None
    priority: Priority = Priority.medium

    _check_title = field_validator("title")(_clean_title)


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool | None = None
    due_date: date | None = None
    priority: Priority | None = None

    @field_validator("title")
    @classmethod
    def _check_title(cls, value: str | None) -> str | None:
        return None if value is None else _clean_title(value)


class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    is_completed: bool
    due_date: date | None
    priority: str
    position: float
    created_at: UTCDatetime


class PositionUpdate(BaseModel):
    before_id: int | None = None
    after_id: int | None = None


class PaginatedTodoResponse(BaseModel):
    items: list[TodoResponse]
    next_cursor: str | None = None
    total_count: int
