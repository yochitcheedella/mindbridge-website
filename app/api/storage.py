from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import Dict
import uuid

from app.core.deps import get_current_user_any_role
from app.services.storage import upload_file

router = APIRouter(prefix="/api/storage", tags=["storage"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user_any_role)
) -> Dict[str, str]:
    """
    Endpoint for students, psychologists, and administrators to upload files to Supabase Storage (with local disk fallback).
    (e.g., medical certificates, counseling attachments, or profile avatars)
    """
    try:
        contents = await file.read()
        # Generate a unique path for the file based on role and user ID
        file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "bin"
        unique_filename = f"{user['role']}_{user['id']}/{uuid.uuid4()}.{file_ext}"
        
        public_url = upload_file("documents", unique_filename, contents, file.content_type or "application/octet-stream")

        if not public_url:
            raise Exception("File save returned an empty path.")
            
        return {"status": "success", "url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
