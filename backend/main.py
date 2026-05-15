from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, init_db, Question, ExamSession, User
from services.groq_service import generate_programming_question, evaluate_viva_response
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext
import datetime
import json
import requests

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

app = FastAPI(title="AI Programming Practice Platform")

# CORS setup for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class QuestionRequest(BaseModel):
    subject: str
    difficulty: str
    q_type: Optional[str] = "coding"

@app.get("/subjects")
def get_subjects():
    return [
        # Year I
        "Linear Algebra & Ordinary Differential Equations",
        "Semiconductor Physics & Electromagnetics",
        "Electrical & Electronics Engineering",
        "Engineering Chemistry",
        "Problem Solving through Programming - I",
        "English Proficiency & Communication Skills",
        "Constitution of India",
        "Algebra",
        "Discrete Mathematical Structures",
        "Engineering Graphics",
        "Python Programming",
        "Problem Solving through Programming - II",
        "Technical English Communication",
        "Numerical Methods",
        # Year II
        "Probability & Statistics",
        "Data Structures",
        "Management Science",
        "Database Management Systems",
        "Digital Logic Design",
        "OOPs through JAVA",
        "Environmental Studies",
        "Advanced Coding Consistency",
        "Professional Communication",
        "Computer Organisation & Architecture",
        "Design & Analysis of Algorithms",
        "Operating Systems",
        "Theory of Computation",
        # Year III
        "Soft Skills Laboratory",
        "Introduction to Artificial Intelligence",
        "Compiler Design",
        "Web Technologies",
        "Mini Project - Phase I",
        "Quantitative Aptitude & Logical Reasoning",
        "Computer Networks",
        "Data Mining & Intelligence",
        "Software Engineering",
        "Mini Project - Phase II",
        # Year IV
        "Cryptography & Network Security",
        "Big Data Analytics",
        "Cloud Computing",
        "Project Work",
        # Department Electives
        "Advanced Data Structures",
        "Advanced JAVA Programming",
        "Computer Graphics",
        "Deep Learning",
        "Digital Forensics",
        "Digital Image Processing",
        "Web & Database Security",
        "Machine Learning",
        "Mobile Ad-hoc Networks",
        "Mobile Application Development",
        "Text Mining",
        "Numerical Algorithms",
        "Operating System Design",
        "Optimization Techniques",
        "Intrusion Detection & Prevention Systems",
        "Simulation & Modelling",
        # Honours for CSE
        "Advanced Graph Algorithms",
        "Blockchain",
        "Parallel & Distributed Computing",
        "Internet of Things",
        "Wireless Sensor Networks",
        "Capstone Project",
    ]

@app.post("/generate-question")
def create_question(request: QuestionRequest, db: Session = Depends(get_db)):
    # Read syllabus context if available
    syllabus_context = ""
    try:
        import os
        syllabus_path = os.path.join(os.path.dirname(__file__), "..", "syllabus.txt")
        if os.path.exists(syllabus_path):
            with open(syllabus_path, "r", encoding="utf-8") as f:
                syllabus_context = f.read()
    except Exception as e:
        print(f"Failed to read syllabus: {e}")

    # Generate question using Groq
    ai_resp = generate_programming_question(request.subject, request.difficulty, request.q_type, syllabus_context=syllabus_context)
    
    if "error" in ai_resp:
        raise HTTPException(status_code=500, detail=ai_resp["error"])

    # Save to database (adding q_type and storing MCQ data in problem_statement if needed)
    db_question = Question(
        subject=request.subject,
        difficulty=request.difficulty,
        problem_statement=ai_resp.get("problem_statement") or ai_resp.get("question"),
        input_format=ai_resp.get("input_format") or "|".join(ai_resp.get("options", [])),
        output_format=ai_resp.get("output_format") or ai_resp.get("correct_answer"),
        constraints=ai_resp.get("constraints"),
        sample_io=ai_resp.get("sample_io"),
        test_cases=json.dumps(ai_resp.get("test_cases", [])),
        explanation=ai_resp.get("explanation")
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    return db_question

@app.get("/questions")
def list_questions(subject: Optional[str] = None, difficulty: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Question)
    if subject:
        query = query.filter(Question.subject == subject)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    return query.all()
    
class VivaEvaluationRequest(BaseModel):
    question: str
    ideal_answer: str
    student_answer: str

@app.post("/evaluate-viva")
def evaluate_viva(request: VivaEvaluationRequest):
    result = evaluate_viva_response(request.question, request.ideal_answer, request.student_answer)
    return result

class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    test_cases: List[dict]

@app.post("/run-code")
def run_code(request: CodeExecutionRequest):
    # Map frontend language names to Judge0 language IDs
    # IDs: Python (71), Java (62), C (50), C++ (54), JavaScript (63), C# (51), PHP (68), Ruby (72), Go (60)
    lang_map = {
        "Python": 71,
        "Java": 62,
        "C": 50,
        "C++": 54,
        "JavaScript": 63,
        "C#": 51,
        "PHP": 68,
        "Ruby": 72,
        "Go": 60
    }
    
    lang_id = lang_map.get(request.language)
    if not lang_id:
        raise HTTPException(status_code=400, detail="Unsupported language")
    
    results = []
    for tc in request.test_cases:
        payload = {
            "source_code": request.code,
            "language_id": lang_id,
            "stdin": tc.get("input", ""),
            "expected_output": tc.get("expected_output", "")
        }
        
        try:
            # Use Judge0 CE public instance
            resp = requests.post("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", json=payload, timeout=15)
            data = resp.json()
            
            output = data.get("stdout") or ""
            output = output.strip()
            
            stderr = data.get("stderr") or ""
            compile_output = data.get("compile_output") or ""
            
            # Judge0 status: 3 is 'Accepted'
            is_passed = data.get("status", {}).get("id") == 3
            
            results.append({
                "input": tc.get("input"),
                "expected": tc.get("expected_output", "").strip(),
                "actual": output,
                "passed": is_passed,
                "error": stderr + compile_output
            })
        except Exception as e:
            results.append({
                "input": tc.get("input"),
                "error": str(e),
                "passed": False
            })
            
    return results

# --- Authentication Endpoints ---

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "student"

@app.post("/register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(request.password)
    new_user = User(
        name=request.name,
        email=request.email,
        password=hashed_password,
        role=request.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role
    }

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }

# --- Session Management Endpoints ---

class SessionStartRequest(BaseModel):
    user_id: int
    subject: str
    mode: str
    difficulty: str
    total_questions: int

@app.post("/sessions/start")
def start_session(request: SessionStartRequest, db: Session = Depends(get_db)):
    # Check for existing active session
    active = db.query(ExamSession).filter(
        ExamSession.user_id == request.user_id,
        ExamSession.subject == request.subject,
        ExamSession.is_active == 1
    ).first()
    
    if active:
        return active
    
    new_session = ExamSession(
        user_id=request.user_id,
        subject=request.subject,
        mode=request.mode,
        difficulty=request.difficulty,
        total_questions=request.total_questions,
        is_active=1
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@app.get("/sessions/active/{user_id}/{subject}")
def get_active_session(user_id: int, subject: str, db: Session = Depends(get_db)):
    session = db.query(ExamSession).filter(
        ExamSession.user_id == user_id,
        ExamSession.subject == subject,
        ExamSession.is_active == 1
    ).first()
    if not session:
        return {"session": None}
    return session

class SessionUpdateRequest(BaseModel):
    session_id: int
    current_score: int
    questions_attempted: int
    history: List[dict]

@app.post("/sessions/update")
def update_session(request: SessionUpdateRequest, db: Session = Depends(get_db)):
    session = db.query(ExamSession).filter(ExamSession.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.current_score = request.current_score
    session.questions_attempted = request.questions_attempted
    session.history = json.dumps(request.history)
    db.commit()
    return {"status": "updated"}

class SessionFinishRequest(BaseModel):
    is_violated: Optional[int] = 0
    violation_reason: Optional[str] = None

@app.post("/sessions/finish/{session_id}")
def finish_session_api(session_id: int, request: SessionFinishRequest, db: Session = Depends(get_db)):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = 0
    session.is_violated = request.is_violated
    session.violation_reason = request.violation_reason
    session.end_time = datetime.datetime.utcnow()
    db.commit()
    return {"status": "finished"}

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    # Total unique students from User table
    total_students = db.query(User).filter(User.role == "student").count()
    
    # Total exams
    total_exams = db.query(ExamSession).count()
    
    # All sessions for leaderboards and logs
    all_sessions = db.query(ExamSession, User.name).join(User, ExamSession.user_id == User.id).order_by(ExamSession.start_time.desc()).all()
    
    # Calculate performers
    user_stats = {}
    for s, user_name in all_sessions:
        if s.user_id not in user_stats:
            user_stats[s.user_id] = {"total_score": 0, "total_qs": 0, "exams": 0, "name": user_name}
        user_stats[s.user_id]["total_score"] += s.current_score
        user_stats[s.user_id]["total_qs"] += s.total_questions or 1
        user_stats[s.user_id]["exams"] += 1
        
    performer_list = []
    for uid, data in user_stats.items():
        percentage = (data["total_score"] / data["total_qs"] * 100)
        performer_list.append({"user_id": uid, "user_name": data["name"], "avg_percentage": round(percentage, 2), "exams": data["exams"]})
        
    best_performers = sorted(performer_list, key=lambda x: x["avg_percentage"], reverse=True)[:5]
    least_performers = sorted(performer_list, key=lambda x: x["avg_percentage"])[:5]
    
    return {
        "total_students": total_students,
        "total_exams": total_exams,
        "best_performers": best_performers,
        "least_performers": least_performers,
        "recent_sessions": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "user_name": user_name,
                "subject": s.subject,
                "score": s.current_score,
                "total": s.total_questions,
                "is_active": s.is_active,
                "is_violated": s.is_violated,
                "violation_reason": s.violation_reason,
                "start_time": s.start_time.isoformat() if s.start_time else None,
                "end_time": s.end_time.isoformat() if s.end_time else None,
                "history": json.loads(s.history) if s.history else []
            } for s, user_name in all_sessions[:50]
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
