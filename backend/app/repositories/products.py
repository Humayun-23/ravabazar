from typing import List, Tuple, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, asc

from app.models.products import Product, ProductStatus
from app.models.categories import Category
from app.models.inventory import Inventory
from app.models.product_images import ProductImage

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_public_products(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort_by: str = "newest",
        sort_order: str = "desc"
    ) -> Tuple[List[Product], int]:
        return self._get_products(
            page, page_size, search, category_slug, min_price, max_price, is_featured, sort_by, sort_order, False
        )
        
    def get_admin_products(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort_by: str = "newest",
        sort_order: str = "desc"
    ) -> Tuple[List[Product], int]:
        return self._get_products(
            page, page_size, search, category_slug, min_price, max_price, is_featured, sort_by, sort_order, True
        )
        
    def _get_products(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort_by: str = "newest",
        sort_order: str = "desc",
        is_admin: bool = False
    ) -> Tuple[List[Product], int]:
        
        query = self.db.query(Product)
        if not is_admin:
            query = query.filter(Product.status == ProductStatus.active)

        if category_slug:
            query = query.join(Product.category).filter(Category.slug == category_slug)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )

        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
            
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)

        # Ordering
        if sort_by == "price":
            order_col = Product.price
        elif sort_by == "name":
            order_col = Product.name
        else:
            order_col = Product.created_at # newest

        if sort_order == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        total = query.count()

        # Add relationships for efficient loading
        query = query.options(
            joinedload(Product.category),
            joinedload(Product.inventory),
            joinedload(Product.images)
        )

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total

    def get_product_by_slug(self, slug: str) -> Optional[Product]:
        return self.db.query(Product).filter(
            Product.slug == slug,
            Product.status == ProductStatus.active
        ).options(
            joinedload(Product.category),
            joinedload(Product.inventory),
            joinedload(Product.images)
        ).first()
        
    def get_product_by_slug_admin(self, slug: str) -> Optional[Product]:
        return self.db.query(Product).filter(
            Product.slug == slug
        ).options(
            joinedload(Product.category),
            joinedload(Product.inventory),
            joinedload(Product.images)
        ).first()

    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(
            Product.id == product_id,
            Product.status == ProductStatus.active
        ).options(
            joinedload(Product.inventory)
        ).first()

    def get_product_by_id_admin(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(
            Product.id == product_id
        ).options(
            joinedload(Product.category),
            joinedload(Product.inventory),
            joinedload(Product.images)
        ).first()
        
    def create_product(self, product_data: dict, inventory_data: dict, images_data: List[dict]) -> Product:
        new_product = Product(**product_data)
        self.db.add(new_product)
        self.db.flush() # flush to get ID
        
        new_inventory = Inventory(product_id=new_product.id, **inventory_data)
        self.db.add(new_inventory)
        
        for img in images_data:
            new_image = ProductImage(product_id=new_product.id, **img)
            self.db.add(new_image)
            
        self.db.commit()
        self.db.refresh(new_product)
        return new_product
        
    def update_product(self, product: Product, product_data: dict, inventory_data: Optional[dict] = None, images_data: Optional[List[dict]] = None) -> Product:
        for key, value in product_data.items():
            setattr(product, key, value)
            
        if inventory_data is not None:
            if product.inventory:
                for key, value in inventory_data.items():
                    setattr(product.inventory, key, value)
            else:
                new_inventory = Inventory(product_id=product.id, **inventory_data)
                self.db.add(new_inventory)
                
        if images_data is not None:
            # Delete old images
            self.db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
            # Add new images
            for img in images_data:
                new_image = ProductImage(product_id=product.id, **img)
                self.db.add(new_image)
                
        self.db.commit()
        self.db.refresh(product)
        return product
        
    def delete_product(self, product: Product):
        self.db.delete(product)
        self.db.commit()
