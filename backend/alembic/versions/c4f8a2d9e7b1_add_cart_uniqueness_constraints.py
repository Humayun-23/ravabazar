"""Add cart uniqueness constraints.

Revision ID: c4f8a2d9e7b1
Revises: b6d2f4a7c9e1
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa


revision = "c4f8a2d9e7b1"
down_revision = "b6d2f4a7c9e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_carts_unique_user_id",
        "carts",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )
    op.create_index(
        "ix_carts_unique_session_id",
        "carts",
        ["session_id"],
        unique=True,
        postgresql_where=sa.text("session_id IS NOT NULL"),
    )
    op.create_unique_constraint(
        "uq_cart_items_cart_id_product_id",
        "cart_items",
        ["cart_id", "product_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_cart_items_cart_id_product_id",
        "cart_items",
        type_="unique",
    )
    op.drop_index("ix_carts_unique_session_id", table_name="carts")
    op.drop_index("ix_carts_unique_user_id", table_name="carts")
