from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.users import User
from app.repositories.users import UserRepository
from app.repositories.addresses import AddressRepository
from app.schemas.users import UserProfileUpdate, User as UserSchema, PasswordChangeRequest
from app.schemas.addresses import CustomerAddressCreate, AddressUpdate, Address as AddressSchema
from app.core.security import hash_password, verify_password


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.address_repo = AddressRepository(db)

    # --- Profile Methods ---
    def update_profile(self, user: User, update_data: UserProfileUpdate) -> UserSchema:
        update_dict = update_data.model_dump(exclude_unset=True)
        updated_user = self.user_repo.update(user, update_dict)
        self.db.commit()
        return UserSchema.model_validate(updated_user)

    def change_password(self, user: User, data: PasswordChangeRequest):
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        
        user.hashed_password = hash_password(data.new_password)
        self.db.commit()

    # --- Address Methods ---
    def get_addresses(self, user_id: int) -> List[AddressSchema]:
        addresses = self.address_repo.get_all_by_user(user_id)
        return [AddressSchema.model_validate(addr) for addr in addresses]

    def create_address(self, user_id: int, data: CustomerAddressCreate) -> AddressSchema:
        # If this is the first address, force it to be default
        count = self.address_repo.count_by_user(user_id)
        if count == 0:
            data.is_default = True

        # If they are explicitly setting this as default, clear the others
        if data.is_default:
            self.address_repo.clear_default_for_user(user_id)

        address = self.address_repo.create(user_id, data)
        self.db.commit()
        return AddressSchema.model_validate(address)

    def update_address(self, user_id: int, address_id: int, data: AddressUpdate) -> AddressSchema:
        address = self.address_repo.get_by_id_and_user(address_id, user_id)
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")

        if data.is_default:
            self.address_repo.clear_default_for_user(user_id)

        # If it's the only address and they try to unset default, don't allow it
        if address.is_default and data.is_default is False:
            count = self.address_repo.count_by_user(user_id)
            if count == 1:
                data.is_default = True # force it back to true

        updated_address = self.address_repo.update(address, data)
        self.db.commit()
        return AddressSchema.model_validate(updated_address)

    def delete_address(self, user_id: int, address_id: int):
        address = self.address_repo.get_by_id_and_user(address_id, user_id)
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")

        is_default = address.is_default
        self.address_repo.delete(address)

        # If we deleted the default, assign a new default if possible
        if is_default:
            remaining = self.address_repo.get_all_by_user(user_id)
            if remaining:
                remaining[0].is_default = True
                self.address_repo.update(remaining[0], AddressUpdate())
        
        self.db.commit()
