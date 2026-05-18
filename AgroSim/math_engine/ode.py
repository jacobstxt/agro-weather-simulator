import numpy as np
from scipy.interpolate import CubicSpline

SOIL_PARAMS = {
    "clay":       {"field_capacity": 280, "wilting_point": 150},
    "loam":       {"field_capacity": 240, "wilting_point": 130},
    "sandy":      {"field_capacity": 100, "wilting_point":  50},
    "sandy_loam": {"field_capacity": 150, "wilting_point":  80},
    "silt_loam":  {"field_capacity": 260, "wilting_point": 140},
}

_DRAINAGE_COEFF = {
    "clay":       0.05,
    "loam":       0.15,
    "sandy":      0.35,
    "sandy_loam": 0.22,
    "silt_loam":  0.12,
}

_THERMAL_LAG = {
    "clay":       0.20,
    "loam":       0.30,
    "sandy":      0.45,
    "sandy_loam": 0.35,
    "silt_loam":  0.25,
}


def runge_kutta_4(f, y0: list, t_start: float, t_end: float, dt: float = 0.1):
    if t_end <= t_start:
        raise ValueError(f"t_end ({t_end}) must be greater than t_start ({t_start})")
    dt = min(dt, t_end - t_start)
    t = np.arange(t_start, t_end, dt)
    y = np.zeros((len(t), len(y0)))
    y[0] = y0

    for i in range(1, len(t)):
        k1 = np.array(f(t[i-1], y[i-1]))
        k2 = np.array(f(t[i-1] + dt/2, y[i-1] + dt/2 * k1))
        k3 = np.array(f(t[i-1] + dt/2, y[i-1] + dt/2 * k2))
        k4 = np.array(f(t[i-1] + dt,   y[i-1] + dt * k3))
        y[i] = y[i-1] + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)

    return t.tolist(), y.tolist()


def build_daily_interpolators(daily_values: list, total_days: float):
    """Cubic spline through daily measurement points, clamped to [0, +inf]."""
    n = len(daily_values)
    if n == 0:
        return lambda t: 0.0
    if n == 1:
        v = max(0.0, daily_values[0])
        return lambda t: v
    day_indices = np.linspace(0, total_days, n)
    cs = CubicSpline(day_indices, daily_values, bc_type='natural')
    t_min, t_max = float(day_indices[0]), float(day_indices[-1])
    def safe_interp(t):
        t_c = float(np.clip(t, t_min, t_max))
        return max(0.0, float(cs(t_c)))
    return safe_interp


def soil_moisture_ode(t, y, rain_fn, et0_fn, temp_fn,
                      crop_coefficient: float = 1.0,
                      field_capacity: float = 240.0,
                      wilting_point: float = 130.0,
                      soil_type: str = "loam"):
    """
    ODE system driven by real daily weather via cubic spline interpolators.

    y[0] = M — soil moisture (mm)
    y[1] = T — soil temperature (°C)

    Stress factor follows FAO-56 Readily Available Water (RAW) model:
    no stress until depletion exceeds 50% of available water.
    Drainage coefficient depends on soil type.
    """
    M, T = y

    rain  = max(0.0, float(rain_fn(t)))
    et0   = max(0.0, float(et0_fn(t)))
    T_air = float(temp_fn(t))

    # FAO-56 stress factor — stress begins at RAW, not at wilting_point
    available = max(field_capacity - wilting_point, 1.0)
    RAW = available * 0.5
    depletion = field_capacity - M

    if M >= field_capacity:
        stress = 1.0
    elif M <= wilting_point:
        stress = 0.0
    elif depletion < RAW:
        stress = 1.0
    else:
        stress = max(0.0, 1.0 - (depletion - RAW) / (available - RAW))

    et_actual = et0 * crop_coefficient * stress

    # Drainage coefficient depends on soil type (fast for sand, slow for clay)
    drainage_coeff = _DRAINAGE_COEFF.get(soil_type, 0.15)
    drainage = max(0.0, M - field_capacity) * drainage_coeff

    dM_dt = rain - et_actual - drainage

    if M <= wilting_point and dM_dt < 0.0:
        dM_dt = 0.0

    # Thermal lag depends on soil type and moisture (wet soil = slower response)
    moisture_factor = 0.8 + 0.2 * max(0.0, min(1.0, M / max(field_capacity, 1.0)))
    lag = _THERMAL_LAG.get(soil_type, 0.30) * moisture_factor
    dT_dt = lag * (T_air - T)

    return [dM_dt, dT_dt]


def soil_moisture_temperature(t, y, rain: float = 5.0, solar: float = 200.0,
                               et0: float = None, crop_coefficient: float = 1.0):
    """Legacy function kept for backward compatibility."""
    M, T = y
    if et0 is not None:
        evaporation = et0 * crop_coefficient
    else:
        evaporation = 0.1 * M * (1 + 0.05 * T)
    runoff = max(0, M - 100) * 0.3
    dM_dt = rain - evaporation - runoff
    dT_dt = 0.01 * solar - 0.5 * (T - 10)
    return [dM_dt, dT_dt]


def get_et0_for_timestep(t: float, et0_values: list, total_days: float) -> float:
    """Cubic spline interpolation of ET0 (replaces old nearest-neighbor)."""
    if not et0_values:
        return None
    cs = build_daily_interpolators(et0_values, total_days)
    return max(0.0, float(cs(t)))
