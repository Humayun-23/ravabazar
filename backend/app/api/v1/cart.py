from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user_optional, get_current_user
from app.schemas.carts import CartPublic, CartMergeRequest
from app.schemas.cart_items import CartItemAddRequest, CartItemUpdateRequest
from app.services.carts import CartService
from app.models.users import User

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "cart"}

def resolve_cart_identity(
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_cart_session: Optional[str] = Header(None)
):
    if current_user:
        return current_user.id, None

    if not current_user and not x_cart_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either Authorization or X-Cart-Session is required"
        )
    return None, x_cart_session

@router.get("/", response_model=CartPublic)
def get_cart(
    identity: tuple = Depends(resolve_cart_identity),
    db: Session = Depends(get_db)
):
    user_id, session_id = identity
    service = CartService(db)
    return service.get_cart_public(user_id=user_id, session_id=session_id)

@router.post("/items", response_model=CartPublic)
def add_item_to_cart(
    payload: CartItemAddRequest,
    identity: tuple = Depends(resolve_cart_identity),
    db: Session = Depends(get_db)
):
    user_id, session_id = identity
    service = CartService(db)
    return service.add_item(user_id, session_id, payload)

@router.patch("/items/{item_id}", response_model=CartPublic)
def update_cart_item(
    item_id: int,
    payload: CartItemUpdateRequest,
    identity: tuple = Depends(resolve_cart_identity),
    db: Session = Depends(get_db)
):
    user_id, session_id = identity
    service = CartService(db)
    return service.update_item(user_id, session_id, item_id, payload)

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    item_id: int,
    identity: tuple = Depends(resolve_cart_identity),
    db: Session = Depends(get_db)
):
    user_id, session_id = identity
    service = CartService(db)
    service.remove_item(user_id, session_id, item_id)
    return None

@router.post("/merge", response_model=CartPublic)
def merge_guest_cart(
    payload: CartMergeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CartService(db)
    return service.merge_carts(user_id=current_user.id, guest_session_id=payload.session_id)
