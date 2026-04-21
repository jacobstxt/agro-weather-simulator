import numpy as np

def central_differences(x: list, y: list) -> list:
    """
    Центральні різниці для чисельного диференціювання
    Повертає dy/dx у кожній точці
    """
    x = np.array(x)
    y = np.array(y)
    n = len(x)
    dy = np.zeros(n)

    # Центральні різниці для внутрішніх точок
    for i in range(1, n - 1):
        dy[i] = (y[i+1] - y[i-1]) / (x[i+1] - x[i-1])

    # Одностороні різниці для країв
    dy[0]    = (y[1] - y[0])       / (x[1] - x[0])
    dy[-1]   = (y[-1] - y[-2])     / (x[-1] - x[-2])

    return dy.tolist()


def runge_romberg_error(dy_h: list, dy_2h: list, p: int = 2) -> list:
    """
    Оцінка похибки методом Рунге-Ромберга
    dy_h  - похідна з кроком h
    dy_2h - похідна з кроком 2h
    p     - порядок методу
    """
    factor = 2**p - 1
    return [(a - b) / factor for a, b in zip(dy_h, dy_2h)]


def soil_drying_rate(times: list, moisture: list) -> list:
    """
    Швидкість висихання ґрунту (dM/dt)
    Від'ємне значення = ґрунт висихає
    Позитивне значення = ґрунт зволожується
    """
    return central_differences(times, moisture)


def generate_alerts(times: list, moisture: list,
                    threshold: float = -2.0) -> list:
    """
    Генерація алертів: якщо ґрунт висихає швидше threshold мм/день
    """
    rates = soil_drying_rate(times, moisture)
    alerts = []
    for i, rate in enumerate(rates):
        if rate < threshold:
            alerts.append({
                "day": times[i],
                "rate": round(rate, 3),
                "message": "Ґрунт висихає занадто швидко — потрібен полив!"
            })
    return alerts