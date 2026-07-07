from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.carts import Cart
from app.models.cart_items import CartItem
from app.models.products import Product


class CartRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_cart(self, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Optional[Cart]:
        query = self.db.query(Cart)
        if user_id is not None:
            query = query.filter(Cart.user_id == user_id)
        elif session_id is not None:
            query = query.filter(Cart.session_id == session_id)
        else:
            return None

        return query.options(
            joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
            joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.inventory)
        ).populate_existing().first()

    def create_cart(self, user_id: Optional[int] = None, session_id: Optional[str] = None) -> Cart:
        cart = Cart(user_id=user_id, session_id=session_id)
        self.db.add(cart)
        self.db.flush()
        self.db.refresh(cart)
        return cart

    def get_item(self, cart_id: int, product_id: int) -> Optional[CartItem]:
        return self.db.query(CartItem).filter(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id
        ).first()

    def get_item_by_id(self, item_id: int) -> Optional[CartItem]:
        return self.db.query(CartItem).filter(CartItem.id == item_id).first()

    def add_or_update_item(self, cart_id: int, product_id: int, quantity: int) -> CartItem:
        item = self.get_item(cart_id, product_id)
        if item:
            item.quantity = quantity
        else:
            item = CartItem(cart_id=cart_id, product_id=product_id, quantity=quantity)
            self.db.add(item)
        
        self.db.flush()
        return item

    def remove_item(self, item: CartItem):
        self.db.delete(item)
        self.db.flush()

    def delete_cart(self, cart: Cart):
        self.db.delete(cart)
        self.db.flush()
