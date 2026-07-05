"""Add refresh token storage.

Revision ID: b6d2f4a7c9e1
Revises: 34a211abb9bb
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa


revision = "b6d2f4a7c9e1"
down_revision = "34a211abb9bb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=255), nullable=False),
        sa.Column("subject_type", sa.String(length=20), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_refresh_tokens_id"), "refresh_tokens", ["id"], unique=False)
    op.create_index(op.f("ix_refresh_tokens_jti"), "refresh_tokens", ["jti"], unique=True)
    op.create_index(
        op.f("ix_refresh_tokens_subject_id"),
        "refresh_tokens",
        ["subject_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_refresh_tokens_subject_type"),
        "refresh_tokens",
        ["subject_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_refresh_tokens_subject_type"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_subject_id"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_jti"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_id"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
