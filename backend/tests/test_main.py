from fastapi.testclient import TestClient

from app.core.dependencies import get_db
from app.main import app

client = TestClient(app)


class WorkingDb:
    def execute(self, statement):
        return None


class FailingDb:
    def execute(self, statement):
        raise RuntimeError("database unavailable")


def override_db(db):
    def _override():
        yield db

    return _override


def test_liveness_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data


def test_api_health_check_with_database_ok():
    app.dependency_overrides[get_db] = override_db(WorkingDb())

    response = client.get("/api/v1/health")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert "environment" in data


def test_api_health_check_with_database_error():
    app.dependency_overrides[get_db] = override_db(FailingDb())

    response = client.get("/api/v1/health")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"].startswith("error:")
