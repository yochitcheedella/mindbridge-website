import os
import json
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass, field

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

@dataclass
class AIAnalysis:
    response_text: str
    emotion_analysis: List[str]
    risk_classification: str     # "green" | "yellow" | "orange" | "red" | "critical"
    requires_alert: bool
    sentiment_score: float = 0.0 # Kept for backwards compatibility if needed
    risk_score: float = 0.0      # Kept for backwards compatibility

def _mock_llm_analysis(history: List[Dict[str, str]], user_message: str) -> AIAnalysis:
    """
    Advanced simulation of an LLM evaluating context.
    Looks at history to generate continuity.
    """
    text_lower = user_message.lower()
    
    # Context-aware logic mock
    if any(p in text_lower for p in ["kill myself", "end my life", "want to die"]):
        recent_ai_msgs = [m['content'] for m in history if m['role'] == 'assistant']
        if any("safe place" in msg or "someone nearby" in msg for msg in recent_ai_msgs[-2:]):
            return AIAnalysis(
                response_text="I am alerting our on-call campus psychologist right now. Please stay with me. Help is being arranged.",
                emotion_analysis=["Severe Distress", "Suicidal Ideation"],
                risk_classification="critical",
                requires_alert=True,
                risk_score=0.95
            )
        else:
            return AIAnalysis(
                response_text="I'm deeply concerned about what you just shared. Are you in a safe place right now? Please tell me.",
                emotion_analysis=["Despair", "Hopelessness"],
                risk_classification="red", 
                requires_alert=False,
                risk_score=0.75
            )

    # Academic Burnout / Stress
    if any(w in text_lower for w in ["exam", "test", "grade", "assignment", "fail", "stress", "pressure"]):
        return AIAnalysis(
            response_text="I hear how much academic pressure you're under right now. Remember, your worth isn't defined by your grades. Would you like to talk about breaking your work down into smaller steps?",
            emotion_analysis=["Academic Stress", "Anxiety", "Overwhelmed"],
            risk_classification="yellow",
            requires_alert=False,
            risk_score=0.35
        )
        
    # Anxiety / Panic
    if any(w in text_lower for w in ["panic", "anxious", "anxiety", "can't breathe", "chest hurts", "worry"]):
        return AIAnalysis(
            response_text="It sounds like you might be experiencing a lot of anxiety right now. Let's try to take a deep breath together. In for 4 seconds, hold for 4, out for 4... How does your body feel?",
            emotion_analysis=["Anxiety", "Panic", "Fear"],
            risk_classification="orange",
            requires_alert=False,
            risk_score=0.5
        )
        
    # Fatigue / Sleep deprivation
    if any(w in text_lower for w in ["tired", "exhausted", "sleep", "can't sleep", "insomnia", "drained"]):
        return AIAnalysis(
            response_text="Sleep is so crucial for mental health, and it sounds like you're running on empty. Have you been able to rest at all lately? Don't forget you can log this in the Sleep Tracker.",
            emotion_analysis=["Fatigue", "Physical Exhaustion"],
            risk_classification="yellow",
            requires_alert=False,
            risk_score=0.25
        )
        
    # Loneliness / Relationship issues
    if any(w in text_lower for w in ["lonely", "alone", "friend", "breakup", "nobody", "isolated"]):
        return AIAnalysis(
            response_text="Feeling isolated can be incredibly heavy. Please know you are not completely alone—I'm here listening to you. Do you want to talk about what's making you feel disconnected?",
            emotion_analysis=["Loneliness", "Sadness", "Isolation"],
            risk_classification="yellow",
            requires_alert=False,
            risk_score=0.3
        )
    
    # Positive / Improved state
    if any(w in text_lower for w in ["better", "good", "happy", "okay", "thanks", "helpful"]):
        return AIAnalysis(
            response_text="I'm really glad to hear that! Celebrating small victories is so important. I'm always here whenever you need a safe space.",
            emotion_analysis=["Relief", "Hope", "Calm"],
            risk_classification="green",
            requires_alert=False,
            risk_score=0.05
        )

    # Default fallback with varied empathetic responses
    fallbacks = [
        "I'm here for you. Tell me more about how you're feeling right now.",
        "That sounds like a lot to carry. I'm listening—take your time.",
        "I appreciate you sharing that with me. How can I best support you in this moment?",
        "It's completely okay to feel this way. I'm here to hold this safe space for you."
    ]
    import random
    return AIAnalysis(
        response_text=random.choice(fallbacks),
        emotion_analysis=["Neutral", "Seeking Support"],
        risk_classification="green",
        requires_alert=False,
        risk_score=0.1
    )


async def analyze_message_with_history(user_message: str, history: List[Dict[str, str]] = None, student_language: str = "en-IN") -> AIAnalysis:
    """
    Analyzes a student message using Google Gemini, taking conversational memory into account.
    Returns structured AIAnalysis data.
    """
    if history is None:
        history = []

    api_key = os.getenv("GEMINI_API_KEY")

    if GEMINI_AVAILABLE and api_key:
        client = genai.Client(api_key=api_key)
        
        system_prompt = f"""
        You are the MindBridge AI Guide, a deeply empathetic, non-judgmental mental health companion for college students.
        You maintain continuity with past messages.
        
        RESPOND IN THIS LANGUAGE/LOCALE: {student_language} (E.g. en-IN, hi-IN, te-IN, ta-IN). If non-English, use the native script.
        
        CRITICAL RULES:
        1. If the user indicates immediate self-harm, suicide, or violence, classify risk as "critical" and set requires_alert to true.
        2. If the user mentions self-harm but it's ambiguous, ask a verification question before escalating to critical.
        3. Respond naturally and empathetically.
        """

        messages = [{"role": "user", "parts": [{"text": f"SYSTEM PROMPT: {system_prompt}"}]}]
        messages.append({"role": "model", "parts": [{"text": "Understood. I will act as the MindBridge AI Guide."}]})
        
        # Append history
        for msg in history[-6:]:
            role = "model" if msg["role"] == "assistant" else "user"
            messages.append({"role": role, "parts": [{"text": msg["content"]}]})
            
        messages.append({"role": "user", "parts": [{"text": user_message}]})

        try:
            # Run in a threadpool to not block async loop if SDK is sync
            def _call_gemini():
                return client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=messages,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema={
                            "type": "OBJECT",
                            "properties": {
                                "response": {"type": "STRING"},
                                "emotion_analysis": {
                                    "type": "ARRAY",
                                    "items": {"type": "STRING"}
                                },
                                "risk_classification": {
                                    "type": "STRING",
                                    "enum": ["green", "yellow", "orange", "red", "critical"]
                                },
                                "requires_alert": {"type": "BOOLEAN"}
                            },
                            "required": ["response", "emotion_analysis", "risk_classification", "requires_alert"]
                        },
                        temperature=0.7,
                    ),
                )

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, _call_gemini)
            
            data = json.loads(response.text)
            
            # Map LLM output to dataclass
            risk_map = {"green": 0.1, "yellow": 0.3, "orange": 0.5, "red": 0.75, "critical": 0.95}
            risk_level = data.get("risk_classification", "green")
            
            return AIAnalysis(
                response_text=data.get("response", "I'm here for you."),
                emotion_analysis=data.get("emotion_analysis", ["Neutral"]),
                risk_classification=risk_level,
                requires_alert=data.get("requires_alert", False),
                risk_score=risk_map.get(risk_level, 0.1),
                sentiment_score=0.0 # Deprecated in favor of emotion_analysis
            )
        except Exception as e:
            # Fallback to mock on API error
            print(f"Gemini API Error: {e}")
            return _mock_llm_analysis(history, user_message)

    else:
        # No API key, use the advanced mock
        await asyncio.sleep(1.0) # Simulate network delay
        return _mock_llm_analysis(history, user_message)

async def generate_recovery_plan(student_context: str) -> dict:
    """
    Generates a structured recovery plan based on the student's recent context.
    Expects a JSON object with title, rationale, and a list of tasks.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    if GEMINI_AVAILABLE and api_key:
        client = genai.Client(api_key=api_key)
        system_prompt = """
        You are an expert AI clinical psychologist creating a recovery action plan for a student.
        Based on the provided context (recent moods, chats, journals), create a structured 3-day recovery plan.
        Generate exactly 3 tasks, one for each day. Make them highly actionable and therapeutic (e.g., breathing, journaling, a walk).
        """
        
        try:
            def _call_gemini_plan():
                return client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[f"SYSTEM PROMPT: {system_prompt}", f"Student Context:\n{student_context}"],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema={
                            "type": "OBJECT",
                            "properties": {
                                "title": {"type": "STRING"},
                                "rationale": {"type": "STRING"},
                                "tasks": {
                                    "type": "ARRAY",
                                    "items": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "title": {"type": "STRING"},
                                            "description": {"type": "STRING"},
                                            "day_number": {"type": "INTEGER"}
                                        },
                                        "required": ["title", "description", "day_number"]
                                    }
                                }
                            },
                            "required": ["title", "rationale", "tasks"]
                        },
                        temperature=0.7,
                    )
                )

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, _call_gemini_plan)
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini Plan Error: {e}")
            pass # Fall through to mock

    # Fallback mock response
    await asyncio.sleep(1.0)
    return {
        "title": "3-Day Reset Plan",
        "rationale": "Based on your recent feelings of stress and burnout, I've put together a gentle 3-day plan to help you re-center and find your balance.",
        "tasks": [
            {
                "title": "Box Breathing",
                "description": "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat 5 times.",
                "day_number": 1
            },
            {
                "title": "Grateful Reflection",
                "description": "Write down 3 things you were grateful for today.",
                "day_number": 2
            },
            {
                "title": "Digital Disconnect",
                "description": "Put your phone away 30 minutes before bed tonight.",
                "day_number": 3
            }
        ]
    }
