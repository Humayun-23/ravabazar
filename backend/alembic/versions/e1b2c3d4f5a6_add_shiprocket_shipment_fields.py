"""Add Shiprocket shipment fields.

Revision ID: e1b2c3d4f5a6
Revises: 106ce1d46768
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e1b2c3d4f5a6"
down_revision = "106ce1d46768"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("shipments", sa.Column("provider", sa.String(length=50), nullable=True))
    op.add_column("shipments", sa.Column("provider_order_id", sa.String(length=255), nullable=True))
    op.add_column("shipments", sa.Column("provider_shipment_id", sa.String(length=255), nullable=True))
    op.add_column("shipments", sa.Column("awb_number", sa.String(length=255), nullable=True))
    op.add_column("shipments", sa.Column("courier_company", sa.String(length=100), nullable=True))
    op.add_column("shipments", sa.Column("courier_company_id", sa.String(length=100), nullable=True))
    op.add_column("shipments", sa.Column("label_url", sa.String(length=500), nullable=True))
    op.add_column("shipments", sa.Column("invoice_url", sa.String(length=500), nullable=True))
    op.add_column("shipments", sa.Column("tracking_url", sa.String(length=500), nullable=True))
    op.add_column("shipments", sa.Column("pickup_token_number", sa.String(length=255), nullable=True))
    op.add_column(
        "shipments",
        sa.Column(
            "raw_provider_payload",
            postgresql.JSONB().with_variant(sa.JSON(), "sqlite"),
            nullable=True,
        ),
    )
    op.add_column("shipments", sa.Column("shipped_at", sa.DateTime(), nullable=True))
    op.add_column("shipments", sa.Column("delivered_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("shipments", "delivered_at")
    op.drop_column("shipments", "shipped_at")
    op.drop_column("shipments", "raw_provider_payload")
    op.drop_column("shipments", "pickup_token_number")
    op.drop_column("shipments", "tracking_url")
    op.drop_column("shipments", "invoice_url")
    op.drop_column("shipments", "label_url")
    op.drop_column("shipments", "courier_company_id")
    op.drop_column("shipments", "courier_company")
    op.drop_column("shipments", "awb_number")
    op.drop_column("shipments", "provider_shipment_id")
    op.drop_column("shipments", "provider_order_id")
    op.drop_column("shipments", "provider")
