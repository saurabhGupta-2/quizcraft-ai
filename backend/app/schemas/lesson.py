from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    FILL_BLANK = "fill_in_the_blanks"
    MATCHING = "matching"
    MIXED = "mixed"


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"
    MIXED = "mixed"


class AIModel(str, Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    ULTRA = "ultra"


class BloomLevel(str, Enum):
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"


class GenerationSource(str, Enum):
    UPLOAD = "upload"
    TOPIC = "topic"
    NOTES = "notes"


class GenerationRequest(BaseModel):
    source_type: GenerationSource
    content: Optional[str] = None
    topic: Optional[str] = None
    file_id: Optional[str] = None
    
    question_type: QuestionType = QuestionType.MIXED
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    ai_model: AIModel = AIModel.BASIC
    max_questions: int = Field(default=10, ge=5, le=40)
    bloom_levels: Optional[List[BloomLevel]] = None
    custom_instructions: Optional[str] = None


class QuestionOption(BaseModel):
    option_text: str
    is_correct: bool


class Question(BaseModel):
    id: Optional[str] = None
    question_text: str
    question_type: QuestionType
    difficulty: DifficultyLevel
    bloom_level: BloomLevel
    options: Optional[List[QuestionOption]] = None
    correct_answer: str
    explanation: str
    points: int = 1


class Flashcard(BaseModel):
    id: Optional[str] = None
    front: str
    back: str
    confidence_level: Optional[int] = None


class LessonCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    folder_id: Optional[str] = None


# --- NEW SCHEMA FOR METADATA ---
# This schema is for the list view, containing only the lesson metadata.
# This prevents the Pydantic validation error.
class LessonMetadataResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    folder_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
# --- END NEW SCHEMA ---


class LessonResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    folder_id: Optional[str]
    questions: List[Question]   # Required for the detailed view
    flashcards: List[Flashcard] # Required for the detailed view
    study_notes: str            # Required for the detailed view
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
