from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Todo(Base):
    __tablename__ = "todos"
    __table_args__ = (
        Index("ix_todos_owner_id_deleted_at", "owner_id", "deleted_at"),
        Index("ix_todos_owner_due_date", "owner_id", "due_date"),
        Index("ix_todos_owner_position", "owner_id", "position"),
        CheckConstraint("priority IN ('low', 'medium', 'high')", name="ck_todos_priority"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[str] = mapped_column(
        String(6), nullable=False, default="medium", server_default="medium"
    )
    position: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    owner = relationship("User", back_populates="todos")
