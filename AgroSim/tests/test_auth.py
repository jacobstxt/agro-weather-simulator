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


def test_get_me(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"
    assert "hashed_password" not in data


def test_update_profile(client, auth_headers):
    resp = client.patch("/api/auth/me", json={
        "first_name": "Updated",
        "last_name": "Name"
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"

    # Verify via GET /me
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.json()["first_name"] == "Updated"


def test_change_password_success(client, auth_headers):
    resp = client.post("/api/auth/change-password", json={
        "current_password": "password123",
        "new_password": "newpassword123"
    }, headers=auth_headers)
    assert resp.status_code == 200

    # Try login with new password
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "newpassword123"
    })
    assert resp.status_code == 200


def test_change_password_wrong_current(client, auth_headers):
    resp = client.post("/api/auth/change-password", json={
        "current_password": "wrongpassword",
        "new_password": "newpassword123"
    }, headers=auth_headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Невірний поточний пароль"


def test_change_password_too_short(client, auth_headers):
    resp = client.post("/api/auth/change-password", json={
        "current_password": "password123",
        "new_password": "short"
    }, headers=auth_headers)
    assert resp.status_code == 422
