import httpx
from datetime import date, datetime

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_weather_data(
    latitude: float,
    longitude: float,
    date_from: date,
    date_to: date
) -> list[dict]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": [
            "temperature_2m_max",
            "precipitation_sum",
            "relative_humidity_2m_max",
            "windspeed_10m_max",
            "et0_fao_evapotranspiration_sum",
            "shortwave_radiation_sum",
        ],
        "start_date": date_from.isoformat(),
        "end_date": date_to.isoformat(),
        "timezone": "Europe/Kiev",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(OPEN_METEO_URL, params=params)
        response.raise_for_status()
        data = response.json()

    daily = data["daily"]
    result = []

    for i, day in enumerate(daily["time"]):
        result.append({
            "date": datetime.strptime(day, "%Y-%m-%d"),
            "temperature": daily["temperature_2m_max"][i],
            "precipitation": daily["precipitation_sum"][i],
            "humidity": daily["relative_humidity_2m_max"][i],
            "wind_speed": daily["windspeed_10m_max"][i],
            "et0_evapotranspiration": daily["et0_fao_evapotranspiration_sum"][i],
            "solar_radiation": daily["shortwave_radiation_sum"][i],
        })

    return result