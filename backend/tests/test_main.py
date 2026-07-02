from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    # We might not have a real DB in tests initially, so database could be 'ok' or 'error' depending on environment
    assert "database" in data
    assert "environment" in data
