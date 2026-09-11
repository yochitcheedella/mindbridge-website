import os
import json
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)

# Initialize client if key exists
api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key) if api_key else None

async def generate_chat_response(messages: list, student_language: str = "English") -> dict:
    """
    Calls OpenAI to get a response, emotion analysis, and risk score.
    messages format: [{"role": "user"/"assistant", "content": "text"}, ...]
    """
    if not client:
        logger.warning("OPENAI_API_KEY not set. Using mock LLM response.")
        return _mock_llm_response(messages[-1]["content"])

    system_prompt = f"""
You are MindBridge AI, an empathetic and highly professional student wellness assistant.
Your goal is to converse naturally with the student. Be supportive, concise, and non-judgmental.

Respond to the student in {student_language}.

You MUST return your response as a JSON object with the following exact keys:
{{
    "response_text": "Your natural conversational reply in {student_language}",
    "detected_emotions": ["emotion1", "emotion2"],
    "risk_score": <integer from 0 to 100>,
    "wellness_suggestions": ["suggestion1", "suggestion2"]
}}

Risk Score Guide:
0-20: Positive, happy, safe.
21-40: Mild stress, tired, normal academic pressure.
41-60: High stress, overwhelmed, anxious, poor sleep.
61-80: Hopelessness, severe anxiety, extreme burnout. (Triggers alert)
81-100: Active crisis, self-harm mentions, severe depression. (Triggers immediate SOS)

CRITICAL: Output ONLY valid JSON.
"""
    try:
        completion = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": system_prompt}] + messages,
            response_format={ "type": "json_object" },
            temperature=0.7,
            max_tokens=500,
        )
        response_content = completion.choices[0].message.content
        return json.loads(response_content)
    except Exception as e:
        logger.error(f"LLM API Error: {e}")
        return _mock_llm_response(messages[-1]["content"])


def _mock_llm_response(last_message: str) -> dict:
    """Fallback if OpenAI is unavailable."""
    text_lower = last_message.lower()
    
    # Keyword based fallback
    if any(w in text_lower for w in ["suicide", "kill", "end it", "die"]):
        return {
            "response_text": "I'm so sorry you're feeling this way. Please know that there is immediate help available. You are not alone.",
            "detected_emotions": ["crisis", "despair"],
            "risk_score": 90,
            "wellness_suggestions": ["Contact Emergency SOS"]
        }
    elif any(w in text_lower for w in ["stress", "anxious", "overwhelmed", "exam", "fail"]):
        return {
            "response_text": "Exams and academics can be incredibly stressful. It's okay to feel overwhelmed. Let's take a deep breath.",
            "detected_emotions": ["stressed", "anxious"],
            "risk_score": 50,
            "wellness_suggestions": ["5-min Grounding", "Take a short walk"]
        }
    
    return {
        "response_text": "I hear you. Tell me more about how you're feeling.",
        "detected_emotions": ["neutral"],
        "risk_score": 10,
        "wellness_suggestions": ["Journaling"]
    }

async def generate_journal_insights(journal_texts: list) -> dict:
    """
    Analyzes recent journal entries and provides CBT-inspired insights.
    Returns a dict with 'summary', 'patterns', 'advice'.
    """
    if not journal_texts:
        return {
            "summary": "No recent entries to analyze.",
            "patterns": [],
            "advice": "Keep writing to discover more about yourself."
        }

    if not client:
        logger.warning("OPENAI_API_KEY not set. Using mock journal insights.")
        return {
            "summary": "You've been expressing a mix of emotions recently. It's clear you're navigating some challenges but also showing resilience.",
            "patterns": ["Increased stress around academics", "Seeking connection"],
            "advice": "Consider breaking down your large tasks into smaller, manageable pieces to reduce feeling overwhelmed."
        }

    combined_text = "\n\n---\n\n".join(journal_texts)
    system_prompt = f"""
You are MindBridge AI, an empathetic and professional psychological analyzer.
Read the user's recent journal entries below and provide a supportive, CBT-inspired reflection.

You MUST return your response as a JSON object with the following exact keys:
{{
    "summary": "A 2-3 sentence empathetic summary of how they've been feeling.",
    "patterns": ["Pattern 1", "Pattern 2"],
    "advice": "A gentle, actionable piece of CBT or mindfulness advice."
}}

Journal Entries:
{combined_text}
"""
    try:
        completion = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": system_prompt}],
            response_format={ "type": "json_object" },
            temperature=0.7,
            max_tokens=300,
        )
        response_content = completion.choices[0].message.content
        return json.loads(response_content)
    except Exception as e:
        logger.error(f"LLM API Error for Journal Insights: {e}")
        return {
            "summary": "We couldn't generate a deep reflection right now, but your feelings are valid.",
            "patterns": ["Reflective"],
            "advice": "Try again later when the service is fully restored."
        }
