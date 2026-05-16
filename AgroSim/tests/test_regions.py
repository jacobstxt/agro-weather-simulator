import pytest


REGION_PAYLOAD = {
    "name": "Київська область",
    "latitude": 50.45,
    "longitude": 30.52,
    "soil_type": "loam",
    "area_ha": 150.0,
}


def test_create_region(client, auth_headers):
    resp = client.post("/api/regions/", json=REGION_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == REGION_PAYLOAD["name"]
    assert data["latitude"] == REGION_PAYLOAD["latitude"]
    assert data["soil_type"] == REGION_PAYLOAD["soil_type"]


def test_create_region_unauthorized(client):
    resp = client.post("/api/regions/", json=REGION_PAYLOAD)
    assert resp.status_code in (401, 403)


def test_create_region_invalid_latitude(client, auth_headers):
    payload = {**REGION_PAYLOAD, "latitude": 999.0}
    resp = client.post("/api/regions/", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_create_region_invalid_area(client, auth_headers):
    payload = {**REGION_PAYLOAD, "area_ha": -10.0}
    resp = client.post("/api/regions/", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_get_regions_empty(client, auth_headers):
    resp = client.get("/api/regions/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["regions"] == []


def test_get_regions_with_data(client, auth_headers, test_region):
    resp = client.get("/api/regions/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["regions"][0]["name"] == "Test Region"


def test_get_regions_pagination(client, auth_headers):
    for i in range(5):
        client.post("/api/regions/", json={**REGION_PAYLOAD, "name": f"Region {i}"}, headers=auth_headers)

    resp = client.get("/api/regions/?skip=0&limit=3", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["regions"]) == 3


def test_get_regions_name_filter(client, auth_headers):
    client.post("/api/regions/", json={**REGION_PAYLOAD, "name": "Львівська"}, headers=auth_headers)
    client.post("/api/regions/", json={**REGION_PAYLOAD, "name": "Одеська"}, headers=auth_headers)

    resp = client.get("/api/regions/?name=Львів", headers=auth_headers)
    assert resp.status_code == 200
    regions = resp.json()["regions"]
    assert len(regions) == 1
    assert "Львів" in regions[0]["name"]


def test_get_region_by_id(client, auth_headers, test_region):
    region_id = test_region["id"]
    resp = client.get(f"/api/regions/{region_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == region_id


def test_get_region_not_found(client, auth_headers):
    resp = client.get("/api/regions/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_region_other_user(client, auth_headers, test_region):
    region_id = test_region["id"]

    other = client.post("/api/auth/register", json={
        "email": "other@example.com",
        "password": "password123",
    })
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

    resp = client.get(f"/api/regions/{region_id}", headers=other_headers)
    assert resp.status_code == 404


def test_delete_region(client, auth_headers, test_region):
    region_id = test_region["id"]
    resp = client.delete(f"/api/regions/{region_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/regions/{region_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_region_not_found(client, auth_headers):
    resp = client.delete("/api/regions/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_regions_isolation_between_users(client):
    user1 = client.post("/api/auth/register", json={"email": "u1@example.com", "password": "password123"})
    user2 = client.post("/api/auth/register", json={"email": "u2@example.com", "password": "password123"})
    h1 = {"Authorization": f"Bearer {user1.json()['access_token']}"}
    h2 = {"Authorization": f"Bearer {user2.json()['access_token']}"}

    client.post("/api/regions/", json=REGION_PAYLOAD, headers=h1)

    resp = client.get("/api/regions/", headers=h2)
    assert resp.json()["total"] == 0


def test_create_region_invalid_soil_type(client, auth_headers):
    payload = {**REGION_PAYLOAD, "soil_type": "invalid_soil"}
    resp = client.post("/api/regions/", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_get_soil_types(client):
    resp = client.get("/api/regions/soil-types")
    assert resp.status_code == 200
    data = resp.json()
    assert "soil_types" in data
    assert len(data["soil_types"]) == 5
    keys = [st["key"] for st in data["soil_types"]]
    assert "clay" in keys
    assert "loam" in keys
    assert "sandy" in keys
    assert "sandy_loam" in keys
    assert "silt_loam" in keys


def test_update_region_invalid_soil_type(client, auth_headers, test_region):
    region_id = test_region["id"]
    payload = {"soil_type": "invalid_soil"}
    resp = client.patch(f"/api/regions/{region_id}", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_update_region_valid_soil_type(client, auth_headers, test_region):
    region_id = test_region["id"]
    payload = {"soil_type": "clay"}
    resp = client.patch(f"/api/regions/{region_id}", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["soil_type"] == "clay"
