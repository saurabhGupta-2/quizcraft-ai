from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from app.api.v1.dependencies import get_current_user_id
from app.repositories.quiz_repository import QuizRepository
from app.repositories.lesson_repository import LessonRepository # Import at top level
from app.services.personal_tutor import add_quiz_result_memory
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# --- More specific Pydantic models for better validation ---
class QuestionResponseItem(BaseModel):
    question_id: str
    user_answer: str
    time_taken: int = 0 # Optional time per question

class QuizSubmission(BaseModel):
    lesson_id: str
    responses: List[QuestionResponseItem]
    time_taken: int # Overall time in seconds

class QuizResult(BaseModel):
    score: int
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    time_taken: int
    attempt_id: str
# ---------------------------------------------------------


class StartAttemptRequest(BaseModel):
    lesson_id: str


class StartAttemptResponse(BaseModel):
    attempt_id: str
    lesson_id: str


class QuestionAnswerRequest(BaseModel):
    attempt_id: str
    lesson_id: str
    question_id: str
    user_answer: str
    time_taken: int = 0


class QuestionAnswerResponse(BaseModel):
    attempt_id: str
    question_id: str
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    total_answered: int
    correct_count: int
    score: int


@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    submission: QuizSubmission,
    user_id: str = Depends(get_current_user_id)
):
    """Submit quiz answers, get results, and save the attempt."""
    try:
        lesson_repo = LessonRepository()
        quiz_repo = QuizRepository()

        # 1. Fetch the lesson to get the correct answers
        lesson = await lesson_repo.get_lesson_by_id(submission.lesson_id, user_id)
        if not lesson or not lesson.get('questions'):
            raise HTTPException(status_code=404, detail="Lesson or its questions not found.")

        questions_map = {q['id']: q for q in lesson['questions']}

        # 2. Evaluate the user's responses
        correct_count = 0
        processed_responses = []
        for response in submission.responses:
            question = questions_map.get(response.question_id)
            if question:
                is_correct = response.user_answer.strip().lower() == question['correct_answer'].strip().lower()
                if is_correct:
                    correct_count += 1
                processed_responses.append({
                    "question_id": response.question_id,
                    "user_answer": response.user_answer,
                    "is_correct": is_correct,
                    "time_taken": response.time_taken
                })

        total_questions = len(submission.responses)
        score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0

        # 3. Create the main quiz attempt record FIRST to get its ID
        attempt = await quiz_repo.create_quiz_attempt(
            user_id=user_id,
            lesson_id=submission.lesson_id,
            score=score,
            total_questions=total_questions,
            time_taken=submission.time_taken
        )
        attempt_id = attempt['id']

        # 4. NOW, save the individual question responses with the correct attempt_id
        for resp in processed_responses:
            await quiz_repo.save_question_response(
                quiz_attempt_id=attempt_id,
                question_id=resp['question_id'],
                user_answer=resp['user_answer'],
                is_correct=resp['is_correct'],
                time_taken=resp['time_taken']
            )
        
        logger.info(f"Quiz attempt {attempt_id} saved for user {user_id} on lesson {submission.lesson_id} with score {score}%")

        # 5. Add quiz result to Mem0 for personalization (best-effort)
        try:
            add_quiz_result_memory(
                user_id=user_id,
                lesson_id=submission.lesson_id,
                score=score,
                correct_answers=correct_count,
                incorrect_answers=total_questions - correct_count,
                time_taken=submission.time_taken,
                attempt_id=attempt_id,
            )
        except Exception as mem_err:
            logger.warning(f"Quiz result memory add failed: {mem_err}")

        return {
            "score": score,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "incorrect_answers": total_questions - correct_count,
            "time_taken": submission.time_taken,
            "attempt_id": attempt_id
        }

    except Exception as e:
        logger.error(f"Error submitting quiz for lesson {submission.lesson_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while submitting the quiz.")


@router.post("/start", response_model=StartAttemptResponse)
async def start_attempt(
    payload: StartAttemptRequest,
    user_id: str = Depends(get_current_user_id)
):
    try:
        quiz_repo = QuizRepository()
        attempt = await quiz_repo.create_quiz_attempt(
            user_id=user_id,
            lesson_id=payload.lesson_id,
            score=0,
            total_questions=0,
            time_taken=0
        )
        return StartAttemptResponse(attempt_id=attempt["id"], lesson_id=payload.lesson_id)
    except Exception as e:
        logger.error(f"Error starting attempt for lesson {payload.lesson_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to start quiz attempt.")


@router.post("/answer", response_model=QuestionAnswerResponse)
async def answer_question(
    payload: QuestionAnswerRequest,
    user_id: str = Depends(get_current_user_id)
):
    try:
        lesson_repo = LessonRepository()
        quiz_repo = QuizRepository()
        lesson = await lesson_repo.get_lesson_by_id(payload.lesson_id, user_id)
        if not lesson or not lesson.get("questions"):
            raise HTTPException(status_code=404, detail="Lesson or its questions not found.")
        qmap = {q["id"]: q for q in lesson["questions"]}
        q = qmap.get(payload.question_id)
        if not q:
            raise HTTPException(status_code=404, detail="Question not found.")
        is_correct = payload.user_answer.strip().lower() == q["correct_answer"].strip().lower()
        await quiz_repo.save_question_response(
            quiz_attempt_id=payload.attempt_id,
            question_id=payload.question_id,
            user_answer=payload.user_answer,
            is_correct=is_correct,
            time_taken=payload.time_taken
        )
        stats = await quiz_repo.compute_attempt_stats(payload.attempt_id)
        await quiz_repo.update_quiz_attempt_stats(
            attempt_id=payload.attempt_id,
            correct_count=stats["correct_count"],
            total_count=stats["total_answered"]
        )
        score = round((stats["correct_count"] / stats["total_answered"]) * 100) if stats["total_answered"] > 0 else 0
        return QuestionAnswerResponse(
            attempt_id=payload.attempt_id,
            question_id=payload.question_id,
            is_correct=is_correct,
            correct_answer=q["correct_answer"],
            explanation=q.get("explanation") or None,
            total_answered=stats["total_answered"],
            correct_count=stats["correct_count"],
            score=score
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering question {payload.question_id} for attempt {payload.attempt_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit answer.")


@router.get("/performance")
async def get_performance(
    lesson_id: Optional[str] = Query(None, description="Optional lesson ID to scope performance stats"),
    user_id: str = Depends(get_current_user_id)
):
    """Get user performance statistics, either overall or for a specific lesson."""
    try:
        quiz_repo = QuizRepository()
        performance = await quiz_repo.get_user_performance(user_id, lesson_id)
        return performance
    except Exception as e:
        logger.error(f"Error getting performance for user {user_id}: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve performance data.")
