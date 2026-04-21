import numpy as np

def gauss_elimination(A: list, b: list) -> list:
    """
    Метод Гауса для розв'язання системи лінійних рівнянь Ax = b
    """
    A = np.array(A, dtype=float)
    b = np.array(b, dtype=float)
    n = len(b)

    # Пряме виключення
    for i in range(n):
        # Пошук максимального елементу (часткова розстановка)
        max_row = np.argmax(abs(A[i:, i])) + i
        A[[i, max_row]] = A[[max_row, i]]
        b[[i, max_row]] = b[[max_row, i]]

        for j in range(i + 1, n):
            factor = A[j, i] / A[i, i]
            A[j, i:] -= factor * A[i, i:]
            b[j]     -= factor * b[i]

    # Зворотнє підстановлення
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (b[i] - np.dot(A[i, i+1:], x[i+1:])) / A[i, i]

    return x.tolist()


def least_squares(X: list, y: list) -> list:
    """
    Метод найменших квадратів для апроксимації даних
    Розв'язує: (X^T X) a = X^T y
    Повертає коефіцієнти апроксимації
    """
    X = np.array(X, dtype=float)
    y = np.array(y, dtype=float)
    XtX = X.T @ X
    Xty = X.T @ y
    return gauss_elimination(XtX.tolist(), Xty.tolist())


def calibrate_model(measured: list, simulated: list,
                    params_count: int = 3) -> list:
    """
    Калібрування моделі по реальних вимірах
    Підбирає параметри моделі методом найменших квадратів
    """
    n = len(measured)
    X = [[simulated[i]**j for j in range(params_count)] for i in range(n)]
    return least_squares(X, measured)