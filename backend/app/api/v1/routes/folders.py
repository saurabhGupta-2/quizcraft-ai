from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.api.v1.dependencies import get_current_user_id
from app.database.supabase_client import supabase
from app.core.logging import get_logger
import uuid

router = APIRouter()
logger = get_logger(__name__)


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str]
    created_at: str
    updated_at: str


@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder: FolderCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new folder."""
    try:
        from datetime import datetime
        folder_data = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'name': folder.name,
            'parent_id': folder.parent_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('folders').insert(folder_data).execute()
        return result.data[0]
        
    except Exception as e:
        logger.error(f"Create folder error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[FolderResponse])
async def get_folders(
    user_id: str = Depends(get_current_user_id)
):
    """Get all folders for user."""
    try:
        result = supabase.table('folders').select('*').eq('user_id', user_id).order('name').execute()
        return result.data
    except Exception as e:
        logger.error(f"Get folders error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a folder."""
    try:
        # Check if folder has lessons
        lessons = supabase.table('lessons').select('id').eq('folder_id', folder_id).execute()
        
        if lessons.data:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete folder with lessons. Move or delete lessons first."
            )
        
        supabase.table('folders').delete().eq('id', folder_id).eq('user_id', user_id).execute()
        return {"message": "Folder deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete folder error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))