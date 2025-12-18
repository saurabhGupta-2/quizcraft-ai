from typing import List, Dict, Any, Optional
from datetime import datetime
from app.database.supabase_client import supabase, supabase_admin
from app.core.logging import get_logger
import uuid
import asyncio

logger = get_logger(__name__)


class LessonRepository:
    """Repository for lesson data access."""
    
    async def create_lesson(
        self,
        user_id: str,
        title: str,
        description: Optional[str] = None,
        folder_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new lesson."""
        try:
            lesson_data = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'title': title,
                'description': description,
                'folder_id': folder_id,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = supabase_admin.table('lessons').insert(lesson_data).execute()
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Create lesson error: {str(e)}")
            raise
    
    async def create_lesson_with_content(
        self,
        user_id: str,
        title: str,
        questions: List[Dict[str, Any]],
        flashcards: List[Dict[str, Any]],
        study_notes: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create lesson with generated content."""
        try:
            # Create lesson
            lesson = await self.create_lesson(user_id, title, description)
            lesson_id = lesson['id']
            
            # Add questions
            for q in questions:
                question_data = {
                    'id': str(uuid.uuid4()),
                    'lesson_id': lesson_id,
                    'question_text': q.get('question_text'),
                    'question_type': q.get('question_type', 'multiple_choice'),
                    'difficulty': q.get('difficulty', 'medium'),
                    'bloom_level': q.get('bloom_level', 'understand'),
                    'correct_answer': q.get('correct_answer'),
                    'explanation': q.get('explanation', ''),
                    'options': q.get('options', []),
                    'points': 1
                }
                supabase_admin.table('questions').insert(question_data).execute()
            
            # Add flashcards
            for fc in flashcards:
                flashcard_data = {
                    'id': str(uuid.uuid4()),
                    'lesson_id': lesson_id,
                    'front': fc.get('front'),
                    'back': fc.get('back'),
                    'confidence_level': 0
                }
                supabase_admin.table('flashcards').insert(flashcard_data).execute()
            
            # Add study notes
            notes_data = {
                'id': str(uuid.uuid4()),
                'lesson_id': lesson_id,
                'content': study_notes
            }
            supabase_admin.table('study_notes').insert(notes_data).execute()
            
            # Get complete lesson
            return await self.get_lesson_by_id(lesson_id, user_id)
            
        except Exception as e:
            logger.error(f"Create lesson with content error: {str(e)}")
            raise
    
    async def get_lesson_by_id(
        self,
        lesson_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get lesson by ID with all associated content."""
        try:
            # 1. Fetch the main lesson record first to ensure it exists and the user has access.
            lesson_result = supabase_admin.table('lessons').select('*').eq('id', lesson_id).eq('user_id', user_id).execute()
            
            if not lesson_result.data:
                return None
            
            lesson = lesson_result.data[0]
            
            # 2. Fetch all related content in parallel using asyncio.gather.
            # This reduces the total wait time from (A + B + C) to max(A, B, C).
            questions_future = asyncio.to_thread(
                lambda: supabase_admin.table('questions').select('*').eq('lesson_id', lesson_id).execute()
            )
            flashcards_future = asyncio.to_thread(
                lambda: supabase_admin.table('flashcards').select('*').eq('lesson_id', lesson_id).execute()
            )
            notes_future = asyncio.to_thread(
                lambda: supabase_admin.table('study_notes').select('*').eq('lesson_id', lesson_id).execute()
            )

            # Wait for all queries to complete
            results = await asyncio.gather(questions_future, flashcards_future, notes_future)
            
            questions_result, flashcards_result, notes_result = results
            
            # 3. Assemble the response
            lesson['questions'] = questions_result.data
            lesson['flashcards'] = flashcards_result.data
            lesson['study_notes'] = notes_result.data[0]['content'] if notes_result.data else ""
            
            return lesson
            
        except Exception as e:
            logger.error(f"Get lesson error: {str(e)}")
            raise
    
    async def get_user_lessons(
        self,
        user_id: str,
        folder_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get all lessons for a user."""
        try:
            query = supabase_admin.table('lessons').select('*').eq('user_id', user_id)
            
            if folder_id:
                query = query.eq('folder_id', folder_id)
            
            result = query.order('created_at', desc=True).range(skip, skip + limit - 1).execute()
            
            return result.data
            
        except Exception as e:
            logger.error(f"Get user lessons error: {str(e)}")
            raise
    
    async def update_lesson(
        self,
        lesson_id: str,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a lesson."""
        try:
            data['updated_at'] = datetime.utcnow().isoformat()
            result = supabase_admin.table('lessons').update(data).eq('id', lesson_id).eq('user_id', user_id).execute()
            return result.data[0]
        except Exception as e:
            logger.error(f"Update lesson error: {str(e)}")
            raise
    
    async def delete_lesson(self, lesson_id: str, user_id: str) -> bool:
        """Delete a lesson. Associated content is deleted by database cascade."""
        try:
            # You only need to delete the main lesson record.
            # The 'ON DELETE CASCADE' in your database schema handles the rest.
            result = supabase_admin.table('lessons').delete().eq('id', lesson_id).eq('user_id', user_id).execute()
            
            logger.info(f"Lesson deleted: {lesson_id}")
            # The execute() result for delete returns the deleted data.
            # If data is present, deletion was successful.
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Delete lesson error: {str(e)}")
            raise