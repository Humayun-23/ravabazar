import asyncio
import os
import sys

# Add the backend directory to Python path so it can find the 'app' module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.email import EmailService

async def main():
    print("Testing email service...")
    
    # We will send a test email to a dummy address. 
    # If you are using Mailtrap's live sending, you can check your Mailtrap logs.
    test_email = "ravabazar@gmail.com"
    
    try:
        await EmailService.send_verification_email(
            email=test_email,
            token="test-token-123",
            first_name="Humayun"
        )
        print("Test complete! Check your Mailtrap dashboard to see if it sent successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
