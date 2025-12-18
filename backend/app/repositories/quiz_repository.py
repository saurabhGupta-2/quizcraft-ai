from typing import Dict, Any, Optional
from datetime import datetime
from app.database.supabase_client import supabase_admin as supabase
from app.core.logging import get_logger
import uuid

logger = get_logger(__name__)


class QuizRepository:
    """Repository for quiz attempts and performance tracking."""

    async def create_quiz_attempt(
        self,
        user_id: str,
        lesson_id: str,
        score: int,
        total_questions: int,
        time_taken: int
    ) -> Dict[str, Any]:
        """Create a new quiz attempt."""
        try:
            # Inside create_quiz_attempt method...
            attempt_data = {
                'user_id': user_id,
                'lesson_id': lesson_id,
                'score': score,
                'total_questions': total_questions,
                'time_taken': time_taken, # <-- FIX: Rename this from time_taken_seconds
            }
            result = supabase.table('quiz_attempts').insert(attempt_data).execute()
            logger.info(f"Created quiz attempt result: {result.data}")
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Create quiz attempt error: {repr(e)}", exc_info=True)
            raise

    async def save_question_response(
        self,
        quiz_attempt_id: str,
        question_id: str,
        user_answer: str,
        is_correct: bool,
        time_taken: int
    ):
        """Save an individual question response."""
        try:
            response_data = {
                'quiz_attempt_id': quiz_attempt_id,
                'question_id': question_id,
                'user_answer': user_answer,
                'is_correct': is_correct,
                'time_taken': time_taken,
            }
            supabase.table('question_responses').insert(response_data).execute()
        except Exception as e:
            logger.error(f"Save question response error: {repr(e)}", exc_info=True)
            raise

    async def get_user_performance(
        self,
        user_id: str,
        lesson_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get user performance statistics using a Supabase RPC call."""
        try:
            # --- OPTIMIZED METHOD ---
            # Call the database function instead of calculating in Python
            rpc_params = {'p_user_id': user_id}
            if lesson_id:
                rpc_params['p_lesson_id'] = lesson_id

            result = supabase.rpc('get_user_performance_stats', rpc_params).execute()
            
            # The function returns a list with one object, so we return that object
            # If no attempts, it returns an object with null/0 values
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Get user performance error for user {user_id}: {repr(e)}", exc_info=True)
            raise

    async def compute_attempt_stats(self, attempt_id: str) -> Dict[str, Any]:
        try:
            responses = supabase.table('question_responses').select('*').eq('quiz_attempt_id', attempt_id).execute()
            data = responses.data or []
            total_answered = len(data)
            correct_count = sum(1 for r in data if r.get('is_correct'))
            return {
                'total_answered': total_answered,
                'correct_count': correct_count,
            }
        except Exception as e:
            logger.error(f"Compute attempt stats error for {attempt_id}: {repr(e)}", exc_info=True)
            raise

    async def update_quiz_attempt_stats(self, attempt_id: str, correct_count: int, total_count: int, time_taken: Optional[int] = None) -> Dict[str, Any]:
        try:
            score = round((correct_count / total_count) * 100) if total_count > 0 else 0
            update_data: Dict[str, Any] = {
                'score': score,
                'total_questions': total_count,
            }
            if time_taken is not None:
                update_data['time_taken'] = time_taken
            result = supabase.table('quiz_attempts').update(update_data).eq('id', attempt_id).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Update quiz attempt stats error for {attempt_id}: {repr(e)}", exc_info=True)
            raise
