from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from app.database.supabase_client import supabase_admin
from app.core.logging import get_logger
import uuid

logger = get_logger(__name__)


class SpacedRepetitionService:
    """Service for spaced repetition algorithm (SM-2)."""
    
    async def update_card_performance(
        self,
        user_id: str,
        flashcard_id: str,
        quality: int  # 0-5 rating
    ) -> Dict[str, Any]:
        """Update flashcard based on performance using SM-2 algorithm."""
        try:
            if not 0 <= quality <= 5:
                raise ValueError("Quality must be between 0 and 5")
            # Get or create tracking record
            tracking = await self._get_or_create_tracking(user_id, flashcard_id)
            
            ease_factor = tracking['ease_factor']
            repetitions = tracking['repetitions']
            interval = tracking['interval']
            
            # SM-2 Algorithm
            if quality >= 3:  # Correct response
                if repetitions == 0:
                    interval = 1
                elif repetitions == 1:
                    interval = 6
                else:
                    interval = int(interval * ease_factor)
                
                repetitions += 1
            else:  # Incorrect response
                repetitions = 0
                interval = 1
            
            # Update ease factor
            ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            ease_factor = max(1.3, ease_factor)  # Minimum ease factor
            
            # Calculate next review date
            next_review_date = datetime.now(timezone.utc) + timedelta(days=interval)
            
            # Update database
            update_data = {
                'ease_factor': ease_factor,
                'interval': interval,
                'repetitions': repetitions,
                'next_review_date': next_review_date.isoformat().replace('+00:00', 'Z'),
                'updated_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
            
            supabase_admin.table('spaced_repetition_tracking').update(update_data).eq('id', tracking['id']).execute()
            refreshed = supabase_admin.table('spaced_repetition_tracking').select('*').eq('id', tracking['id']).single().execute()
            return refreshed.data
            
        except Exception as e:
            logger.error(f"Update card performance error: {str(e)}")
            raise
    
    async def _get_or_create_tracking(
        self,
        user_id: str,
        flashcard_id: str
    ) -> Dict[str, Any]:
        """Get or create tracking record for a flashcard."""
        try:
            # Try to get existing
            result = supabase_admin.table('spaced_repetition_tracking').select('*').eq('user_id', user_id).eq('flashcard_id', flashcard_id).execute()
            
            if result.data:
                return result.data[0]
            
            # Create new
            # Set next_review_date slightly in the past to ensure it shows up as due immediately
            initial_due_date = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat().replace('+00:00', 'Z')
            
            tracking_data = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'flashcard_id': flashcard_id,
                'ease_factor': 2.5,
                'interval': 1,
                'repetitions': 0,
                'next_review_date': initial_due_date,
                'created_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                'updated_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
            
            result = supabase_admin.table('spaced_repetition_tracking').insert(tracking_data).execute()
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Get or create tracking error: {str(e)}")
            raise
    
    async def get_due_cards(self, user_id: str, lesson_id: str) -> List[Dict[str, Any]]:
        """Get flashcards due for review."""
        try:
            # Get all flashcards for lesson
            flashcards = supabase_admin.table('flashcards').select('*').eq('lesson_id', lesson_id).execute().data
            
            due_cards = []
            for card in flashcards:
                tracking = await self._get_or_create_tracking(user_id, card['id'])
                
                # Check if due
                # 1. If never studied (repetitions == 0), it's always due
                # 2. If review date has passed
                is_due = False
                
                if tracking.get('repetitions', 0) == 0:
                    is_due = True
                else:
                    review_date = tracking.get('next_review_date')
                    if review_date:
                        try:
                            rd = datetime.fromisoformat(str(review_date).replace('Z', '+00:00'))
                            now = datetime.now(timezone.utc)
                            if rd <= now:
                                is_due = True
                        except Exception:
                            pass
                
                if is_due:
                    card['tracking'] = tracking
                    due_cards.append(card)
            
            return due_cards
            
        except Exception as e:
            logger.error(f"Get due cards error: {str(e)}")
            raise
