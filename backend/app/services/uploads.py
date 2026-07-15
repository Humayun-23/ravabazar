from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.schemas.uploads import ImageUploadResponse

try:
    import cloudinary
    import cloudinary.uploader
except ImportError:  # pragma: no cover - exercised when local deps are incomplete
    cloudinary = None


class CloudinaryUploadService:
    def __init__(self):
        if cloudinary is None:
            return

        # Configure cloudinary
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )

    async def upload_image(self, file: UploadFile, folder: str = "products") -> ImageUploadResponse:
        # Validate content type (basic check)
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File provided is not an image")

        if cloudinary is None:
            raise HTTPException(
                status_code=500,
                detail="Cloudinary dependency is not installed.",
            )
            
        try:
            # Read file into memory
            file_bytes = await file.read()
            
            # Use cloudinary uploader to upload image
            result = cloudinary.uploader.upload(
                file_bytes,
                folder=folder
            )
            
            image_url = result.get("secure_url")
            if not image_url:
                raise HTTPException(status_code=500, detail="Cloudinary upload failed to return URL")
                
            return ImageUploadResponse(
                image_url=image_url,
                provider="cloudinary"
            )
            
        except Exception as e:
            # Log the exception in a real application
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
