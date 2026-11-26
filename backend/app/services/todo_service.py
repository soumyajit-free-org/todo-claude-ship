import base64
import json
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate


class TodoNotFoundError(Exception):
    pass


def create_todo(db: Session, user: User, data: TodoCreate) -> Todo:
    max_pos = db.scalar(
        select(func.max(Todo.position)).where(
            Todo.owner_id == user.id, Todo.deleted_at.is_(None)
        )
    )
    todo = Todo(
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        priority=data.priority.value,
        position=(max_pos or 0) + 1024,
        owner_id=user.id,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def get_todos(
    db: Session,
    user: User,
    completed: bool | None = None,
    q: str | None = None,
    priority: str | None = None,
    due: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    cursor: str | None = None,
    limit: int = 50,
) -> tuple[list[Todo], str | None, int]:
    base = select(Todo).where(Todo.owner_id == user.id, Todo.deleted_at.is_(None))

    if completed is not None:
        base = base.where(Todo.is_completed.is_(completed))

    if q:
        pattern = f"%{_escape_like(q[:100])}%"
        base = base.where(Todo.title.ilike(pattern))

    if priority and priority in ("low", "medium", "high"):
        base = base.where(Todo.priority == priority)

    if due:
        today = date.today()
        if due == "overdue":
            base = base.where(Todo.due_date < today, Todo.is_completed.is_(False))
        elif due == "today":
            base = base.where(Todo.due_date == today)
        elif due == "upcoming":
            end = today + timedelta(days=7)
            base = base.where(Todo.due_date > today, Todo.due_date <= end)
        elif due == "none":
            base = base.where(Todo.due_date.is_(None))

    total_count = db.scalar(select(func.count()).select_from(base.subquery()))

    sort_col_map = {
        "created_at": Todo.created_at,
        "due_date": Todo.due_date,
        "priority": Todo.priority,
        "position": Todo.position,
    }
    sort_col = sort_col_map.get(sort, Todo.created_at)
    if order == "asc":
        ordered = base.order_by(sort_col.asc(), Todo.id.asc())
    else:
        ordered = base.order_by(sort_col.desc(), Todo.id.desc())

    if cursor:
        try:
            decoded = json.loads(base64.urlsafe_b64decode(cursor))
            cursor_val = decoded["v"]
            cursor_id = decoded["id"]
            if order == "asc":
                ordered = ordered.where(
                    (sort_col > cursor_val) | ((sort_col == cursor_val) & (Todo.id > cursor_id))
                )
            else:
                ordered = ordered.where(
                    (sort_col < cursor_val) | ((sort_col == cursor_val) & (Todo.id < cursor_id))
                )
        except Exception:
            pass

    items = list(db.scalars(ordered.limit(limit + 1)))

    next_cursor = None
    if len(items) > limit:
        items = items[:limit]
        last = items[-1]
        sort_val = getattr(last, sort if sort in sort_col_map else "created_at")
        if isinstance(sort_val, (datetime, date)):
            sort_val = sort_val.isoformat()
        payload = json.dumps({"v": sort_val, "id": last.id})
        next_cursor = base64.urlsafe_b64encode(payload.encode()).decode()

    return items, next_cursor, total_count or 0


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
        if field == "priority" and value is not None:
            value = value.value if hasattr(value, "value") else value
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


def update_position(
    db: Session, user: User, todo_id: int, before_id: int | None, after_id: int | None
) -> Todo:
    todo = _get_owned_todo(db, user, todo_id)

    if before_id is None and after_id is None:
        raise ValueError("Must provide before_id or after_id")

    before_pos = None
    after_pos = None

    if before_id is not None:
        before_todo = _get_owned_todo(db, user, before_id)
        before_pos = before_todo.position

    if after_id is not None:
        after_todo = _get_owned_todo(db, user, after_id)
        after_pos = after_todo.position

    if before_pos is not None and after_pos is not None:
        new_pos = (before_pos + after_pos) / 2
    elif before_pos is not None:
        new_pos = before_pos + 1024
    else:
        new_pos = after_pos - 1024  # type: ignore[operator]

    todo.position = new_pos
    db.commit()
    db.refresh(todo)

    if before_pos is not None and after_pos is not None and abs(before_pos - after_pos) < 1e-10:
        _rebalance(db, user)
        db.refresh(todo)

    return todo


def _rebalance(db: Session, user: User) -> None:
    todos = list(
        db.scalars(
            select(Todo)
            .where(Todo.owner_id == user.id, Todo.deleted_at.is_(None))
            .order_by(Todo.position, Todo.id)
        )
    )
    for i, t in enumerate(todos):
        t.position = (i + 1) * 1024
    db.commit()


def delete_todo(db: Session, user: User, todo_id: int) -> None:
    todo = _get_owned_todo(db, user, todo_id)
    todo.deleted_at = datetime.now(UTC)
    db.commit()
