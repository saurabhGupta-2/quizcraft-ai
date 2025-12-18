# app/services/content/file_processor.py
import io
import os
import uuid
from typing import Dict, Any
import mammoth  # For docx extraction
from PyPDF2 import PdfReader
from app.database.supabase_client import supabase, supabase_admin
from app.core.config import settings
from app.core.logging import get_logger
from app.utils.helpers import sanitize_filename 
from fastapi import HTTPException

logger = get_logger(__name__)


class FileProcessor:
    """Service for processing various document types (PDF, DOCX, TXT)."""

    async def process_file(
        self,
        file_content: bytes,
        filename: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Process an uploaded file, extract text, and store it."""
        
        # Sanitize filename and prepare paths
        safe_filename = sanitize_filename(filename)
        file_ext = os.path.splitext(safe_filename)[1].lower()
        file_id = str(uuid.uuid4())
        file_path = f"{user_id}/{file_id}{file_ext}" # Path within Supabase Storage

        logger.info(f"Processing file: {safe_filename}, type: {file_ext}, size: {len(file_content)} bytes")

        try:
            # === STEP 1: Extract Text ===
            text = ""
            if file_ext == '.pdf':
                text = self._extract_pdf_text(file_content)
                logger.info("Extracted text from PDF.")
            elif file_ext == '.docx':
                text = self._extract_docx_text(file_content)
                logger.info("Extracted text from DOCX.")
            elif file_ext in ['.txt', '.md']:
                text = file_content.decode('utf-8', errors='ignore')
                logger.info("Decoded text from TXT/MD.")
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")

            # === STEP 2: Upload File to Supabase Storage ===
            logger.info(f"Uploading file to storage at path: {file_path}")
            
            try:
                # Determine content type
                content_type = 'application/octet-stream'
                if file_ext == '.pdf':
                    content_type = 'application/pdf'
                elif file_ext == '.docx':
                    content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                elif file_ext == '.txt':
                    content_type = 'text/plain'
                elif file_ext == '.md':
                    content_type = 'text/markdown'

                upload_response = supabase_admin.storage.from_('documents').upload(
                    path=file_path,
                    file=file_content,
                    file_options={'content-type': content_type}
                )
                logger.info(f"File upload response: {upload_response}")
                logger.info("File upload to storage successful.")
            except KeyError as ke:
                # Catch potential library bug in storage3 where it fails to parse error response
                logger.error(f"Storage library KeyError (likely parsing error response) for path {file_path}: {ke}", exc_info=True)
                raise HTTPException(status_code=502, detail=f"Storage service returned an unexpected response format. Please try again.")
            except Exception as upload_err:
                logger.error(f"Storage upload failed for path {file_path}: {repr(upload_err)}", exc_info=True)
                if hasattr(upload_err, 'status_code'):
                    raise HTTPException(status_code=upload_err.status_code, detail=f"Storage upload failed: {str(upload_err)}")
                else:
                    raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(upload_err)}")

            # === STEP 3: Insert Metadata into Database ===
            file_metadata = {
                'id': file_id,
                'user_id': user_id,
                'filename': safe_filename,
                'file_path': file_path,
                'file_type': file_ext,
                'extracted_text': text,
                'file_size': len(file_content)
            }
            
            logger.info(f"Attempting to insert metadata into 'uploaded_files' table for file ID: {file_id}")
            try:
                result = supabase_admin.table('uploaded_files').insert(file_metadata).execute()

                if result.data:
                    logger.info(f"Successfully inserted metadata for file ID: {file_id}")
                    return result.data[0] if isinstance(result.data, list) else result.data
                else:
                    if result.error:
                        db_error = {
                            'message': result.error.message,
                            'details': result.error.details,
                            'hint': result.error.hint,
                            'code': result.error.code
                        }
                        logger.error(f"Database insert failed: {db_error}")
                        raise HTTPException(status_code=400 if result.error.code == '400' else 500, 
                                          detail=f"Failed to save file metadata: {result.error.message}")
                    else:
                        logger.error("Database insert succeeded but returned no data.")
                        raise HTTPException(status_code=500, detail="Failed to save file metadata: Unknown database error")
            except Exception as db_err:
                logger.error(f"Database operation error: {repr(db_err)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Database error: {str(db_err)}")

        except ValueError as ve:
            logger.warning(f"File processing validation error for '{filename or 'N/A'}': {ve}")
            raise HTTPException(status_code=400, detail=str(ve))
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected file processing error for '{filename}': {repr(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

    def _extract_pdf_text(self, file_content: bytes) -> str:
        """Extract text from PDF content."""
        pdf_file = io.BytesIO(file_content)
        reader = PdfReader(pdf_file)
        text_parts = [page.extract_text() or "" for page in reader.pages]
        logger.debug(f"Extracted {len(text_parts)} pages from PDF.")
        return "\n\n".join(text_parts)

    def _extract_docx_text(self, file_content: bytes) -> str:
        """Extract text from DOCX content using mammoth."""
        docx_file = io.BytesIO(file_content)
        result = mammoth.convert_to_markdown(docx_file)
        logger.debug("Converted DOCX to markdown text.")
        return result.value or ""

    async def get_file_content(self, file_id: str, user_id: str) -> Dict[str, Any]:
        """Retrieve extracted text and metadata of a file from the database."""
        try:
            logger.info(f"Retrieving extracted text for file ID: {file_id} by user {user_id}")
            
            # Use supabase_admin to ensure we can read the file
            result = supabase_admin.table('uploaded_files').select('extracted_text, filename').eq('id', file_id).eq('user_id', user_id).execute()
            
            if not result.data or len(result.data) == 0:
                logger.warning(f"File content not found or access denied for ID: {file_id}, User: {user_id}")
                raise HTTPException(status_code=404, detail="File not found or access denied")
            
            file_data = result.data[0]
            extracted_text = file_data.get('extracted_text', '')
            filename = file_data.get('filename', 'Unknown File')
            
            logger.info(f"Successfully retrieved extracted text for file ID: {file_id} (length: {len(extracted_text)} chars)")
            
            return {
                'content': extracted_text,
                'filename': filename
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Get file content error for ID {file_id}: {repr(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to retrieve file content")