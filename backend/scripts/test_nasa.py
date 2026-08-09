"""Quick verification of NASA POWER API key."""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("NASA_API_KEY", "DEMO_KEY")
url = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
    "?parameters=T2M,PRECTOTCORR,RH2M"
    "&community=AG"
    "&longitude=73.86&latitude=18.52"
    "&start=20240101&end=20240107"
    "&format=JSON&header=true"
)

print(f"Using API key: {key[:8]}...")
r = requests.get(url, timeout=30)
print(f"HTTP Status: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    params = list(data.get("properties", {}).get("parameter", {}).keys())
    print(f"Parameters returned: {params}")
    # Show a sample value
    for p in params:
        vals = data["properties"]["parameter"][p]
        sample_key = list(vals.keys())[0]
        print(f"  {p} [{sample_key}] = {vals[sample_key]}")
    print("NASA POWER API: VERIFIED OK")
else:
    print(f"FAILED: {r.text[:200]}")
