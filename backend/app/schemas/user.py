from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.types import UTCDatetime


class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: UTCDatetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
