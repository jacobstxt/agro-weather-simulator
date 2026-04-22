# agro-weather-simulator

Web application for simulating soil moisture and temperature dynamics for agricultural fields.

**Backend:** FastAPI + SQLite | **Frontend:** React + Vite *(in progress)*

## Features

- Soil moisture & temperature simulation (Runge-Kutta 4)
- Weather data interpolation (cubic spline / Lagrange)
- Seasonal totals via numerical integration (Simpson's rule)
- Soil drying alerts via numerical differentiation (central differences)
- Model calibration (Gaussian elimination + least squares)
- Background simulation tasks with in-memory status tracking
- Rate limiting, request logging, health check endpoint

## Project Structure

```
AgroSim/
├── api/
│   └── routes/
│       ├── regions.py
│       ├── weather.py
│       └── simulation.py
├── database/
│   ├── db.py
│   └── models.py
├── math_engine/
│   ├── ode.py
│   ├── interpolation.py
│   ├── integration.py
│   ├── differentiation.py
│   └── slar.py
├── tests/
├── logger.py
├── main.py
├── requirements.txt
└── .env
```

## Getting Started

```bash
git clone https://github.com/jacobstxt/agro-weather-simulator.git
cd agro-weather-simulator

python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`:

```
DATABASE_URL=sqlite:///./weather.db
```

Run:

```bash
python -m uvicorn main:app --reload
```

Swagger UI: `http://127.0.0.1:8000/docs`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/regions/` | Create region |
| GET | `/api/regions/` | List regions |
| GET | `/api/regions/{id}` | Get region |
| POST | `/api/weather/` | Add weather data |
| GET | `/api/weather/region/{id}` | Get weather data |
| POST | `/api/simulation/simulate` | Start simulation |
| GET | `/api/simulation/simulate/status/{task_id}` | Task status |
| GET | `/api/simulation/simulate/{id}` | Get result |
| POST | `/api/simulation/interpolate` | Interpolate data |
| POST | `/api/simulation/growing-degree-days` | Calculate GDD |
| POST | `/api/simulation/alerts` | Get drying alerts |
| GET | `/health` | Health check |

## Tech Stack

- Python 3.12, FastAPI, SQLAlchemy, SQLite
- Pydantic, SlowAPI, NumPy, SciPy
- React + Vite *(frontend, in progress)*

## Team

| Name | Role | GitHub |
|------|------|--------|
| Maksym Baran | Backend | [@jacobstxt](https://github.com/jacobstxt) |
| Stanislav Savosh | Backend | [@Stanislave19](https://github.com/Stanislave19) |
| Stanislav Kaluh | Backend | [@Kaluh-dev](https://github.com/Kaluh-dev) |
