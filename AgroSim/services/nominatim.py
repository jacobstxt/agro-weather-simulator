import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

async def search_location(query: str, limit: int = 5, country_code: str = "ua") -> list[dict]:
    """
    Шукає локацію по назві через Nominatim API.
    country_code: "ua" для України, None для всього світу
    """
    params = {
        "q": query,
        "format": "json",
        "limit": limit,
        "accept-language": "uk",
    }

    if country_code:
        params["countrycodes"] = country_code

    headers = {
        "User-Agent": "AgroWeatherSimulator/1.0"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(NOMINATIM_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

    return [
        {
            "display_name": item["display_name"],
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
        }
        for item in data
    ]