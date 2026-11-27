"""add position column for drag-and-drop reordering

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-26
"""

import sqlalchemy as sa

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("todos", sa.Column("position", sa.Float(), nullable=True))

    conn = op.get_bind()
    conn.execute(
        sa.text("""
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY owner_id ORDER BY created_at, id
                ) * 1024 AS pos
                FROM todos
            )
            UPDATE todos SET position = ranked.pos
            FROM ranked WHERE todos.id = ranked.id
        """)
    )

    op.alter_column("todos", "position", nullable=False)
    op.create_index("ix_todos_owner_position", "todos", ["owner_id", "position"])


def downgrade() -> None:
    op.drop_index("ix_todos_owner_position", table_name="todos")
    op.drop_column("todos", "position")
