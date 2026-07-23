from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.dependencies import get_db
from app.models.products import Product
from app.models.product_reviews import ProductReview
from app.models.orders import Order
from app.models.order_items import OrderItem
from app.schemas.product_reviews import ProductReviewCreate, ProductReviewResponse
from app.core.dependencies import get_current_user
from app.models.users import User

router = APIRouter(prefix="/products", tags=["Product Reviews"])

@router.get("/{product_id}/reviews", response_model=dict)
def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.status == "active").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    query = db.query(ProductReview).filter(ProductReview.product_id == product_id)
    total = query.count()
    items = query.order_by(ProductReview.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    total_pages = (total + page_size - 1) // page_size

    # Manually serialize items to dict to avoid pydantic issues with nested models, 
    # but since we set response_model=dict, FastAPI will convert models that conform.
    # To be safer with user relations, we can return the raw items and let FastAPI encode it.
    return {
        "items": [ProductReviewResponse.model_validate(item).model_dump() for item in items],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.post("/{product_id}/reviews", response_model=ProductReviewResponse, status_code=201)
def add_product_review(
    product_id: int,
    review_in: ProductReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id, Product.status == "active").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user has purchased the item
    has_purchased = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        OrderItem.product_id == product_id,
        Order.status.not_in(["cancelled", "failed", "refunded"])
    ).first()

    if not has_purchased:
        raise HTTPException(
            status_code=403, 
            detail="You must have purchased this product to leave a review."
        )

    # Check if user already reviewed
    existing_review = db.query(ProductReview).filter(
        ProductReview.product_id == product_id,
        ProductReview.user_id == current_user.id
    ).first()

    if existing_review:
        raise HTTPException(status_code=409, detail="You have already reviewed this product.")

    review = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
