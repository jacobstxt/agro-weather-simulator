import numpy as np
from scipy.interpolate import CubicSpline

def cubic_spline_interpolate(x: list, y: list, x_new: list) -> list:
    """
    Кубічна сплайн-інтерполяція
    x     - вузли (наприклад, дні: [0, 1, 2, 3...])
    y     - значення у вузлах (наприклад, температура)
    x_new - точки де хочемо отримати значення
    """
    cs = CubicSpline(x, y)
    return cs(x_new).tolist()


def lagrange_interpolate(x: list, y: list, x_new: list) -> list:
    """
    Поліном Лагранжа (для порівняння зі сплайном)
    Увага: нестабільний при великій кількості вузлів!
    """
    x = np.array(x)
    y = np.array(y)
    result = []

    for xp in x_new:
        total = 0.0
        for i in range(len(x)):
            term = y[i]
            for j in range(len(x)):
                if i != j:
                    term *= (xp - x[j]) / (x[i] - x[j])
            total += term
        result.append(total)

    return result


def fill_missing_weather_data(days: list, values: list, all_days: list) -> list:
    """
    Заповнення пропусків у метеоданих
    Наприклад: є дані за дні [0,2,5], треба заповнити [0,1,2,3,4,5]
    """
    return cubic_spline_interpolate(days, values, all_days)