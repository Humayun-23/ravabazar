from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.users import User
from app.models.wishlists import Wishlist
from app.models.products import Product
from app.schemas.wishlists import WishlistItemResponse, WishlistAddRequest

router = APIRouter()

@router.get("/", response_model=List[WishlistItemResponse])
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all wishlist items for the current user.
    """
    wishlists = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).all()
    return wishlists

@router.post("/", response_model=WishlistItemResponse)
def add_to_wishlist(
    *,
    db: Session = Depends(get_db),
    item_in: WishlistAddRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Add a product to the user's wishlist.
    """
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if already exists
    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id, 
        Wishlist.product_id == item_in.product_id
    ).first()
    
    if existing:
        return existing

    wishlist_item = Wishlist(
        user_id=current_user.id,
        product_id=item_in.product_id
    )
    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)
    return wishlist_item

@router.delete("/{product_id}", response_model=dict)
def remove_from_wishlist(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Remove a product from the user's wishlist.
    """
    wishlist_item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id, 
        Wishlist.product_id == product_id
    ).first()
    
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")

    db.delete(wishlist_item)
    db.commit()
    return {"status": "success", "message": "Item removed from wishlist"}
