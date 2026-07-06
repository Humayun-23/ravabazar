import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.categories import Category
from app.models.products import Product
from app.models.product_images import ProductImage
from app.models.inventory import Inventory

def seed_db():
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Product).count() >= 5:
            print("Database already contains seed products. Skipping seed.")
            return

        # Clean existing data to avoid unique constraint errors during seed
        db.query(Inventory).delete()
        db.query(ProductImage).delete()
        db.query(Product).delete()
        db.query(Category).delete()
        db.commit()

        # 1. Create Categories
        electronics = Category(name="Electronics", slug="electronics", description="Gadgets and devices", is_active=True)
        clothing = Category(name="Clothing", slug="clothing", description="Apparel and fashion", is_active=True)
        groceries = Category(name="Groceries", slug="groceries", description="Daily essentials", is_active=True)

        db.add_all([electronics, clothing, groceries])
        db.commit()
        db.refresh(electronics)
        db.refresh(clothing)
        db.refresh(groceries)
        print("Created categories.")

        # 2. Create Products
        products_data = [
            {
                "name": "Wireless Noise Cancelling Headphones",
                "slug": "wireless-headphones",
                "sku": "ELEC-WH-001",
                "description": "Premium wireless headphones with industry-leading noise cancellation.",
                "price": 299.99,
                "sale_price": 249.99,
                "category_id": electronics.id,
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
                "stock": 50
            },
            {
                "name": "Smart Watch Pro",
                "slug": "smart-watch-pro",
                "sku": "ELEC-SW-002",
                "description": "Next-generation smartwatch with advanced health tracking capabilities.",
                "price": 399.00,
                "sale_price": None,
                "category_id": electronics.id,
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1000&auto=format&fit=crop",
                "stock": 30
            },
            {
                "name": "Men's Classic Cotton T-Shirt",
                "slug": "mens-cotton-tshirt",
                "sku": "CLOTH-TS-001",
                "description": "Comfortable 100% organic cotton t-shirt for everyday wear.",
                "price": 24.99,
                "sale_price": 19.99,
                "category_id": clothing.id,
                "is_featured": False,
                "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
                "stock": 100
            },
            {
                "name": "Premium Denim Jacket",
                "slug": "premium-denim-jacket",
                "sku": "CLOTH-DJ-002",
                "description": "Vintage wash denim jacket with a classic fit.",
                "price": 89.99,
                "sale_price": None,
                "category_id": clothing.id,
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1000&auto=format&fit=crop",
                "stock": 45
            },
            {
                "name": "Organic Arabica Coffee Beans",
                "slug": "organic-coffee-beans",
                "sku": "GROC-CB-001",
                "description": "Freshly roasted single-origin arabica coffee beans (1kg).",
                "price": 18.50,
                "sale_price": None,
                "category_id": groceries.id,
                "is_featured": False,
                "image": "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1000&auto=format&fit=crop",
                "stock": 200
            }
        ]

        for p_data in products_data:
            prod = Product(
                name=p_data["name"],
                slug=p_data["slug"],
                sku=p_data["sku"],
                description=p_data["description"],
                price=p_data["price"],
                sale_price=p_data["sale_price"],
                category_id=p_data["category_id"],
                is_featured=p_data["is_featured"],
                status="active"
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
            
            # Add image
            img = ProductImage(
                product_id=prod.id,
                image_url=p_data["image"],
                alt_text=prod.name,
                is_primary=True
            )
            db.add(img)

            # Add inventory
            inv = Inventory(
                product_id=prod.id,
                stock_quantity=p_data["stock"],
                reserved_quantity=0,
                low_stock_threshold=5
            )
            db.add(inv)

            db.commit()
            print(f"Created product: {prod.name}")

        print("Database seeding completed successfully!")

    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting database seed...")
    seed_db()
