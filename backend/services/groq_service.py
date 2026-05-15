import os
import json
from groq import Groq
from dotenv import load_dotenv

import random

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY", "your_api_key_here"))

def generate_programming_question(subject: str, difficulty: str, q_type: str = "coding", syllabus_context: str = ""):
    seed = random.randint(1, 1000000)
    
    syllabus_instruction = ""
    if syllabus_context and syllabus_context.strip():
        syllabus_instruction = f"\nCRITICAL: Base the question strictly on the following syllabus topics:\n{syllabus_context}\n"

    if q_type == "mcq":
        prompt = f"""
        (Seed: {seed})
        Generate a {difficulty} level Multiple Choice Question (MCQ) for {subject}.{syllabus_instruction}
        Ensure the question is unique and avoids common textbook examples.
        Response MUST be in valid JSON format with the following keys:
        - question: string
        - options: array of 4 strings
        - correct_answer: string (must match exactly one of the options)
        - explanation: string
        """
    elif q_type == "viva":
        prompt = f"""
        (Seed: {seed})
        Generate a {difficulty} level Viva (oral examination) question for {subject}.{syllabus_instruction}
        CRITICAL: This is an ORAL EXAM. 
        - If the subject is a non-programming subject (like Constitution, Chemistry, etc.), DO NOT generate coding or programming tasks.
        - The question MUST be conceptual, theoretical, or situational.
        - The question should require a detailed verbal explanation.
        Response MUST be in valid JSON format with the following keys:
        - question: string
        - ideal_answer: string (a comprehensive explanation of what the student should ideally say)
        - explanation: string
        """
    else:
        prompt = f"""
        (Seed: {seed})
        Generate a {difficulty} level programming question related to {subject}.{syllabus_instruction}
        
        CRITICAL: The question MUST be language-neutral. 
        - Do NOT mention a specific language (like Python, Java, C++, etc.) in the problem statement.
        - The problem should be solvable using standard logic in ANY programming language.
        - Use generic terms like 'function', 'method', 'array', 'string', etc.
        
        If the subject is theoretical, create a practical simulation, data structure implementation, or algorithm related to it.
        Response MUST be in valid JSON format with the following keys:
        - problem_statement: string
        - input_format: string
        - output_format: string
        - constraints: string
        - sample_io: string
        - explanation: string
        - test_cases: array of objects with 'input' and 'expected_output' keys (provide 2-3 comprehensive test cases)
        """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates educational questions in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Error generating question: {e}")
        return {
            "error": "Failed to generate question",
            "details": str(e)
        }

def evaluate_viva_response(question: str, ideal_answer: str, student_answer: str):
    prompt = f"""
    Evaluate the following student's verbal response for a Viva (oral) examination.
    
    Question: {question}
    Ideal Answer: {ideal_answer}
    Student Answer: {student_answer}
    
    CRITICAL: 
    - The student answer is a transcript of speech, so ignore minor grammatical errors or filler words like 'um', 'uh'.
    - Check for conceptual correctness and coverage of key points mentioned in the ideal answer.
    
    Response MUST be in valid JSON format with the following keys:
    - score: integer (0 to 10, where 10 is perfect)
    - is_correct: boolean (true if score >= 6)
    - feedback: string (brief constructive feedback)
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional examiner evaluating oral exam responses in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Error evaluating response: {e}")
        return {
            "score": 0,
            "is_correct": False,
            "feedback": "Failed to evaluate response due to an error."
        }
