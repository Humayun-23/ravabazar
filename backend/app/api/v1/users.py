from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.users import User, UserProfileUpdate, PasswordChangeRequest
from app.schemas.addresses import Address, CustomerAddressCreate, AddressUpdate
from app.services.users import UserService
from app.models.users import User as UserModel

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "users"}

# --- Profile Endpoints ---
@router.get("/me", response_model=User)
def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=User)
def update_me(
    payload: UserProfileUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.update_profile(current_user, payload)

@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    service.change_password(current_user, payload)
    return None

# --- Address Endpoints ---
@router.get("/me/addresses", response_model=List[Address])
def get_my_addresses(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.get_addresses(current_user.id)

@router.post("/me/addresses", response_model=Address, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: CustomerAddressCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.create_address(current_user.id, payload)

@router.patch("/me/addresses/{address_id}", response_model=Address)
def update_address(
    address_id: int,
    payload: AddressUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.update_address(current_user.id, address_id, payload)

@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    service.delete_address(current_user.id, address_id)
    return None

