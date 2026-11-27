from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate


class TodoNotFoundError(Exception):
    pass


def create_todo(db: Session, user: User, data: TodoCreate) -> Todo:
    todo = Todo(title=data.title, description=data.description, owner_id=user.id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def get_todos(db: Session, user: User, completed: bool | None = None) -> list[Todo]:
    stmt = select(Todo).where(Todo.owner_id == user.id, Todo.deleted_at.is_(None))
    if completed is not None:
        stmt = stmt.where(Todo.is_completed.is_(completed))
    stmt = stmt.order_by(Todo.created_at.desc(), Todo.id.desc())
    return list(db.scalars(stmt))


def _get_owned_todo(db: Session, user: User, todo_id: int) -> Todo:
    todo = db.scalar(
        select(Todo).where(Todo.id == todo_id, Todo.owner_id == user.id, Todo.deleted_at.is_(None))
    )
    if todo is None:
        raise TodoNotFoundError
    return todo


def update_todo(db: Session, user: User, todo_id: int, data: TodoUpdate) -> Todo:
    todo = _get_owned_todo(db, user, todo_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if field in ("title", "is_completed") and value is None:
            continue
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


def delete_todo(db: Session, user: User, todo_id: int) -> None:
    todo = _get_owned_todo(db, user, todo_id)
    todo.deleted_at = datetime.now(UTC)
    db.commit()
