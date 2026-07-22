import logging
import mailtrap as mt
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    async def send_verification_email(email: str, token: str, first_name: str):
        if not settings.MAILTRAP_API_TOKEN:
            logger.warning("Mailtrap API Token not configured. Skipping verification email.")
            return

        # Ensure correct URL encoding or safe URL structure
        verification_link = f"http://localhost:3000/verify-email?token={token}"
        
        html = f"""
        <html>
            <body>
                <h2>Welcome to Ravabazar, {first_name}!</h2>
                <p>Please click the link below to verify your email address:</p>
                <p><a href="{verification_link}">{verification_link}</a></p>
                <p>If you did not create an account, please ignore this email.</p>
            </body>
        </html>
        """
        
        mail = mt.Mail(
            sender=mt.Address(email=settings.MAIL_FROM, name="Ravabazar"),
            to=[mt.Address(email=email)],
            subject="Verify your Ravabazar account",
            html=html,
            category="Account Verification",
        )
        
        client = mt.MailtrapClient(token=settings.MAILTRAP_API_TOKEN)
        
        try:
            # We can use the async client if preferred, or just run synchronous send
            response = client.send(mail)
            logger.info(f"Verification email sent to {email}. Response: {response}")
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")

    @staticmethod
    def send_order_success_email(email: str, first_name: str, order_id: int, amount: float):
        if not settings.MAILTRAP_API_TOKEN:
            logger.warning("Mailtrap API Token not configured. Skipping order success email.")
            return

        html = f"""
        <html>
            <body>
                <h2>Thank you for your order, {first_name}!</h2>
                <p>Your order #{order_id} has been successfully placed.</p>
                <p>Total amount: ${amount:.2f}</p>
                <p>You can track your order status in your account dashboard.</p>
                <p>Thank you for shopping with Ravabazar!</p>
            </body>
        </html>
        """
        
        mail = mt.Mail(
            sender=mt.Address(email=settings.MAIL_FROM, name="Ravabazar"),
            to=[mt.Address(email=email)],
            subject=f"Order Confirmation #{order_id}",
            html=html,
            category="Order Success",
        )
        
        client = mt.MailtrapClient(token=settings.MAILTRAP_API_TOKEN)
        
        try:
            response = client.send(mail)
            logger.info(f"Order success email sent to {email}. Response: {response}")
        except Exception as e:
            logger.error(f"Failed to send order success email to {email}: {e}")

    @staticmethod
    def send_order_cancellation_email(email: str, first_name: str, order_id: int):
        if not settings.MAILTRAP_API_TOKEN:
            logger.warning("Mailtrap API Token not configured. Skipping order cancellation email.")
            return

        html = f"""
        <html>
            <body>
                <h2>Order Cancelled</h2>
                <p>Hi {first_name},</p>
                <p>Your order #{order_id} has been cancelled.</p>
                <p>If you have any questions, please contact our support team.</p>
                <p>Thank you for shopping with Ravabazar!</p>
            </body>
        </html>
        """
        
        mail = mt.Mail(
            sender=mt.Address(email=settings.MAIL_FROM, name="Ravabazar"),
            to=[mt.Address(email=email)],
            subject=f"Order Cancelled #{order_id}",
            html=html,
            category="Order Cancellation",
        )
        
        client = mt.MailtrapClient(token=settings.MAILTRAP_API_TOKEN)
        
        try:
            response = client.send(mail)
            logger.info(f"Order cancellation email sent to {email}. Response: {response}")
        except Exception as e:
            logger.error(f"Failed to send order cancellation email to {email}: {e}")
