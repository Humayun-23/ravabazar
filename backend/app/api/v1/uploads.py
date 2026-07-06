from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.dependencies import get_current_admin
from app.schemas.uploads import ImageUploadResponse
from app.services.uploads import CloudinaryUploadService

router = APIRouter()

@router.post(
    "/images", 
    response_model=ImageUploadResponse, 
    status_code=status.HTTP_201_CREATED
)
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form(None),
    current_admin=Depends(get_current_admin)
):
    service = CloudinaryUploadService()
    # Cloudinary upload service uses async file reading
    if folder:
        return await service.upload_image(file, folder)
    else:
        return await service.upload_image(file)
