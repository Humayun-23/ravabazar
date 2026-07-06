from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.orders import Order
from app.models.users import User
from app.models.products import Product
from app.models.inventory import Inventory
from app.schemas.admin_dashboard import DashboardResponse, LowStockProduct

class AdminDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_metrics(self) -> DashboardResponse:
        # 1. Total Sales (from successful/paid orders)
        successful_statuses = ["paid", "processing", "packed", "shipped", "delivered"]
        total_sales_result = self.db.query(func.sum(Order.final_amount)).filter(
            Order.status.in_(successful_statuses)
        ).scalar()
        total_sales = float(total_sales_result) if total_sales_result else 0.0

        # 2. Total Orders (successful)
        total_orders = self.db.query(Order).filter(
            Order.status.in_(successful_statuses)
        ).count()

        # 3. Pending Orders (needing attention: cod_pending or processing)
        pending_orders = self.db.query(Order).filter(
            Order.status.in_(["cod_pending", "processing"])
        ).count()

        # 4. Total Customers
        total_customers = self.db.query(User).count()

        # 5. Low Stock Alerts (threshold < 5 available)
        low_stock_threshold = 5
        low_stock_query = (
            self.db.query(Product, Inventory)
            .join(Inventory, Product.id == Inventory.product_id)
            .filter((Inventory.stock_quantity - Inventory.reserved_quantity) < low_stock_threshold)
            .limit(20)
            .all()
        )

        low_stock_alerts = []
        for product, inventory in low_stock_query:
            low_stock_alerts.append(
                LowStockProduct(
                    id=product.id,
                    name=product.name,
                    sku=product.sku,
                    stock_quantity=inventory.stock_quantity,
                    reserved_quantity=inventory.reserved_quantity,
                    available_stock=inventory.stock_quantity - inventory.reserved_quantity
                )
            )

        return DashboardResponse(
            total_sales=total_sales,
            total_orders=total_orders,
            pending_orders=pending_orders,
            total_customers=total_customers,
            low_stock_alerts=low_stock_alerts
        )
