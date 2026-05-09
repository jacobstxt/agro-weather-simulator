# AgroSim Backend

FastAPI backend for agricultural simulation with weather data and soil moisture modeling.

## Tech Stack

- **FastAPI** — web framework
- **SQLAlchemy** — ORM
- **Alembic** — database migrations
- **SQLite** — database (default)
- **JWT** — authentication via `python-jose`
- **bcrypt** — password hashing via `passlib`
- **Open-Meteo** — free weather data API (no key required)
- **Nominatim** — geocoding API (no key required)

---

## Getting Started

### 1. Clone the repository and navigate to the backend folder

```bash
cd AgroSim
```

### 2. Create and activate virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create `.env` file

Create a `.env` file in the root of `AgroSim/`:

```
DATABASE_URL=sqlite:///./weather.db
SECRET_KEY=your-secret-key-change-this
DEBUG=True
```

> **Important:** Use a strong random string for `SECRET_KEY`. Never commit `.env` to git.

### 5. Apply database migrations

```bash
alembic upgrade head
```

### 6. Run the server

```bash
# Development (auto-reload on file changes)
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

Server runs at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

---

## API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

All other endpoints require a JWT token in the `Authorization: Bearer <token>` header.

### Regions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/regions/` | List user's regions |
| POST | `/api/regions/` | Create a region |
| GET | `/api/regions/{id}` | Get region by ID |
| DELETE | `/api/regions/{id}` | Soft delete a region |
| GET | `/api/regions/search` | Search location via Nominatim |

### Weather & Simulation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weather/simulate` | Run soil moisture simulation |
| GET | `/api/weather/simulate/status/{task_id}` | Poll simulation status |
| GET | `/api/weather/simulate/{id}` | Get simulation result |
| GET | `/api/weather/simulate/count` | Count user's simulations |
| GET | `/api/weather/simulate/region/{id}` | List simulations for a region |
| POST | `/api/weather/fetch` | Fetch weather data from Open-Meteo |
| GET | `/api/weather/data/{region_id}` | Get stored weather data |
| POST | `/api/weather/interpolate` | Cubic spline interpolation |
| POST | `/api/weather/growing-degree-days` | Calculate GDD |
| POST | `/api/weather/alerts` | Generate soil drying alerts |

---

## Database Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing models.py
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1

# Check current migration version
alembic current
```

---

## Running Tests

```bash
pytest

# Single file
pytest tests/test_something.py -v
```

---

## Project Structure

```
AgroSim/
├── main.py                  # App entry point, middleware, routers
├── api/
│   └── routes/
│       ├── auth.py          # Register, login endpoints
│       ├── regions.py       # Region CRUD
│       └── weather.py       # Simulation, weather data endpoints
├── database/
│   ├── db.py                # SQLAlchemy engine and session
│   ├── models.py            # User, Region, WeatherData, SimulationResult
│   └── task_store.py        # In-memory simulation task store
├── services/
│   ├── auth.py              # JWT and password hashing logic
│   ├── open_meteo.py        # Open-Meteo API client
│   └── nominatim.py         # Geocoding client
├── math_engine/
│   ├── ode.py               # Runge-Kutta solver + soil ODE system
│   ├── interpolation.py     # Cubic spline and Lagrange interpolation
│   ├── integration.py       # Growing Degree Days calculation
│   ├── differentiation.py   # Central differences + alert generation
│   └── slar.py              # System of linear algebraic equations
├── alembic/                 # Migration files
├── logs/                    # Application logs
└── requirements.txt
```