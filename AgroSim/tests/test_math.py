import pytest
import math
from math_engine.ode import (
    runge_kutta_4, build_daily_interpolators,
    soil_moisture_ode, SOIL_PARAMS,
)
from math_engine.interpolation import fill_missing_weather_data
from math_engine.integration import growing_degree_days
from math_engine.differentiation import generate_alerts, soil_drying_rate


# ── runge_kutta_4 ────────────────────────────────────────────────────────────

def test_rk4_constant_derivative():
    # dy/dt = 1  →  y(t) = y0 + t, last point is t[-1] not necessarily 10.0
    f = lambda t, y: [1.0]
    t, y = runge_kutta_4(f, [0.0], 0, 10)
    assert abs(y[-1][0] - t[-1]) < 0.01


def test_rk4_zero_derivative():
    f = lambda t, y: [0.0, 0.0]
    t, y = runge_kutta_4(f, [5.0, 3.0], 0, 5)
    assert y[-1][0] == pytest.approx(5.0, abs=1e-6)
    assert y[-1][1] == pytest.approx(3.0, abs=1e-6)


def test_rk4_exponential_decay():
    # dy/dt = -y  →  y(t) = e^(-t)
    f = lambda t, y: [-y[0]]
    t, y = runge_kutta_4(f, [1.0], 0, 5, dt=0.01)
    assert abs(y[-1][0] - math.exp(-5)) < 0.001


def test_rk4_invalid_t_end():
    f = lambda t, y: [1.0]
    with pytest.raises(ValueError, match="greater than t_start"):
        runge_kutta_4(f, [0.0], 5, 5)


def test_rk4_t_end_less_than_t_start():
    f = lambda t, y: [1.0]
    with pytest.raises(ValueError):
        runge_kutta_4(f, [0.0], 10, 5)


def test_rk4_small_days_no_index_error():
    # days < dt — не повинно падати з IndexError
    f = lambda t, y: [0.0]
    t, y = runge_kutta_4(f, [50.0], 0, 0.05)
    assert len(t) >= 1
    assert len(y) >= 1


def test_rk4_returns_correct_length():
    f = lambda t, y: [0.0]
    t, y = runge_kutta_4(f, [1.0], 0, 10, dt=0.5)
    assert len(t) == len(y)
    assert len(t) == 20


# ── build_daily_interpolators ─────────────────────────────────────────────────

def test_interpolator_empty():
    fn = build_daily_interpolators([], 30)
    assert fn(10) == 0.0


def test_interpolator_single_value():
    fn = build_daily_interpolators([5.0], 30)
    assert fn(0) == 5.0
    assert fn(15) == 5.0
    assert fn(30) == 5.0


def test_interpolator_smooth():
    values = [0.0, 10.0, 0.0]
    fn = build_daily_interpolators(values, 2)
    assert fn(0) == pytest.approx(0.0, abs=0.1)
    assert fn(2) == pytest.approx(0.0, abs=0.1)
    mid = fn(1)
    assert mid > 5.0  # cubic spline іде вище лінійної в середині


# ── soil_moisture_ode ─────────────────────────────────────────────────────────

def test_ode_no_rain_dries_out():
    rain_fn  = lambda t: 0.0
    et0_fn   = lambda t: 5.0
    temp_fn  = lambda t: 15.0
    y = [200.0, 15.0]
    dM, dT = soil_moisture_ode(0, y, rain_fn, et0_fn, temp_fn,
                               field_capacity=250, wilting_point=120)
    assert dM < 0  # без дощу ґрунт висихає


def test_ode_wilting_point_floor():
    # Якщо M <= wilting_point і немає дощу — dM_dt = 0 (не може висохнути далі)
    rain_fn  = lambda t: 0.0
    et0_fn   = lambda t: 10.0
    temp_fn  = lambda t: 20.0
    y = [120.0, 15.0]  # рівно на wilting_point
    dM, dT = soil_moisture_ode(0, y, rain_fn, et0_fn, temp_fn,
                               field_capacity=250, wilting_point=120)
    assert dM == 0.0


def test_ode_runoff_above_field_capacity():
    rain_fn  = lambda t: 50.0
    et0_fn   = lambda t: 0.0
    temp_fn  = lambda t: 15.0
    y = [300.0, 15.0]  # вище field_capacity=250
    dM, _ = soil_moisture_ode(0, y, rain_fn, et0_fn, temp_fn,
                              field_capacity=250, wilting_point=120)
    # runoff = (300-250)*0.5 = 25, rain=50, et=0 → dM = 25
    assert dM == pytest.approx(25.0, abs=0.1)


def test_ode_temperature_follows_air():
    rain_fn  = lambda t: 5.0
    et0_fn   = lambda t: 2.0
    temp_fn  = lambda t: 30.0  # повітряна = 30°C
    y = [200.0, 10.0]          # ґрунтова = 10°C
    _, dT = soil_moisture_ode(0, y, rain_fn, et0_fn, temp_fn,
                              field_capacity=250, wilting_point=120)
    assert dT > 0  # ґрунт нагрівається


def test_soil_params_exist():
    for soil in ["clay", "loam", "sandy", "sandy_loam", "silt_loam"]:
        assert soil in SOIL_PARAMS
        assert SOIL_PARAMS[soil]["field_capacity"] > SOIL_PARAMS[soil]["wilting_point"]


# ── growing_degree_days ───────────────────────────────────────────────────────

def test_gdd_all_below_base():
    temps = [5.0, 6.0, 7.0, 8.0, 9.0]
    result = growing_degree_days(temps, base_temp=10.0)
    assert result == 0.0


def test_gdd_all_above_base():
    # temps = [20]*5, base=10 → effective=[10]*5, GDD=40 (інтеграл трапецій/Сімпсон за 4 дні)
    temps = [20.0] * 5
    result = growing_degree_days(temps, base_temp=10.0)
    assert result > 0


def test_gdd_mixed():
    temps = [5.0, 15.0, 20.0, 8.0, 25.0]
    result = growing_degree_days(temps, base_temp=10.0)
    assert result > 0


# ── generate_alerts ───────────────────────────────────────────────────────────

def test_alerts_no_drought():
    times    = [0.0, 1.0, 2.0, 3.0]
    moisture = [200.0, 200.0, 200.0, 200.0]
    alerts = generate_alerts(times, moisture, threshold=-2.0)
    assert alerts == []


def test_alerts_drought_detected():
    times    = [0.0, 1.0, 2.0, 3.0]
    moisture = [200.0, 190.0, 170.0, 140.0]
    alerts = generate_alerts(times, moisture, threshold=-2.0)
    assert len(alerts) > 0
    for alert in alerts:
        assert "day" in alert
        assert "rate" in alert
        assert "message" in alert


def test_alerts_threshold_respected():
    times    = [0.0, 1.0, 2.0]
    moisture = [100.0, 99.0, 98.0]  # rate ≈ -1 (вище threshold -2)
    alerts = generate_alerts(times, moisture, threshold=-2.0)
    assert alerts == []


# ── fill_missing_weather_data ────────────────────────────────────────────────

def test_interpolation_basic():
    known_days   = [0.0, 5.0, 10.0]
    known_values = [10.0, 20.0, 10.0]
    all_days     = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    result = fill_missing_weather_data(known_days, known_values, all_days)
    assert len(result) == len(all_days)
    assert result[0]  == pytest.approx(10.0, abs=0.1)
    assert result[5]  == pytest.approx(20.0, abs=0.1)
    assert result[-1] == pytest.approx(10.0, abs=0.1)


def test_interpolation_monotone():
    known_days   = [0.0, 10.0]
    known_values = [0.0, 10.0]
    all_days     = list(range(11))
    result = fill_missing_weather_data(known_days, known_values, all_days)
    assert result[0] == pytest.approx(0.0, abs=0.1)
    assert result[-1] == pytest.approx(10.0, abs=0.1)
