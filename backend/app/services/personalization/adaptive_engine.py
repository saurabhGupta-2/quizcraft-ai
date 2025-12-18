from typing import Dict, Any, List
from app.repositories.quiz_repository import QuizRepository
from app.core.logging import get_logger
from app.database.supabase_client import supabase

logger = get_logger(__name__)


class AdaptiveEngine:
    """Engine for adaptive learning based on student performance."""
    
    def __init__(self):
        self.quiz_repo = QuizRepository()
    
    async def recommend_difficulty(
        self,
        user_id: str,
        topic: str
    ) -> str:
        """Recommend difficulty level based on past performance."""
        try:
            performance = await self.quiz_repo.get_user_performance(user_id)
            total_attempts = performance.get('total_attempts') or 0
            if total_attempts == 0:
                return 'medium'

            avg_score = performance.get('average_score') or 0
            
            if avg_score >= 90:
                return 'hard'
            elif avg_score >= 75:
                return 'medium'
            else:
                return 'easy'
                
        except Exception as e:
            logger.error(f"Recommend difficulty error: {str(e)}")
            return 'medium'
    
    async def identify_weak_areas(
        self,
        user_id: str,
        lesson_id: str
    ) -> List[str]:
        """Identify weak areas based on question responses."""
        try:
            # Get all question responses for the lesson
            attempts = supabase.table('quiz_attempts').select('id').eq('user_id', user_id).eq('lesson_id', lesson_id).execute().data
            
            if not attempts:
                return []
            
            weak_bloom_levels = []
            
            for attempt in attempts:
                responses = supabase.table('question_responses').select('*, questions(bloom_level)').eq('quiz_attempt_id', attempt['id']).execute().data
                
                bloom_performance = {}
                for resp in responses:
                    bloom_level = resp['questions']['bloom_level']
                    if bloom_level not in bloom_performance:
                        bloom_performance[bloom_level] = {'correct': 0, 'total': 0}
                    
                    bloom_performance[bloom_level]['total'] += 1
                    if resp['is_correct']:
                        bloom_performance[bloom_level]['correct'] += 1
                
                # Identify bloom levels with < 70% accuracy
                for level, perf in bloom_performance.items():
                    accuracy = perf['correct'] / perf['total']
                    if accuracy < 0.7 and level not in weak_bloom_levels:
                        weak_bloom_levels.append(level)
            
            return weak_bloom_levels
            
        except Exception as e:
            logger.error(f"Identify weak areas error: {str(e)}")
            return []
