from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoResponse, TodoUpdate
from app.services import todo_service

router = APIRouter(prefix="/todos", tags=["todos"])

NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")


@router.get("", response_model=list[TodoResponse])
def list_todos(
    completed: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Todo]:
    return todo_service.get_todos(db, current_user, completed)


@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
    data: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Todo:
    return todo_service.create_todo(db, current_user, data)


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    data: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Todo:
    try:
        return todo_service.update_todo(db, current_user, todo_id, data)
    except todo_service.TodoNotFoundError:
        raise NOT_FOUND from None


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        todo_service.delete_todo(db, current_user, todo_id)
    except todo_service.TodoNotFoundError:
        raise NOT_FOUND from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
