"""add due_date and priority columns

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-26
"""

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("todos", sa.Column("due_date", sa.Date(), nullable=True))
    op.add_column(
        "todos",
        sa.Column(
            "priority",
            sa.String(6),
            nullable=False,
            server_default="medium",
        ),
    )
    op.create_check_constraint(
        "ck_todos_priority",
        "todos",
        "priority IN ('low', 'medium', 'high')",
    )
    op.create_index("ix_todos_owner_due_date", "todos", ["owner_id", "due_date"])


def downgrade() -> None:
    op.drop_index("ix_todos_owner_due_date", table_name="todos")
    op.drop_constraint("ck_todos_priority", "todos", type_="check")
    op.drop_column("todos", "priority")
    op.drop_column("todos", "due_date")
