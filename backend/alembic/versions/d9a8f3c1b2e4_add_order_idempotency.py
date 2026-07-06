"""Add order idempotency fields.

Revision ID: d9a8f3c1b2e4
Revises: c4f8a2d9e7b1
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa


revision = "d9a8f3c1b2e4"
down_revision = "c4f8a2d9e7b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("idempotency_key", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("idempotency_request_hash", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "ix_orders_user_id_idempotency_key",
        "orders",
        ["user_id", "idempotency_key"],
        unique=True,
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_orders_user_id_idempotency_key", table_name="orders")
    op.drop_column("orders", "idempotency_request_hash")
    op.drop_column("orders", "idempotency_key")
