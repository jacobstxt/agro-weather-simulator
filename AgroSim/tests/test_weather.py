import pytest
from datetime import datetime, date, timedelta


@pytest.fixture
def mock_weather_data():
    base_date = datetime(2024, 1, 1)
    data = []
    for i in range(31):
        data.append({
            "date":                   base_date + timedelta(days=i),
            "temperature":            5.0 + (i % 5),
            "precipitation":          2.5 if i % 7 == 0 else 0.0,
            "humidity":               80.0 - (i % 10),
            "wind_speed":             5.0 + (i % 3),
            "et0_evapotranspiration": 1.2 + (i * 0.01),
            "solar_radiation":        50.0 + i,
        })
    return data


# ── /fetch ───────────────────────────────────────────────────────────────────

def test_fetch_weather_success(client, auth_headers, test_region, mocker, mock_weather_data, db):
    mock_fetch = mocker.patch("api.routes.weather.fetch_weather_data", return_value=mock_weather_data)
    
    payload = {
        "region_id": test_region["id"],
        "date_from": "2024-01-01",
        "date_to":   "2024-01-31"
    }
    resp = client.post("/api/weather/fetch", json=payload, headers=auth_headers)
    
    assert resp.status_code == 200
    data = resp.json()
    assert data["records_count"] == 31
    assert "Successfully fetched" in data["message"]
    
    # Check DB
    from database.models import WeatherData
    count = db.query(WeatherData).filter(WeatherData.region_id == test_region["id"]).count()
    assert count == 31


def test_fetch_weather_api_error(client, auth_headers, test_region, mocker):
    mocker.patch("api.routes.weather.fetch_weather_data", side_effect=Exception("API Down"))
    
    payload = {
        "region_id": test_region["id"],
        "date_from": "2024-01-01",
        "date_to":   "2024-01-05"
    }
    resp = client.post("/api/weather/fetch", json=payload, headers=auth_headers)
    assert resp.status_code == 502
    assert "Failed to fetch weather data" in resp.json()["detail"]


def test_fetch_weather_invalid_range(client, auth_headers, test_region):
    # date_to <= date_from
    payload = {
        "region_id": test_region["id"],
        "date_from": "2024-01-10",
        "date_to":   "2024-01-01"
    }
    resp = client.post("/api/weather/fetch", json=payload, headers=auth_headers)
    assert resp.status_code == 422

    # range > 365 days
    payload = {
        "region_id": test_region["id"],
        "date_from": "2024-01-01",
        "date_to":   "2025-02-01"
    }
    resp = client.post("/api/weather/fetch", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_fetch_weather_other_user_region(client, registered_user, test_region, db):
    # Create another user
    resp = client.post("/api/auth/register", json={
        "email": "other@example.com",
        "password": "password123",
        "first_name": "Other",
        "last_name": "User",
    })
    other_token = resp.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}
    
    payload = {
        "region_id": test_region["id"], # region belongs to test@example.com
        "date_from": "2024-01-01",
        "date_to":   "2024-01-05"
    }
    resp = client.post("/api/weather/fetch", json=payload, headers=other_headers)
    assert resp.status_code == 404


def test_fetch_weather_overwrite(client, auth_headers, test_region, mocker, mock_weather_data, db):
    from database.models import WeatherData
    
    # Pre-fill some data
    db.add(WeatherData(
        region_id=test_region["id"],
        date=datetime(2024, 1, 1),
        temperature=10.0,
        precipitation=0.0,
        humidity=50.0,
        wind_speed=0.0,
        et0_evapotranspiration=0.0,
        solar_radiation=0.0
    ))
    db.commit()
    
    mocker.patch("api.routes.weather.fetch_weather_data", return_value=mock_weather_data[:5])
    
    payload = {
        "region_id": test_region["id"],
        "date_from": "2024-01-01",
        "date_to":   "2024-01-05"
    }
    resp = client.post("/api/weather/fetch", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    
    count = db.query(WeatherData).filter(WeatherData.region_id == test_region["id"]).count()
    assert count == 5
    
    # Verify that the record for 2024-01-01 was updated (new temp is 5.0 from fixture)
    rec = db.query(WeatherData).filter(WeatherData.region_id == test_region["id"], WeatherData.date == datetime(2024, 1, 1)).first()
    assert rec.temperature == 5.0


# ── /simulate ─────────────────────────────────────────────────────────────────

def test_simulate_success(client, auth_headers, test_region, mocker, mock_weather_data):
    # Mock both potential triggers of fetch_weather_data
    mocker.patch("api.routes.weather.fetch_weather_data", return_value=mock_weather_data)
    # We also need to mock the simulation processing since it's background and uses threads/processes
    # But the endpoint itself returns quickly
    
    payload = {
        "region_id": test_region["id"],
        "days": 10,
        "crop_type": "wheat"
    }
    resp = client.post("/api/weather/simulate", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data
    assert data["status"] == "running"


def test_simulate_non_existent_region(client, auth_headers):
    payload = {
        "region_id": 9999,
        "days": 10,
        "crop_type": "wheat"
    }
    resp = client.post("/api/weather/simulate", json=payload, headers=auth_headers)
    assert resp.status_code == 404


def test_simulate_other_user_region(client, test_region):
    # Register another user
    resp = client.post("/api/auth/register", json={
        "email": "sim_other@example.com",
        "password": "password123",
        "first_name": "Other",
        "last_name": "User",
    })
    other_token = resp.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}
    
    payload = {
        "region_id": test_region["id"],
        "days": 10,
        "crop_type": "wheat"
    }
    resp = client.post("/api/weather/simulate", json=payload, headers=other_headers)
    assert resp.status_code == 404


def test_simulate_invalid_crop(client, auth_headers, test_region):
    payload = {
        "region_id": test_region["id"],
        "days": 10,
        "crop_type": "invalid_crop"
    }
    resp = client.post("/api/weather/simulate", json=payload, headers=auth_headers)
    assert resp.status_code == 422


def test_simulate_invalid_days(client, auth_headers, test_region):
    # 0 days
    payload = {
        "region_id": test_region["id"],
        "days": 0,
        "crop_type": "wheat"
    }
    resp = client.post("/api/weather/simulate", json=payload, headers=auth_headers)
    assert resp.status_code == 422
    
    # > 365 days
    payload = {
        "region_id": test_region["id"],
        "days": 366,
        "crop_type": "wheat"
    }
    resp = client.post("/api/weather/simulate", json=payload, headers=auth_headers)
    assert resp.status_code == 422


# ── /crops ───────────────────────────────────────────────────────────────────

def test_get_crop_types(client):
    resp = client.get("/api/weather/crops")
    assert resp.status_code == 200
    data = resp.json()
    assert "crops" in data
    assert len(data["crops"]) > 0
    keys = [c["key"] for c in data["crops"]]
    assert "wheat" in keys
    assert "corn" in keys


# ── /interpolate ──────────────────────────────────────────────────────────────

def test_interpolate_success(client):
    resp = client.post("/api/weather/interpolate", json={
        "known_days":   [0.0, 5.0, 10.0],
        "known_values": [10.0, 20.0, 15.0],
        "all_days":     [0.0, 2.5, 5.0, 7.5, 10.0],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "interpolated" in data
    assert len(data["interpolated"]) == 5


def test_interpolate_too_few_points(client):
    resp = client.post("/api/weather/interpolate", json={
        "known_days":   [0.0],
        "known_values": [10.0],
        "all_days":     [0.0, 1.0],
    })
    assert resp.status_code == 422


def test_interpolate_too_many_points(client):
    resp = client.post("/api/weather/interpolate", json={
        "known_days":   list(range(3651)),
        "known_values": list(range(3651)),
        "all_days":     list(range(3651)),
    })
    assert resp.status_code == 422


def test_interpolate_boundary_values(client):
    resp = client.post("/api/weather/interpolate", json={
        "known_days":   [0.0, 1.0],
        "known_values": [0.0, 0.0],
        "all_days":     [0.0, 0.5, 1.0],
    })
    assert resp.status_code == 200
    result = resp.json()["interpolated"]
    assert all(abs(v) < 0.01 for v in result)


# ── /growing-degree-days ──────────────────────────────────────────────────────

def test_gdd_success(client):
    resp = client.post("/api/weather/growing-degree-days", json={
        "temperatures": [15.0, 18.0, 22.0, 20.0, 17.0],
        "base_temp": 10.0,
    })
    assert resp.status_code == 200
    assert "growing_degree_days" in resp.json()
    assert resp.json()["growing_degree_days"] > 0


def test_gdd_all_below_base(client):
    resp = client.post("/api/weather/growing-degree-days", json={
        "temperatures": [5.0, 6.0, 7.0],
        "base_temp": 10.0,
    })
    assert resp.status_code == 200
    assert resp.json()["growing_degree_days"] == 0.0


def test_gdd_too_few_temps(client):
    resp = client.post("/api/weather/growing-degree-days", json={
        "temperatures": [20.0],
        "base_temp": 10.0,
    })
    assert resp.status_code == 422


def test_gdd_base_temp_out_of_range(client):
    resp = client.post("/api/weather/growing-degree-days", json={
        "temperatures": [15.0, 20.0],
        "base_temp": 100.0,
    })
    assert resp.status_code == 422


# ── /alerts ───────────────────────────────────────────────────────────────────

def test_alerts_no_drought(client):
    resp = client.post("/api/weather/alerts", json={
        "times":     [0.0, 1.0, 2.0, 3.0],
        "moisture":  [200.0, 200.0, 200.0, 200.0],
        "threshold": -2.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 0
    assert data["alerts"] == []


def test_alerts_drought_detected(client):
    resp = client.post("/api/weather/alerts", json={
        "times":     [0.0, 1.0, 2.0, 3.0, 4.0],
        "moisture":  [200.0, 185.0, 160.0, 125.0, 80.0],
        "threshold": -2.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] > 0
    assert all("day" in a and "rate" in a for a in data["alerts"])


def test_alerts_positive_threshold_rejected(client):
    resp = client.post("/api/weather/alerts", json={
        "times":     [0.0, 1.0, 2.0],
        "moisture":  [200.0, 200.0, 200.0],
        "threshold": 1.0,
    })
    assert resp.status_code == 422


def test_alerts_too_many_points(client):
    resp = client.post("/api/weather/alerts", json={
        "times":     list(range(3651)),
        "moisture":  list(range(3651)),
        "threshold": -2.0,
    })
    assert resp.status_code == 422


# ── /simulate/status ──────────────────────────────────────────────────────────

def test_simulation_status_not_found(client, auth_headers):
    resp = client.get("/api/weather/simulate/status/99999", headers=auth_headers)
    assert resp.status_code == 404


# ── /simulate/{id} ────────────────────────────────────────────────────────────

def test_get_simulation_not_found(client, auth_headers):
    resp = client.get("/api/weather/simulate/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_simulation_unauthorized(client):
    resp = client.get("/api/weather/simulate/1")
    assert resp.status_code in (401, 403)


# ── /simulate/region/{id} ────────────────────────────────────────────────────

def test_get_region_simulations_not_found(client, auth_headers):
    resp = client.get("/api/weather/simulate/region/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_region_simulations_empty(client, auth_headers, test_region):
    region_id = test_region["id"]
    resp = client.get(f"/api/weather/simulate/region/{region_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["simulations"] == []


# ── /data/{region_id} ────────────────────────────────────────────────────────

def test_get_weather_data_empty(client, auth_headers, test_region):
    region_id = test_region["id"]
    resp = client.get(f"/api/weather/data/{region_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["records_count"] == 0
    assert data["region_id"] == region_id


def test_get_weather_data_not_found(client, auth_headers):
    resp = client.get("/api/weather/data/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_weather_data_unauthorized(client):
    resp = client.get("/api/weather/data/1")
    assert resp.status_code in (401, 403)


# ── /simulate/count ───────────────────────────────────────────────────────────

def test_simulation_count_empty(client, auth_headers):
    resp = client.get("/api/weather/simulate/count", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
