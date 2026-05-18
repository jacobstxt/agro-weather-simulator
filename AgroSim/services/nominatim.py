import httpx
from cachetools import TTLCache
import os

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_cache = TTLCache(maxsize=256, ttl=86400)  # 256 унікальних запитів, 24 год

async def search_location(query: str, limit: int = 5, country_code: str = "ua") -> list[dict]:
    """
    Шукає локацію по назві через Nominatim API.
    country_code: "ua" для України, None для всього світу
    """
    cache_key = f"{query}:{country_code}"
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "q": query,
        "format": "json",
        "limit": limit,
        "accept-language": "uk",
    }

    if country_code:
        params["countrycodes"] = country_code

    contact = os.getenv("NOMINATIM_CONTACT", "")
    headers = {
        "User-Agent": f"AgroWeatherSimulator/1.0 ({contact})"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(NOMINATIM_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

    result = [
        {
            "display_name": item["display_name"],
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
        }
        for item in data
    ]

    _cache[cache_key] = result
    return result