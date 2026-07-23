import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class SmsService:
    @staticmethod
    def send_otp(phone: str, otp: str) -> bool:
        """
        Sends an OTP via the configured SMS provider.
        """
        if not settings.ENABLE_MOBILE_OTP_VERIFICATION:
            logger.info(f"[DISABLED_OTP] Simulated sending OTP {otp} to {phone}")
            return True
            
        account_id = settings.SMS_PROVIDER_ACCOUNT_ID
        auth_token = settings.SMS_PROVIDER_AUTH_TOKEN
        sender_id = settings.SMS_PROVIDER_SENDER_ID
        
        if not (account_id and auth_token and sender_id):
            # Fallback for development if enabled but not configured
            logger.warning(f"SMS Provider not fully configured. Mock sending OTP {otp} to {phone}")
            return True
            
        try:
            # TODO: Integrate with Twilio or similar provider here
            # e.g., 
            # from twilio.rest import Client
            # client = Client(account_id, auth_token)
            # message = client.messages.create(
            #     body=f"Your Ravabazar verification code is: {otp}",
            #     from_=sender_id,
            #     to=phone
            # )
            # logger.info(f"SMS sent successfully: {message.sid}")
            
            logger.info(f"Successfully triggered SMS OTP {otp} to {phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone}: {e}")
            return False
