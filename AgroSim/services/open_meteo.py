import httpx
from datetime import date, datetime

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL  = "https://archive-api.open-meteo.com/v1/archive"


async def fetch_weather_data(
    latitude: float,
    longitude: float,
    date_from: date,
    date_to: date
) -> list[dict]:
    # Archive API for historical data, forecast for upcoming dates
    url = ARCHIVE_URL if date_to < date.today() else FORECAST_URL

    params = {
        "latitude":   latitude,
        "longitude":  longitude,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "relative_humidity_2m_max",
            "windspeed_10m_max",
            "et0_fao_evapotranspiration",
            "shortwave_radiation_sum",
        ],
        "start_date": date_from.isoformat(),
        "end_date":   date_to.isoformat(),
        "timezone":   "Europe/Kiev",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    daily  = data["daily"]
    result = []

    for i, day in enumerate(daily["time"]):
        t_max = daily["temperature_2m_max"][i]
        t_min = daily["temperature_2m_min"][i]

        if t_max is not None and t_min is not None:
            t_mean = (t_max + t_min) / 2.0
        elif t_max is not None:
            t_mean = t_max - 5.0
        else:
            t_mean = None

        result.append({
            "date":                   datetime.strptime(day, "%Y-%m-%d"),
            "temperature":            t_mean,
            "precipitation":          daily["precipitation_sum"][i],
            "humidity":               daily["relative_humidity_2m_max"][i],
            "wind_speed":             daily["windspeed_10m_max"][i],
            "et0_evapotranspiration": daily["et0_fao_evapotranspiration"][i],
            "solar_radiation":        daily["shortwave_radiation_sum"][i],
        })

    return result
