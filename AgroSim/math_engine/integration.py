import numpy as np

def simpson_integration(x: list, y: list) -> float:
    """
    Формула Сімпсона для чисельного інтегрування
    Повертає площу під кривою (наприклад, сумарні опади за сезон)
    """
    x = np.array(x)
    y = np.array(y)
    n = len(x)

    if n % 2 == 0:
        # Якщо парна кількість — додаємо трапецію для останнього відрізку
        result = simpson_integration(x[:-1].tolist(), y[:-1].tolist())
        result += (x[-1] - x[-2]) * (y[-1] + y[-2]) / 2
        return result

    h = (x[-1] - x[0]) / (n - 1)
    result = y[0] + y[-1]
    for i in range(1, n - 1):
        result += (4 if i % 2 == 1 else 2) * y[i]
    return result * h / 3


def adaptive_integration(f, a: float, b: float, tol: float = 1e-6) -> float:
    """
    Адаптивний алгоритм інтегрування
    f   - функція для інтегрування
    a,b - межі інтегрування
    tol - точність
    """
    def _adaptive(a, b, tol, whole):
        mid = (a + b) / 2
        left  = simpson_integration([a, (a+mid)/2, mid],
                                    [f(a), f((a+mid)/2), f(mid)])
        right = simpson_integration([mid, (mid+b)/2, b],
                                    [f(mid), f((mid+b)/2), f(b)])
        if abs(left + right - whole) < 15 * tol:
            return left + right
        return (_adaptive(a, mid, tol/2, left) +
                _adaptive(mid, b, tol/2, right))

    whole = simpson_integration([a, (a+b)/2, b],
                                [f(a), f((a+b)/2), f(b)])
    return _adaptive(a, b, tol, whole)


def growing_degree_days(temps: list, base_temp: float = 10.0, max_temp: float = 30.0) -> float:
    """
    Накопичення тепла (Growing Degree Days, FAO-56).
    Температури вище max_temp обрізаються — перегрів не дає більше GDD.
    """
    days = list(range(len(temps)))
    effective = [max(0.0, min(t, max_temp) - base_temp) for t in temps]
    return simpson_integration(days, effective)