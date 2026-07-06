from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.models.addresses import Address
from app.schemas.addresses import CustomerAddressCreate, AddressUpdate


class AddressRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_by_user(self, user_id: int) -> List[Address]:
        return self.db.query(Address).filter(
            Address.user_id == user_id
        ).order_by(desc(Address.is_default), asc(Address.id)).all()

    def get_by_id_and_user(self, address_id: int, user_id: int) -> Optional[Address]:
        return self.db.query(Address).filter(
            Address.id == address_id,
            Address.user_id == user_id
        ).first()

    def count_by_user(self, user_id: int) -> int:
        return self.db.query(Address).filter(Address.user_id == user_id).count()

    def clear_default_for_user(self, user_id: int):
        self.db.query(Address).filter(
            Address.user_id == user_id,
            Address.is_default == True
        ).update({"is_default": False})

    def create(self, user_id: int, data: CustomerAddressCreate) -> Address:
        address = Address(**data.model_dump(), user_id=user_id)
        self.db.add(address)
        self.db.flush()
        self.db.refresh(address)
        return address

    def update(self, address: Address, data: AddressUpdate) -> Address:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(address, key, value)
        self.db.add(address)
        self.db.flush()
        self.db.refresh(address)
        return address

    def delete(self, address: Address):
        self.db.delete(address)
        self.db.flush()
