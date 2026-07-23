from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.models.product_reviews import ProductReview
from app.schemas.product_reviews import ProductReviewResponse
from app.core.dependencies import get_current_admin
from app.models.users import User

router = APIRouter(prefix="/admin/reviews", tags=["Admin Reviews"])

@router.get("", response_model=dict)
def list_all_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: int = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    query = db.query(ProductReview)
    if product_id:
        query = query.filter(ProductReview.product_id == product_id)
        
    total = query.count()
    items = query.order_by(ProductReview.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": [ProductReviewResponse.model_validate(item).model_dump() for item in items],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.delete("/{id}", status_code=204)
def delete_review(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    review = db.query(ProductReview).filter(ProductReview.id == id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    db.delete(review)
    db.commit()
    return
