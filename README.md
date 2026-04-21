# Weather Simulator MVP

A web application for simulating soil moisture and temperature dynamics for agricultural fields. Built with FastAPI (backend) and React (frontend, in progress).

## Features

- Soil moisture and temperature simulation using Runge-Kutta 4th order ODE solver
- Cubic spline interpolation for filling gaps in weather data
- Numerical integration (Simpson's rule) for seasonal totals (Growing Degree Days, total precipitation)
- Numerical differentiation (central differences) for drying rate alerts
- Linear system solving (Gaussian elimination + least squares) for model calibration
- Background tasks for non-blocking simulation execution
- Async endpoints for improved concurrency
- Rate limiting (10 requests/minute per IP on simulation endpoint)
- Request logging with response time tracking
- Health check endpoint with database status
- Pagination for regions list
- Alembic database migrations
- REST API with Swagger UI
- SQLite database (PostgreSQL-ready via environment variable)

## Tech Stack

**Backend**
- Python 3.13
- FastAPI
- SQLAlchemy + SQLite
- Alembic (database migrations)
- Pydantic (input validation with Field constraints)
- SlowAPI (rate limiting)
- NumPy / SciPy (math engine)
- pytest (unit tests)

**Frontend** *(in progress)*
- React
- Recharts
- Axios

## Project Structure

```
Weather simolator (mvp)/
├── api/
│   └── routes/
│       ├── regions.py         # Region endpoints (async, paginated)
│       └── weather.py         # Simulation, interpolation, alerts (async)
├── alembic/                   # Database migration files
│   ├── versions/
│   ├── env.py
│   └── README
├── database/
│   ├── db.py                  # SQLAlchemy engine and session
│   ├── models.py              # Region, WeatherData, SimulationResult
│   └── task_store.py          # In-memory background task storage
├── math_engine/
│   ├── ode.py                 # Runge-Kutta 4th order
│   ├── interpolation.py       # Cubic splines, Lagrange
│   ├── integration.py         # Simpson's rule, adaptive integration
│   ├── differentiation.py     # Central differences, Runge-Romberg
│   └── slar.py                # Gaussian elimination, least squares
├── tests/
│   └── test_all.py            # 15 unit tests
├── frontend/                  # React app (in progress)
├── logger.py                  # Logging configuration
├── main.py                    # FastAPI app entry point
├── alembic.ini                # Alembic configuration
├── requirements.txt
├── .env                       # Environment variables (not committed)
└── run.bat                    # Windows server start script
```

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+ (for frontend)

### Installation

1. Clone the repository

```bash
git clone https://github.com/Stanislave19/Weather-simulator-MVP-.git
cd "Weather-simulator-MVP-"
```

2. Create and activate virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Create `.env` file in the project root

```
DATABASE_URL=sqlite:///./weather.db
SECRET_KEY=your-secret-key
DEBUG=True
```

5. Apply database migrations

```bash
python -m alembic upgrade head
```

6. Run the server

```bash
.venv\Scripts\python.exe -m uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`  
Swagger UI: `http://127.0.0.1:8000/docs`

## API Endpoints

### Regions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/regions/` | Create a new region |
| GET | `/api/regions/` | Get all regions (paginated, ?skip=0&limit=20) |
| GET | `/api/regions/{id}` | Get region by ID |

### Weather & Simulation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weather/simulate` | Start simulation in background (rate limited: 10/min) |
| GET | `/api/weather/simulate/status/{task_id}` | Get background task status |
| GET | `/api/weather/simulate/{id}` | Get saved simulation result |
| GET | `/api/weather/simulate/region/{id}` | Get all simulations for a region |
| POST | `/api/weather/interpolate` | Interpolate weather data (cubic spline) |
| POST | `/api/weather/growing-degree-days` | Calculate GDD (Simpson integration) |
| POST | `/api/weather/alerts` | Get soil drying alerts |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server and database status with version |

## Running Tests

```bash
.venv\Scripts\python.exe -m pytest tests/ -v
```

Expected output: **15 passed**

## Database Migrations

Create a new migration after changing models:

```bash
python -m alembic revision --autogenerate -m "description"
python -m alembic upgrade head
```

Rollback last migration:

```bash
python -m alembic downgrade -1
```

## Mathematical Modules

| Module | Method | Used for |
|--------|--------|----------|
| `ode.py` | Runge-Kutta 4 | Soil moisture and temperature dynamics |
| `interpolation.py` | Cubic splines | Filling gaps in discrete weather data |
| `integration.py` | Simpson's rule | GDD, total precipitation, evaporation |
| `differentiation.py` | Central differences | Drying rate, irrigation alerts |
| `slar.py` | Gaussian elimination | Model calibration (least squares) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./weather.db` |
| `SECRET_KEY` | Application secret key | — |
| `DEBUG` | Debug mode | `True` |

## Simulation Flow

```
POST /simulate → background task created → {"task_id": 1, "status": "running"}
GET /simulate/status/1 → {"status": "done", "result": {...}}
GET /simulate/{simulation_id} → full result from database
```

## Team

| Name | Role | GitHub |
|------|------|--------|
| Stanislave Savosh | Backend | [@Stanislave19](https://github.com/Stanislave19) |

