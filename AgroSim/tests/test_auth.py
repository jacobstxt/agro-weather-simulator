import pytest


def test_register_success(client):
    resp = client.post("/api/auth/register", json={
        "email": "user@example.com",
        "password": "strongpass123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "strongpass123"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400
    assert "вже використовується" in resp.json()["detail"]


def test_register_weak_password(client):
    resp = client.post("/api/auth/register", json={
        "email": "weak@example.com",
        "password": "short",
    })
    assert resp.status_code == 422


def test_register_invalid_email(client):
    resp = client.post("/api/auth/register", json={
        "email": "not-an-email",
        "password": "strongpass123",
    })
    assert resp.status_code == 422


def test_login_success(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_login_wrong_email(client):
    resp = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password123",
    })
    assert resp.status_code == 401


def test_protected_endpoint_no_token(client):
    resp = client.get("/api/regions/")
    # HTTPBearer returns 403 when no Authorization header is present
    assert resp.status_code in (401, 403)


def test_protected_endpoint_invalid_token(client):
    resp = client.get("/api/regions/", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401
