from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


class EmailAlreadyRegisteredError(Exception):
    pass


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def create_user(db: Session, data: UserCreate) -> User:
    if get_user_by_email(db, data.email) is not None:
        raise EmailAlreadyRegisteredError
    user = User(email=data.email.lower(), hashed_password=hash_password(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError from exc
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user
