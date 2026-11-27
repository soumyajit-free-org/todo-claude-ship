from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import (
    PaginatedTodoResponse,
    PositionUpdate,
    TodoCreate,
    TodoResponse,
    TodoUpdate,
)
from app.services import todo_service

router = APIRouter(prefix="/todos", tags=["todos"])

def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")


@router.get(
    "",
    response_model=PaginatedTodoResponse,
    summary="List todos with filtering, sorting and pagination",
)
def list_todos(
    completed: bool | None = None,
    q: str | None = Query(default=None, max_length=100),
    priority: str | None = Query(default=None, pattern="^(low|medium|high)$"),
    due: str | None = Query(default=None, pattern="^(overdue|today|upcoming|none)$"),
    sort: str = Query(default="position", pattern="^(created_at|due_date|priority|position)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    cursor: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    items, next_cursor, total_count = todo_service.get_todos(
        db, current_user,
        completed=completed, q=q, priority=priority, due=due,
        sort=sort, order=order, cursor=cursor, limit=limit,
    )
    return {
        "items": items,
        "next_cursor": next_cursor,
        "total_count": total_count,
    }


@router.post(
    "",
    response_model=TodoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new todo",
)
def create_todo(
    data: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Todo:
    return todo_service.create_todo(db, current_user, data)


@router.put("/{todo_id}", response_model=TodoResponse, summary="Update an existing todo")
def update_todo(
    todo_id: int,
    data: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Todo:
    try:
        return todo_service.update_todo(db, current_user, todo_id, data)
    except todo_service.TodoNotFoundError:
        raise not_found() from None


@router.patch(
    "/{todo_id}/position",
    response_model=TodoResponse,
    summary="Reorder a todo relative to its neighbors",
)
def update_position(
    todo_id: int,
    data: PositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Todo:
    if data.before_id is None and data.after_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide before_id or after_id",
        )
    try:
        return todo_service.update_position(
            db, current_user, todo_id, data.before_id, data.after_id,
        )
    except todo_service.TodoNotFoundError:
        raise not_found() from None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from None


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Soft-delete a todo")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        todo_service.delete_todo(db, current_user, todo_id)
    except todo_service.TodoNotFoundError:
        raise not_found() from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
