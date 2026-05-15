from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# For SQLite, we need connect_args, for Postgres we don't.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String) # Stores hashed password
    role = Column(String, default="student") # 'student' or 'admin'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to sessions
    sessions = relationship("ExamSession", back_populates="user")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    difficulty = Column(String, index=True)
    problem_statement = Column(Text)
    input_format = Column(Text)
    output_format = Column(Text)
    constraints = Column(Text)
    sample_io = Column(Text)
    test_cases = Column(Text, nullable=True) # JSON array of test cases
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String, index=True)
    mode = Column(String)
    difficulty = Column(String)
    current_score = Column(Integer, default=0)
    questions_attempted = Column(Integer, default=0)
    total_questions = Column(Integer)
    is_active = Column(Integer, default=1) # 1 for active, 0 for finished
    is_violated = Column(Integer, default=0) # 1 if disqualified
    violation_reason = Column(String, nullable=True)
    history = Column(Text, default="[]") # JSON string of history
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    # Relationship to user
    user = relationship("User", back_populates="sessions")

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        print("Please check your DATABASE_URL in .env and ensure PostgreSQL is running.")
