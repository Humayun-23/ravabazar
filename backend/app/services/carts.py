from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.carts import CartRepository
from app.repositories.products import ProductRepository
from app.schemas.carts import CartPublic
from app.schemas.cart_items import CartItemPublic, CartItemAddRequest, CartItemUpdateRequest
from app.schemas.products import ProductPublic
from app.models.carts import Cart
from app.models.products import ProductStatus


class CartService:
    def __init__(self, db: Session):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    def get_or_create_cart(self, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Cart:
        cart = self.cart_repo.get_cart(user_id, session_id)
        if not cart:
            cart = self.cart_repo.create_cart(user_id, session_id)
        return cart

    def format_cart_response(self, cart: Cart) -> CartPublic:
        items = []
        subtotal = 0.0

        for item in cart.items:
            product = item.product
            price = product.sale_price if product.sale_price is not None else product.price
            line_total = price * item.quantity
            subtotal += line_total
            
            # Find primary image
            primary_image = None
            for img in product.images:
                if img.is_primary:
                    from app.schemas.product_images import ProductImageBasic
                    primary_image = ProductImageBasic.model_validate(img)
                    break
            if not primary_image and product.images:
                from app.schemas.product_images import ProductImageBasic
                primary_image = ProductImageBasic.model_validate(product.images[0])
            
            # Format category
            category = None
            if product.category:
                from app.schemas.categories import CategoryBasic
                category = CategoryBasic.model_validate(product.category)
            
            # Stock
            available_stock = product.inventory.available_stock if product.inventory else 0

            product_public = ProductPublic(
                id=product.id,
                name=product.name,
                slug=product.slug,
                sku=product.sku,
                description=product.description,
                price=product.price,
                sale_price=product.sale_price,
                status=product.status,
                is_featured=product.is_featured,
                category=category,
                primary_image=primary_image,
                available_stock=available_stock
            )

            item_pydantic = CartItemPublic(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product=product_public,
                line_total=line_total
            )
            items.append(item_pydantic)
        
        return CartPublic(
            id=cart.id,
            user_id=cart.user_id,
            session_id=cart.session_id,
            items=items,
            subtotal=subtotal
        )

    def get_cart_public(self, user_id: Optional[int] = None, session_id: Optional[str] = None) -> CartPublic:
        cart = self.get_or_create_cart(user_id, session_id)
        return self.format_cart_response(cart)

    def add_item(self, user_id: Optional[int], session_id: Optional[str], payload: CartItemAddRequest) -> CartPublic:
        product = self.product_repo.get_product_by_id(payload.product_id)
        if not product:
            raise HTTPException(status_code=400, detail="Product not found or inactive")

        if payload.quantity <= 0 or payload.quantity > 10:
            raise HTTPException(status_code=400, detail="Quantity must be between 1 and 10")

        cart = self.get_or_create_cart(user_id, session_id)
        
        # Check if item already exists to sum quantity
        existing_item = self.cart_repo.get_item(cart.id, product.id)
        new_quantity = payload.quantity
        if existing_item:
            new_quantity += existing_item.quantity
            if new_quantity > 10:
                new_quantity = 10

        available_stock = product.inventory.available_stock if product.inventory else 0
        if new_quantity > available_stock:
            raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

        self.cart_repo.add_or_update_item(cart.id, product.id, new_quantity)
        self.db.commit()
        
        # Re-fetch cart to get updated items
        updated_cart = self.cart_repo.get_cart(user_id, session_id)
        return self.format_cart_response(updated_cart)

    def update_item(self, user_id: Optional[int], session_id: Optional[str], item_id: int, payload: CartItemUpdateRequest) -> CartPublic:
        if payload.quantity <= 0 or payload.quantity > 10:
            raise HTTPException(status_code=400, detail="Quantity must be between 1 and 10")

        cart = self.cart_repo.get_cart(user_id, session_id)
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")

        item = self.cart_repo.get_item_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(status_code=404, detail="Item not found in cart")

        product = self.product_repo.get_product_by_id(item.product_id)
        if not product:
            raise HTTPException(status_code=400, detail="Product inactive")

        available_stock = product.inventory.available_stock if product.inventory else 0
        if payload.quantity > available_stock:
            raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

        self.cart_repo.add_or_update_item(cart.id, item.product_id, payload.quantity)
        self.db.commit()

        updated_cart = self.cart_repo.get_cart(user_id, session_id)
        return self.format_cart_response(updated_cart)

    def remove_item(self, user_id: Optional[int], session_id: Optional[str], item_id: int):
        cart = self.cart_repo.get_cart(user_id, session_id)
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")

        item = self.cart_repo.get_item_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(status_code=404, detail="Item not found in cart")

        self.cart_repo.remove_item(item)
        self.db.commit()

    def merge_carts(self, user_id: int, guest_session_id: str) -> CartPublic:
        guest_cart = self.cart_repo.get_cart(session_id=guest_session_id)
        if not guest_cart or not guest_cart.items:
            # Nothing to merge
            if guest_cart:
                self.cart_repo.delete_cart(guest_cart)
                self.db.commit()
            return self.get_cart_public(user_id=user_id)

        user_cart = self.get_or_create_cart(user_id=user_id)

        for guest_item in guest_cart.items:
            # We must re-check rules for each item
            product = guest_item.product
            if not product or product.status != ProductStatus.active:
                continue
            
            existing_item = self.cart_repo.get_item(user_cart.id, product.id)
            new_quantity = guest_item.quantity
            if existing_item:
                new_quantity += existing_item.quantity
                
            if new_quantity > 10:
                new_quantity = 10
                
            available_stock = product.inventory.available_stock if product.inventory else 0
            if new_quantity > available_stock:
                new_quantity = available_stock
                
            if new_quantity > 0:
                self.cart_repo.add_or_update_item(user_cart.id, product.id, new_quantity)

        self.cart_repo.delete_cart(guest_cart)
        self.db.commit()

        updated_cart = self.cart_repo.get_cart(user_id=user_id)
        return self.format_cart_response(updated_cart)

