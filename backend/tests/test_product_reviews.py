import pytest
from app.models.product_reviews import ProductReview

def test_add_product_review(client, customer_token_headers, db_session, test_product, test_user, test_order):
    # Setup test order for this user and product to pass verified purchase
    from app.models.order_items import OrderItem
    
    order_item = OrderItem(
        order_id=test_order.id,
        product_id=test_product.id,
        product_name_snapshot="Test Product",
        price_snapshot=100.0,
        quantity=1
    )
    db_session.add(order_item)
    db_session.commit()
    
    # Customer adds a review
    data = {
        "rating": 5,
        "comment": "Excellent product!"
    }
    r = client.post(f"/api/v1/products/{test_product.id}/reviews", headers=customer_token_headers, json=data)
    assert r.status_code == 201
    assert r.json()["rating"] == 5
    assert r.json()["comment"] == "Excellent product!"
    
    # Try adding another review (should fail)
    r = client.post(f"/api/v1/products/{test_product.id}/reviews", headers=customer_token_headers, json=data)
    assert r.status_code == 409

    # Fetch public reviews
    r = client.get(f"/api/v1/products/{test_product.id}/reviews")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1
    assert r.json()["items"][0]["rating"] == 5

def test_admin_delete_review(client, superadmin_token_headers, db_session, test_product, test_user):
    # Setup a review
    review = ProductReview(
        product_id=test_product.id,
        user_id=test_user.id,
        rating=4,
        comment="Good"
    )
    db_session.add(review)
    db_session.commit()
    
    review_id = review.id
    
    # Admin deletes review
    r = client.delete(f"/api/v1/admin/reviews/{review_id}", headers=superadmin_token_headers)
    assert r.status_code == 204
    
    # Fetch public reviews, should be empty
    r = client.get(f"/api/v1/products/{test_product.id}/reviews")
    assert r.status_code == 200
    assert len(r.json()["items"]) == 0
