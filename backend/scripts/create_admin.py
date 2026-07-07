import sys
import os
import argparse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.admins import Admin
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_admin(email: str, password: str, full_name: str, role: str = "superadmin"):
    db: Session = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == email).first()
        if existing_admin:
            print(f"Error: An admin with email {email} already exists.")
            return

        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        hashed_password = get_password_hash(password)
        new_admin = Admin(
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            is_active=True
        )

        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

        print(f"Success! Admin account created:")
        print(f"  ID: {new_admin.id}")
        print(f"  Email: {new_admin.email}")
        print(f"  Name: {new_admin.first_name} {new_admin.last_name}")
        print(f"  Role: {new_admin.role}")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new admin user.")
    parser.add_argument("--email", required=True, help="The email address for the admin.")
    parser.add_argument("--password", required=True, help="The password for the admin.")
    parser.add_argument("--name", required=True, help="The full name of the admin.")
    parser.add_argument("--role", default="superadmin", help="The role of the admin (default: superadmin).")

    args = parser.parse_args()

    create_admin(
        email=args.email,
        password=args.password,
        full_name=args.name,
        role=args.role
    )
