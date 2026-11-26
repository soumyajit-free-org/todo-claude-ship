"""initial users and todos

Revision ID: 0001
Revises:
Create Date: 2026-11-26
"""

import sqlalchemy as sa

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "todos",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_todos_owner_id", "todos", ["owner_id"])
    op.create_index("ix_todos_is_completed", "todos", ["is_completed"])
    op.create_index("ix_todos_deleted_at", "todos", ["deleted_at"])
    op.create_index("ix_todos_owner_id_deleted_at", "todos", ["owner_id", "deleted_at"])


def downgrade() -> None:
    op.drop_table("todos")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
