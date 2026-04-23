import numpy as np

def runge_kutta_4(f, y0: list, t_start: float, t_end: float, dt: float = 0.1):
    """
    Метод Рунге-Кутта 4-го порядку
    f      - функція f(t, y) -> dy/dt
    y0     - початкові умови
    """
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


def soil_moisture_temperature(t, y, rain: float = 5.0, solar: float = 200.0,
                               et0: float = None, crop_coefficient: float = 1.0):
    """
    Система ОДР для динаміки вологості та температури ґрунту.

    y[0] = M — вологість ґрунту (мм)
    y[1] = T — температура ґрунту (°C)

    Якщо et0 передано — використовуємо реальне випаровування.
    Якщо ні — використовуємо спрощену формулу.
    """
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
    """
    Повертає et0 для конкретного кроку часу через інтерполяцію.
    t           - поточний час (дні)
    et0_values  - список денних значень et0 з БД
    total_days  - загальна кількість днів симуляції
    """
    if not et0_values:
        return None

    n = len(et0_values)
    idx = int((t / total_days) * n)
    idx = min(idx, n - 1)
    return et0_values[idx]