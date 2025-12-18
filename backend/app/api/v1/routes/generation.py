from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.lesson import GenerationRequest, LessonResponse
from app.services.llm.question_generator import QuestionGeneratorService
from app.services.content.content_analyzer import ContentAnalyzer
from app.services.content.file_processor import FileProcessor
from app.repositories.lesson_repository import LessonRepository
from app.api.v1.dependencies import get_current_user_id
from app.core.logging import get_logger
from app.schemas.lesson import GenerationSource, Question, Flashcard
from typing import List
import asyncio

router = APIRouter()
logger = get_logger(__name__)

content_analyzer = ContentAnalyzer()
lesson_repo = LessonRepository()
question_generator = QuestionGeneratorService()

@router.post("/", response_model=LessonResponse)
async def generate_content(
    request: GenerationRequest,
    user_id: str = Depends(get_current_user_id)
):
    logger.info(f"Generation request from user {user_id}, mode: {request.source_type}")
    
    content = ""
    title = ""

    try:
        # 1. Fetch Content
        if request.source_type == GenerationSource.TOPIC:
            if not request.topic:
                raise HTTPException(status_code=422, detail="Topic is required")
            title = request.topic
            # This step is the slow part (~45s)
            content = await content_analyzer.generate_content_from_topic(request.topic)
            if not content:
                raise HTTPException(status_code=500, detail="Failed to generate content")

        elif request.source_type == GenerationSource.UPLOAD:
            if not request.file_id:
                raise HTTPException(status_code=422, detail="file_id is required")
            file_processor = FileProcessor()
            file = await file_processor.get_file_content(request.file_id, user_id)
            if not file:
                raise HTTPException(status_code=404, detail="File not found")
            content = file['content']
            title = file['filename']

        elif request.source_type == GenerationSource.NOTES:
            content = request.content
            title = "Custom Notes"

        # 2. Chunk Content
        content_chunks = await content_analyzer.chunk_content(content) or []
        
        num_chunks = len(content_chunks)
        questions_per_chunk = 1
        flashcards_per_chunk = 1
        
        if num_chunks > 0:
            questions_per_chunk = max(1, request.max_questions // num_chunks)
            flashcards_per_chunk = max(1, 10 // num_chunks)

        logger.info(f"Processing {num_chunks} chunks...")

        all_questions: List[Question] = []
        all_flashcards: List[Flashcard] = []

        # --- FIX: SEMAPHORE CONCURRENCY ---
        # Allow 3 chunks to be processed at the same time.
        # This speeds up processing by ~3x compared to sequential, 
        # but prevents the API crash we saw earlier.
        semaphore = asyncio.Semaphore(3) 

        async def process_chunk(chunk):
            async with semaphore:
                # Run Q and FC generation in parallel for this chunk
                results = await asyncio.gather(
                    question_generator.generate_questions(
                        content=chunk,
                        num_questions=questions_per_chunk,
                        difficulty=request.difficulty,
                        question_type=request.question_type
                    ),
                    question_generator.generate_flashcards(
                        content=chunk,
                        num_flashcards=flashcards_per_chunk
                    ),
                    return_exceptions=True
                )
                return results

        # Create tasks for all chunks
        tasks = [process_chunk(chunk) for chunk in content_chunks]
        
        # Run them (controlled by semaphore)
        chunk_results_list = []
        if tasks:
            chunk_results_list = await asyncio.gather(*tasks)

        # 3. Aggregate Results
        for q_res, fc_res in chunk_results_list:
            if isinstance(q_res, list):
                all_questions.extend(q_res)
            elif isinstance(q_res, Exception):
                logger.error(f"Question Error: {q_res}")

            if isinstance(fc_res, list):
                all_flashcards.extend(fc_res)
            elif isinstance(fc_res, Exception):
                logger.error(f"Flashcard Error: {fc_res}")

        # 4. Generate Study Notes
        notes_result = await question_generator.generate_study_notes(content=content)
        study_notes = notes_result if isinstance(notes_result, str) else "Failed to generate notes."

        if not all_questions and not all_flashcards and "Failed" in study_notes:
             raise HTTPException(status_code=500, detail="All generation tasks failed.")

        # 5. Save
        lesson = await lesson_repo.create_lesson_with_content(
            user_id=user_id,
            title=title,
            description=f"Generated from {request.source_type.value}",
            questions=[q.model_dump() for q in all_questions],
            flashcards=[fc.model_dump() for fc in all_flashcards],
            study_notes=study_notes
        )
        
        return lesson

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))