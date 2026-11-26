from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.types import UTCDatetime


def _clean_title(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Title must not be empty")
    return value


class TodoCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = None

    _check_title = field_validator("title")(_clean_title)


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    is_completed: bool | None = None

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
    created_at: UTCDatetime
