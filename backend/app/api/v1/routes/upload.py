# app/api/v1/routes/upload.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import os

from app.services.content.file_processor import FileProcessor
from app.core.config import settings
from app.core.logging import get_logger
from app.api.v1.dependencies import get_current_user_id
from app.utils.helpers import sanitize_filename

router = APIRouter()
logger = get_logger(__name__)


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload and process a file (PDF, DOCX, TXT, MD)."""
    try:
        # Validate file size first (read content only once)
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,  # Payload Too Large
                detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE / 1024 / 1024:.1f} MB"
            )

        # Sanitize filename and validate extension
        safe_filename = sanitize_filename(file.filename)
        file_ext = os.path.splitext(safe_filename)[1].lower()

        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,  # Bad Request
                detail=f"Invalid file type '{file_ext}'. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # Process file using the correct service
        processor = FileProcessor()
        file_data = await processor.process_file(
            file_content=content,
            filename=safe_filename,
            user_id=user_id
        )

        logger.info(f"File uploaded and processed: {file_data.get('id', 'N/A')}")
        # Return wrapped in "data" to match frontend expectation
        return {
            "data": {
                "id": file_data.get('id'),
                "filename": file_data.get('filename'),
                "file_size": file_data.get('file_size'),
                "file_type": file_data.get('file_type')
            }
        }

    except HTTPException:
        raise
    except ValueError as ve:
        logger.warning(f"File upload validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected upload error for file '{file.filename}': {repr(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during file upload."
        )