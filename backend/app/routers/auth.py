from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)) -> User:
    try:
        return user_service.create_user(db, data)
    except user_service.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        ) from None


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = user_service.authenticate_user(db, form.username, form.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
