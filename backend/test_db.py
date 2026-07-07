from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    db.execute("SELECT * FROM orders WHERE orders.user_id = 3 AND orders.idempotency_key = 'cd7c834c-ff21-4f3e-9a41-bc9db2e38bf4' LIMIT 1")
    print("Direct SQL successful")
except Exception as e:
    print(e)
