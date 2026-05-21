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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI Learning & Assessment Platform Backend is running successfully!",
        "frontend_url": "http://localhost:3002",
        "docs_url": "http://localhost:8000/docs"
    }

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
        base_dir = os.path.dirname(__file__)
        
        # Determine syllabus path based on subject
        if request.subject == "Python Programming":
            syllabus_path = os.path.join(base_dir, "..", "python_syllabus.txt")
        elif "JAVA" in request.subject.upper() or "JAVA" == request.subject.upper():
            syllabus_path = os.path.join(base_dir, "..", "java_syllabus.txt")
        else:
            syllabus_path = os.path.join(base_dir, "..", "syllabus.txt")
            
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

# ─────────────────────────────────────────────
# SMART CODE STYLE DETECTION & WRAPPER SYSTEM
# Supports both Standard I/O style AND LeetCode function style.
# ─────────────────────────────────────────────

import re
import ast as pyast
import json

def _parse_input_to_python(raw: str):
    """Try to parse a raw test case input string into a Python/JSON value."""
    raw = raw.strip()
    if not raw:
        return ""
    # Try parsing as JSON first
    try:
        return json.loads(raw)
    except Exception:
        pass
    
    # Try parsing as Python literal (like tuple: [1, 2], 3)
    try:
        return pyast.literal_eval(raw)
    except Exception:
        pass
    
    # Fallback: maybe space-separated integers
    parts = raw.split()
    if parts:
        try:
            return [int(p) for p in parts]
        except ValueError:
            pass
    return raw

def _normalize_and_compare(actual: str, expected: str) -> bool:
    actual = actual.strip()
    expected = expected.strip()
    if actual == expected:
        return True
    
    # Try removing all whitespace and newlines/carriage returns
    norm_actual_ws = actual.replace(" ", "").replace("\n", "").replace("\r", "")
    norm_expected_ws = expected.replace(" ", "").replace("\n", "").replace("\r", "")
    if norm_actual_ws == norm_expected_ws:
        return True
    
    # Try normalizing quotes (' vs ") and brackets vs parentheses
    norm_actual_brackets = norm_actual_ws.replace("'", '"').replace("(", "[").replace(")", "]")
    norm_expected_brackets = norm_expected_ws.replace("'", '"').replace("(", "[").replace(")", "]")
    if norm_actual_brackets == norm_expected_brackets:
        return True

    # Try normalizing casing as well (case-insensitive) for structural comparisons
    if norm_actual_brackets.lower() == norm_expected_brackets.lower():
        return True
    
    # Try parsing as python/JSON structures and comparing them
    try:
        act_val = _parse_input_to_python(actual)
        exp_val = _parse_input_to_python(expected)
        if act_val == exp_val:
            return True
        if isinstance(act_val, (list, tuple)) and isinstance(exp_val, (list, tuple)):
            if len(act_val) == len(exp_val):
                match = True
                for a, e in zip(act_val, exp_val):
                    sa = str(a).replace(" ", "").replace("'", '"').replace("(", "[").replace(")", "]").lower()
                    se = str(e).replace(" ", "").replace("'", '"').replace("(", "[").replace(")", "]").lower()
                    if sa != se:
                        match = False
                        break
                if match:
                    return True
    except Exception:
        pass
    
    return False

def _python_uses_stdin(code: str) -> bool:
    """Return True if the code explicitly reads from stdin."""
    patterns = [r'\binput\s*\(', r'sys\.stdin', r'fileinput', r'stdin\.read']
    return any(re.search(p, code) for p in patterns)

def _python_detect_callable(code: str):
    """
    Detects the callable structure in the Python user code.
    Returns (class_name, method_name, has_self) or (None, function_name, False) or (None, None, False).
    """
    try:
        tree = pyast.parse(code)
        # Look for top-level functions first
        for node in tree.body:
            if isinstance(node, pyast.FunctionDef):
                return None, node.name, False
        # Look for class definitions
        for node in tree.body:
            if isinstance(node, pyast.ClassDef):
                for subnode in node.body:
                    if isinstance(subnode, pyast.FunctionDef):
                        if not subnode.name.startswith("__"):
                            args = subnode.args.args
                            has_self = len(args) > 0 and args[0].arg == 'self'
                            return node.name, subnode.name, has_self
    except Exception:
        pass
    return None, None, False

def _build_python_args(parsed):
    if isinstance(parsed, tuple):
        return ", ".join(repr(x) for x in parsed)
    elif isinstance(parsed, dict):
        return ", ".join(f"{k}={repr(v)}" for k, v in parsed.items())
    else:
        return repr(parsed)

def _build_python_wrapper(user_code: str, raw_input: str) -> str:
    """
    Build final Python source that will work regardless of coding style:
    - If code reads stdin ➜ pass input as stdin, run as-is.
    - If code defines a function/class ➜ call the function with parsed args and print result.
    """
    if _python_uses_stdin(user_code):
        return user_code  # stdin style — no modification needed

    class_name, fn_name, has_self = _python_detect_callable(user_code)
    if not fn_name:
        return user_code  # no function found — run as-is

    parsed = _parse_input_to_python(raw_input)
    args_str = _build_python_args(parsed)

    if class_name:
        if has_self:
            call_expr = f"{class_name}().{fn_name}({args_str})"
        else:
            call_expr = f"{class_name}.{fn_name}({args_str})"
    else:
        call_expr = f"{fn_name}({args_str})"

    wrapper = f"""from typing import *
{user_code}

# ── hidden auto-runner ──
if __name__ == '__main__':
    import json as _json
    _result = {call_expr}
    if _result is not None:
        if isinstance(_result, (list, dict)):
            print(_json.dumps(_result))
        else:
            print(_result)
"""
    return wrapper

def _java_uses_stdin(code: str) -> bool:
    patterns = [r'Scanner', r'BufferedReader', r'System\.in', r'InputStreamReader']
    return any(re.search(p, code) for p in patterns)

def _val_to_java(val):
    if isinstance(val, list):
        if val and isinstance(val[0], list):
            # Nested list: 2D array
            inner_type = "int"
            flat_elements = []
            for sub in val:
                if isinstance(sub, list):
                    for item in sub:
                        flat_elements.append(item)
            if all(isinstance(x, str) for x in flat_elements):
                inner_type = "String"
            elif all(isinstance(x, float) for x in flat_elements):
                inner_type = "double"
            
            rows = []
            for sub in val:
                if isinstance(sub, list):
                    sub_elements = ", ".join(_val_to_java(x) for x in sub)
                    rows.append(f"{{{sub_elements}}}")
                else:
                    rows.append(f"{{{_val_to_java(sub)}}}")
            arr_str = ", ".join(rows)
            return f"new {inner_type}[][] {{{arr_str}}}"
        else:
            # 1D list
            if not val:
                return "new int[]{}"
            if all(isinstance(x, str) for x in val):
                items = ", ".join('"' + x.replace('"', '\\"') + '"' for x in val)
                return f"new String[]{{{items}}}"
            elif all(isinstance(x, float) for x in val):
                items = ", ".join(str(x) for x in val)
                return f"new double[]{{{items}}}"
            else:
                items = ", ".join(str(x) for x in val)
                return f"new int[]{{{items}}}"
    elif isinstance(val, bool):
        return "true" if val else "false"
    elif isinstance(val, int):
        return str(val)
    elif isinstance(val, float):
        return str(val)
    elif isinstance(val, str):
        escaped = val.replace('"', '\\"')
        return f'"{escaped}"'
    elif isinstance(val, dict):
        # Convert to JSON string
        escaped = json.dumps(val).replace('"', '\\"')
        return f'"{escaped}"'
    else:
        return str(val)

def _val_to_java_typed(val, java_type: str):
    java_type = java_type.strip()
    if "List" in java_type:
        if isinstance(val, list):
            elements = ", ".join(_val_to_java(x) for x in val)
            return f"java.util.Arrays.asList({elements})"
        else:
            return f"java.util.Arrays.asList({_val_to_java(val)})"
    elif "Set" in java_type:
        if isinstance(val, list):
            elements = ", ".join(_val_to_java(x) for x in val)
            return f"new java.util.HashSet(java.util.Arrays.asList({elements}))"
        else:
            return f"new java.util.HashSet(java.util.Arrays.asList({_val_to_java(val)}))"
    return _val_to_java(val)

def _build_java_wrapper(user_code: str, raw_input: str) -> str:
    """
    If the student wrote a Java method but no Scanner, wrap it so the Main
    class calls their method with parsed arguments.
    """
    if _java_uses_stdin(user_code):
        return user_code

    # Strip 'public' keyword from class declarations to avoid compile errors in Main.java
    user_code = re.sub(r'\bpublic\s+class\s+', 'class ', user_code)

    # Detect method signature
    method_match = re.search(
        r'(?:public|private|protected|static|\s)+([\w<>\[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*\{',
        user_code
    )
    if not method_match:
        return user_code

    return_type = method_match.group(1)
    fn_name = method_match.group(2)
    params = method_match.group(3)

    if fn_name == "main":
        return user_code  # already has a main

    # Detect the class name
    class_match = re.search(r'\bclass\s+(\w+)', user_code)
    class_name = class_match.group(1) if class_match else "Solution"

    is_static = "static" in method_match.group(0)

    # Parse parameter types
    param_types = []
    current = []
    depth = 0
    for char in params:
        if char == '<':
            depth += 1
        elif char == '>':
            depth -= 1
        
        if char == ',' and depth == 0:
            parts = "".join(current).strip().split()
            if parts:
                param_types.append(parts[0])
            current = []
        else:
            current.append(char)
    if current:
        parts = "".join(current).strip().split()
        if parts:
            param_types.append(parts[0])

    # Parse input and map to Java types
    parsed = _parse_input_to_python(raw_input)
    if isinstance(parsed, tuple):
        if len(parsed) == len(param_types):
            args_str = ", ".join(_val_to_java_typed(x, t) for x, t in zip(parsed, param_types))
        else:
            args_str = ", ".join(_val_to_java(x) for x in parsed)
    else:
        if len(param_types) == 1:
            args_str = _val_to_java_typed(parsed, param_types[0])
        else:
            args_str = _val_to_java(parsed)

    # Build the call expression
    if is_static:
        call_expr = f"{class_name}.{fn_name}({args_str})"
    else:
        call_expr = f"new {class_name}().{fn_name}({args_str})"

    # Print logic based on return type
    if return_type.endswith("[][]"):
        print_stmt = f"System.out.println(java.util.Arrays.deepToString({call_expr}));"
    elif return_type.endswith("[]"):
        print_stmt = f"System.out.println(java.util.Arrays.toString({call_expr}));"
    elif return_type == "void":
        print_stmt = f"{call_expr};"
    else:
        print_stmt = f"System.out.println({call_expr});"

    # If the student's class is Main, insert main inside it
    if class_name == "Main":
        insert = f"""
    public static void main(String[] args) {{
        {print_stmt}
    }}
"""
        last_brace = user_code.rfind("}")
        if last_brace != -1:
            wrapper = user_code[:last_brace] + insert + "\n}"
        else:
            wrapper = user_code + "\n" + insert
    else:
        # Otherwise, append a separate Main class at the end
        wrapper = f"""{user_code}

class Main {{
    public static void main(String[] args) {{
        {print_stmt}
    }}
}}
"""
    return wrapper

def _js_uses_stdin(code: str) -> bool:
    patterns = [r'readFileSync', r'readline', r'process\.stdin', r'require\(["\']fs["\']\)']
    return any(re.search(p, code) for p in patterns)

def _js_detect_callable(code: str):
    """
    Detects JS function or class method.
    Returns (class_name, method_name)
    """
    class_match = re.search(r'\bclass\s+(\w+)', code)
    if class_match:
        class_name = class_match.group(1)
        methods = re.findall(r'\b(\w+)\s*\([^)]*\)\s*\{', code)
        for m in methods:
            if m not in ('constructor', 'if', 'for', 'while', 'switch', 'catch'):
                return class_name, m
        return class_name, None

    fn_match = re.search(r'\bfunction\s+(\w+)', code)
    if fn_match:
        return None, fn_match.group(1)
    
    var_fn_match = re.search(r'\b(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)', code)
    if var_fn_match:
        return None, var_fn_match.group(1)

    return None, None

def _val_to_js(val):
    if isinstance(val, (list, dict)):
        return json.dumps(val)
    elif isinstance(val, bool):
        return "true" if val else "false"
    elif val is None:
        return "null"
    else:
        return json.dumps(val)

def _build_js_wrapper(user_code: str, raw_input: str) -> str:
    if _js_uses_stdin(user_code):
        return user_code

    class_name, fn_name = _js_detect_callable(user_code)
    if not fn_name:
        return user_code

    parsed = _parse_input_to_python(raw_input)
    if isinstance(parsed, tuple):
        args_str = ", ".join(_val_to_js(x) for x in parsed)
    else:
        args_str = _val_to_js(parsed)

    if class_name:
        call = f"new {class_name}().{fn_name}({args_str})"
    else:
        call = f"{fn_name}({args_str})"

    wrapper = f"""{user_code}

// ── hidden auto-runner ──
const _result = {call};
if (typeof _result === 'object' && _result !== null) {{
    console.log(JSON.stringify(_result));
}} else if (_result !== undefined) {{
    console.log(_result);
}}
"""
    return wrapper

def prepare_code(language: str, user_code: str, raw_input: str) -> str:
    """Entry point: route to the correct wrapper builder."""
    if language == "Python":
        return _build_python_wrapper(user_code, raw_input)
    elif language == "Java":
        return _build_java_wrapper(user_code, raw_input)
    elif language == "JavaScript":
        return _build_js_wrapper(user_code, raw_input)
    return user_code


@app.post("/run-code")
def run_code(request: CodeExecutionRequest):
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
        stdin_val = tc.get("input")
        if stdin_val is None:
            stdin_str = ""
        elif isinstance(stdin_val, list):
            stdin_str = "\n".join(str(x) for x in stdin_val)
        elif isinstance(stdin_val, dict):
            stdin_str = json.dumps(stdin_val)
        else:
            stdin_str = str(stdin_val)

        expected_val = tc.get("expected_output")
        if expected_val is None:
            expected_str = ""
        elif isinstance(expected_val, list):
            expected_str = "\n".join(str(x) for x in expected_val)
        elif isinstance(expected_val, dict):
            expected_str = json.dumps(expected_val)
        else:
            expected_str = str(expected_val)

        # ── SMART WRAPPER: prepare the code for both styles ──
        final_code = prepare_code(request.language, request.code, stdin_str)

        payload = {
            "source_code": final_code,
            "language_id": lang_id,
            "stdin": stdin_str,          # still passed; stdin-style code will use it
            "expected_output": expected_str
        }

        try:
            resp = requests.post(
                "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
                json=payload, timeout=15
            )
            data = resp.json()

            output = (data.get("stdout") or "").strip()
            stderr = data.get("stderr") or ""
            compile_output = data.get("compile_output") or ""
            
            status_id = data.get("status", {}).get("id")
            is_passed = status_id == 3
            if not is_passed and status_id == 4:
                # Wrong Answer according to Judge0, let's check our flexible comparison
                if _normalize_and_compare(output, expected_str):
                    is_passed = True

            results.append({
                "input": stdin_str,
                "expected": expected_str.strip(),
                "actual": output,
                "passed": is_passed,
                "error": stderr + compile_output
            })
        except Exception as e:
            results.append({
                "input": stdin_str,
                "expected": expected_str.strip(),
                "actual": "",
                "passed": False,
                "error": str(e)
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
        with open("login_debug.txt", "a") as f:
            f.write(f"FAILED: email='{request.email}', pwd='{request.password}'\n")
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
    # Check for existing active session (only for registered users)
    u_id = request.user_id if request.user_id != 0 else None
    active = None
    if u_id is not None:
        active = db.query(ExamSession).filter(
            ExamSession.user_id == u_id,
            ExamSession.subject == request.subject,
            ExamSession.is_active == 1
        ).first()
    
    if active:
        return active
    
    new_session = ExamSession(
        user_id=u_id,
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
    if user_id == 0:
        return {"session": None}
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
    all_sessions = db.query(ExamSession, User.name).outerjoin(User, ExamSession.user_id == User.id).order_by(ExamSession.start_time.desc()).all()
    
    # Calculate performers
    user_stats = {}
    for s, user_name in all_sessions:
        uid = s.user_id or 0
        name = user_name or "Guest"
        if uid not in user_stats:
            user_stats[uid] = {"total_score": 0, "total_qs": 0, "exams": 0, "name": name}
        user_stats[uid]["total_score"] += s.current_score
        user_stats[uid]["total_qs"] += s.total_questions or 1
        user_stats[uid]["exams"] += 1
        
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
                "user_name": user_name or "Guest",
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
