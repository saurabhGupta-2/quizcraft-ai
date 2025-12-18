from datetime import datetime
from typing import List, Tuple

from mem0 import MemoryClient
from google import genai

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _get_mem0_client() -> MemoryClient:
  """
  Build Mem0 client using dedicated MEM0_API_KEY.
  """
  if not settings.MEM0_API_KEY:
      raise RuntimeError(
          "MEM0_API_KEY is not set. Please add it to your backend .env to use the AI Tutor."
      )
  return MemoryClient(api_key=settings.MEM0_API_KEY)


def _get_gemini_client() -> genai.Client:
  """
  Build Gemini client using dedicated GEMINI_API_KEY.
  """
  if not settings.GEMINI_API_KEY:
      raise RuntimeError(
          "GEMINI_API_KEY is not set. Please add it to your backend .env to use the AI Tutor."
      )
  return genai.Client(api_key=settings.GEMINI_API_KEY)


def get_personalized_context(student_id: str, current_question: str) -> str:
    """
    Retrieve relevant educational memories for personalized tutoring.
    """
    try:
        mem0_client = _get_mem0_client()
        filters = {"OR": [{"user_id": student_id}]}
        memory_results = mem0_client.search(
            query=current_question,
            filters=filters,
            version="v2",
            output_format="v1.1",
        )

        context = f"Current time: {datetime.now().strftime('%Y-%m-%d at %H:%M')}\n\n"
        context += "🎓 PERSONALIZED TUTORING CONTEXT\n"
        context += "What I know about this student's learning:\n\n"

        if memory_results.get("results"):
            for i, result in enumerate(memory_results["results"][:4], 1):
                memory_text = result["memory"]
                created_at = result.get("created_at", "")

                if created_at:
                    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    time_formatted = dt.strftime("%Y-%m-%d")
                    context += f"{i}. {memory_text} (noted on {time_formatted})\n"
                else:
                    context += f"{i}. {memory_text}\n"

        context += "\n🎯 TUTORING INSTRUCTIONS:\n"
        context += "- Provide personalized help based on the student's known strengths and weaknesses\n"
        context += "- Address any emotional concerns (anxiety, confidence) with empathy\n"
        context += "- Adapt your teaching style to their learning preferences\n"
        context += "- Reference previous topics when relevant\n"
        context += "- Encourage and build confidence\n\n"

        return context

    except Exception as e:
        # Avoid str.format braces issues by using Loguru's {} placeholder
        logger.error("Error building personalized context: {}", e, exc_info=True)
        return f"Context error: {str(e)}\n\n"


def store_educational_memory(
    messages: List[dict],
    student_id: str,
    include_emotions: bool = True,
) -> bool:
    """
    Store educational interactions with custom instructions for better memory.
    """
    try:
        if include_emotions:
            custom_instruction = (
                "Extract educational information including: learning topics, "
                "academic strengths/weaknesses, emotional states (anxiety, confidence), "
                "learning preferences, study habits, and specific subject difficulties."
            )
        else:
            custom_instruction = (
                "Focus on academic content: topics discussed, learning progress, "
                "and subject-specific strengths or challenges."
            )

        mem0_client = _get_mem0_client()

        mem0_client.add(
            messages,
            user_id=student_id,
            custom_instructions=custom_instruction,
            version="v2",
            output_format="v1.1",
        )
        return True

    except Exception as e:
        logger.error("Memory storage error: {}", e, exc_info=True)
        return False


def build_tutor_prompt(student_id: str, message: str) -> str:
    educational_context = get_personalized_context(student_id, message)

    tutor_prompt = f"{educational_context}\n"
    tutor_prompt += f"Student Question: {message}\n\n"
    tutor_prompt += (
        "As a personalized AI tutor, provide helpful, encouraging, and educational guidance:"
    )
    return tutor_prompt


async def personalized_tutor_chat(
    message: str,
    student_id: str,
    history: List[Tuple[str, str]] | None = None,
) -> Tuple[List[Tuple[str, str]], str]:
    """
    Main function that handles personalized tutoring conversations.
    Returns updated history and an empty input string (mirroring Gradio pattern).
    """
    if history is None:
        history = []

    try:
        tutor_prompt = build_tutor_prompt(student_id, message)

        gemini_client = _get_gemini_client()

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=tutor_prompt,
        )

        tutor_response = response.text

        messages_to_store = [
            {"role": "user", "content": message},
            {"role": "assistant", "content": tutor_response},
        ]

        store_educational_memory(messages_to_store, student_id)

        history.append((message, tutor_response))
        return history, ""

    except Exception as e:
        logger.error("Tutor chat error: {}", e, exc_info=True)
        error_msg = f"Tutor Error: {str(e)}"
        history.append((message, error_msg))
        return history, ""


def get_student_learning_profile(student_id: str) -> str:
    """
    Generate a comprehensive learning profile from stored memories.
    """
    try:
        mem0_client = _get_mem0_client()

        # Newer Mem0 API requires non-empty filters; use user_id as filter
        raw = mem0_client.get_all(
            filters={"user_id": student_id},
            version="v2",
            output_format="v1.1",
        )

        # Mem0 may return a dict with "results" or a raw list; normalize to a list
        if isinstance(raw, dict):
            memories = raw.get("results", [])
        else:
            memories = raw or []

        if not memories:
            return "No learning history found. Start chatting to build your profile!"

        profile = "📚 PERSONALIZED LEARNING PROFILE\n"
        profile += "=" * 40 + "\n\n"

        strengths: list[str] = []
        weaknesses: list[str] = []
        emotions: list[str] = []
        preferences: list[str] = []
        subjects: list[str] = []

        for memory in memories:
            text = memory["memory"].lower()
            memory_text = memory["memory"]

            if any(word in text for word in ["good at", "excel", "strong", "understand"]):
                strengths.append(memory_text)
            elif any(word in text for word in ["struggle", "difficult", "hard", "weak"]):
                weaknesses.append(memory_text)
            elif any(
                word in text
                for word in ["anxious", "scared", "confident", "overwhelmed", "stressed"]
            ):
                emotions.append(memory_text)
            elif any(
                word in text
                for word in ["learn best", "prefer", "visual", "step-by-step"]
            ):
                preferences.append(memory_text)
            elif any(
                word in text
                for word in ["math", "physics", "chemistry", "biology", "calculus"]
            ):
                subjects.append(memory_text)

        if strengths:
            profile += "💪 ACADEMIC STRENGTHS:\n"
            for strength in strengths[:3]:
                profile += f"  • {strength}\n"
            profile += "\n"

        if weaknesses:
            profile += "📈 AREAS FOR IMPROVEMENT:\n"
            for weakness in weaknesses[:3]:
                profile += f"  • {weakness}\n"
            profile += "\n"

        if emotions:
            profile += "🎭 EMOTIONAL INSIGHTS:\n"
            for emotion in emotions[:3]:
                profile += f"  • {emotion}\n"
            profile += "\n"

        if preferences:
            profile += "🎯 LEARNING PREFERENCES:\n"
            for pref in preferences[:3]:
                profile += f"  • {pref}\n"
            profile += "\n"

        profile += "🧠 ALL STORED MEMORIES:\n"
        profile += "-" * 30 + "\n"

        for i, memory in enumerate(memories, 1):
            created_at = memory.get("created_at", "")
            memory_text = memory["memory"]

            if created_at:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                time_formatted = dt.strftime("%m/%d %H:%M")
                profile += f"{i}. {memory_text}\n"
                profile += f"   📅 {time_formatted}\n\n"
            else:
                profile += f"{i}. {memory_text}\n\n"

        profile += "=" * 40 + "\n"
        profile += f"📊 Total memories: {len(memories)}\n"
        profile += f"📅 Profile updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"

        return profile

    except Exception as e:
        logger.error("Profile generation error: {}", e, exc_info=True)
        return f"Profile Error: {str(e)}"


def add_spaced_repetition_memory(
    user_id: str,
    flashcard_id: str,
    quality: int,
    ease_factor: float | None = None,
    interval: int | None = None,
) -> bool:
    """
    Store spaced-repetition feedback as a memory to improve personalization.
    """
    try:
        mem0_client = _get_mem0_client()
        memory_text = (
            f"Flashcard {flashcard_id} reviewed with quality {quality}. "
            f"Ease factor: {ease_factor if ease_factor is not None else 'n/a'}, "
            f"Interval: {interval if interval is not None else 'n/a'} days."
        )
        mem0_client.add(
            messages=[{"role": "user", "content": memory_text}],
            user_id=user_id,
            custom_instructions=(
                "Store spaced repetition feedback to capture strengths/weaknesses "
                "and confidence. Focus on topic difficulty inferred from quality ratings."
            ),
            version="v2",
            output_format="v1.1",
        )
        return True
    except Exception as e:
        logger.error("Spaced repetition memory error: {}", e, exc_info=True)
        return False


def add_quiz_result_memory(
    user_id: str,
    lesson_id: str,
    score: int,
    correct_answers: int,
    incorrect_answers: int,
    time_taken: int,
    attempt_id: str | None = None,
) -> bool:
    """
    Store quiz result feedback as a memory to improve personalization.
    """
    try:
        mem0_client = _get_mem0_client()
        memory_text = (
            f"Quiz result for lesson {lesson_id}: score {score}%, "
            f"correct {correct_answers}, incorrect {incorrect_answers}, "
            f"time_taken {time_taken}s. Attempt: {attempt_id or 'n/a'}."
        )
        mem0_client.add(
            messages=[{"role": "user", "content": memory_text}],
            user_id=user_id,
            custom_instructions=(
                "Store quiz performance to capture strengths/weaknesses and progress. "
                "Focus on topics the user is strong or weak in based on scores."
            ),
            version="v2",
            output_format="v1.1",
        )
        return True
    except Exception as e:
        logger.error("Quiz result memory error: {}", e, exc_info=True)
        return False


