from app.services.llm.llm_service import LLMService, get_llm_service
from app.core.logging import get_logger
from app.core.exceptions import LLMServiceError
from app.schemas.lesson import QuestionType, DifficultyLevel, BloomLevel, Question, Flashcard
from typing import List, Dict, Any
import json
import re

logger = get_logger(__name__)

class QuestionGeneratorService:
    def __init__(self):
        # Reuse a cached LLMService instance for all question generation
        # to minimize per-request startup overhead.
        self.llm_service = get_llm_service()

    async def generate_questions(
        self,
        content: str,
        num_questions: int,
        difficulty: DifficultyLevel,
        question_type: QuestionType,
    ) -> List[Question]:
        
        # --- FIX 1: Improved Prompt with Strict JSON Example ---
        # We use double curly braces {{ }} to escape them in the f-string
        prompt = f"""
        Based on the following content, generate {num_questions} questions.
        Content: {content}
        Difficulty: {difficulty.value}
        Question Type: {question_type.value}
        
        Strictly output a JSON list of objects. Do not include markdown formatting (like ```json).
        Follow this exact JSON structure for every question:
        [
            {{
                "question_text": "The actual question here?",
                "question_type": "multiple_choice",
                "difficulty": "easy",
                "bloom_level": "remember",
                "options": [
                    {{"option_text": "Option A", "is_correct": true}},
                    {{"option_text": "Option B", "is_correct": false}}
                ],
                "correct_answer": "Option A",
                "explanation": "Why this is correct.",
                "points": 1
            }}
        ]
        """
        
        try:
            logger.info(f"Generating {num_questions} questions...")
            
            generated_json = await self.llm_service.generate_json(
                prompt=prompt,
                temperature=0.5
            )
            
            # --- FIX 2: Normalize JSON Structure ---
            # Handle cases where AI returns a list OR a dict wrapping a list
            data_list = []
            if isinstance(generated_json, list):
                data_list = generated_json
            elif isinstance(generated_json, dict) and "questions" in generated_json:
                data_list = generated_json["questions"]
            else:
                logger.warning(f"Unexpected JSON structure from LLM: {type(generated_json)}")
                return []

            validated_questions = []
            
            for q_data in data_list:
                try:
                    # --- FIX 3: Data Normalization (The "KeyError" Fix) ---
                    
                    # Map 'question' -> 'question_text' (Common AI inconsistency)
                    if 'question' in q_data and 'question_text' not in q_data:
                        q_data['question_text'] = q_data.pop('question')

                    # Map 'answer' -> 'correct_answer'
                    if 'answer' in q_data and 'correct_answer' not in q_data:
                        q_data['correct_answer'] = q_data.pop('answer')

                    # Ensure 'options' exists (AI often omits it for Short Answer/TrueFalse)
                    if 'options' not in q_data:
                        q_data['options'] = []

                    # Ensure points is an integer
                    q_data['points'] = int(q_data.get('points', 1))

                    # Validate with Pydantic model
                    validated_questions.append(Question(**q_data))
                    
                except Exception as validation_err:
                    # Log the specific error but don't crash the whole request
                    logger.warning(f"Skipping invalid question data: {validation_err} | Data: {q_data}")
                    continue

            return validated_questions

        except LLMServiceError as e:
            logger.error(f"Error generating questions: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in generate_questions: {e}", exc_info=True)
            raise e

    async def generate_flashcards(
        self,
        content: str,
        num_flashcards: int
    ) -> List[Flashcard]:
        
        prompt = f"""
        Based on the following content, generate {num_flashcards} flashcards.
        Content: {content}
        
        Format the output as a JSON list of objects, where each object has:
        - "front": str (The question or term)
        - "back": str (The answer or definition)
        """
        
        try:
            logger.info(f"Generating {num_flashcards} flashcards...")
            
            generated_json = await self.llm_service.generate_json(
                prompt=prompt,
                temperature=0.3
            )
            
            if isinstance(generated_json, list):
                return [Flashcard(**fc) for fc in generated_json]
            elif isinstance(generated_json, dict) and "flashcards" in generated_json:
                return [Flashcard(**fc) for fc in generated_json["flashcards"]]
                
            logger.warning(f"Unexpected JSON structure from LLM: {type(generated_json)}")
            return []

        except LLMServiceError as e:
            logger.error(f"Error generating flashcards: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in generate_flashcards: {e}", exc_info=True)
            raise e

    async def generate_study_notes(
        self,
        content: str
    ) -> str:
        
        prompt = f"""
        Based on the following content, generate comprehensive study notes.
        The notes should be well-structured, clear, concise, and in markdown format.
        Content: {content}
        """
        
        try:
            logger.info("Generating study notes...")
            
            notes = await self.llm_service.generate_text(
                prompt=prompt,
                temperature=0.2
            )
            
            return notes or "Failed to generate study notes."

        except LLMServiceError as e:
            logger.error(f"Error generating study notes: {e}")
            return "Error: Could not generate study notes due to LLM failure."
        except Exception as e:
            logger.error(f"Unexpected error in generate_study_notes: {e}", exc_info=True)
            raise e