from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.services.shiprocket_webhooks import ShiprocketWebhookService

router = APIRouter()


@router.post("/webhook")
async def shiprocket_webhook(
    request: Request,
    x_shiprocket_signature: str | None = Header(None, alias="X-Shiprocket-Signature"),
    x_shiprocket_webhook_secret: str | None = Header(None, alias="X-Shiprocket-Webhook-Secret"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    return ShiprocketWebhookService(db).handle(
        raw_body=raw_body,
        signature=x_shiprocket_signature,
        token=x_shiprocket_webhook_secret,
    )
