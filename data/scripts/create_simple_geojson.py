"""Create simplified GeoJSON for 9 target districts using buffered centroids."""
import json
import hashlib
from pathlib import Path
from math import cos, radians

RAW_GEOJSON_DIR = Path(__file__).resolve().parents[1] / "raw" / "geojson"
RAW_GEOJSON_DIR.mkdir(parents=True, exist_ok=True)

DISTRICTS = {
    "PUNE": {"state": "Maharashtra", "district": "Pune", "lat": 18.5204, "lon": 73.8567},
    "MUMBAI": {"state": "Maharashtra", "district": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    "NAGPUR": {"state": "Maharashtra", "district": "Nagpur", "lat": 21.1458, "lon": 79.0882},
    "KOLKATA": {"state": "West Bengal", "district": "Kolkata", "lat": 22.5726, "lon": 88.3639},
    "NORTH_24_PARGANAS": {"state": "West Bengal", "district": "North 24 Parganas", "lat": 22.8676, "lon": 88.6445},
    "HOWRAH": {"state": "West Bengal", "district": "Howrah", "lat": 22.5958, "lon": 88.2636},
    "BENGALURU_URBAN": {"state": "Karnataka", "district": "Bengaluru Urban", "lat": 12.9716, "lon": 77.5946},
    "MYSURU": {"state": "Karnataka", "district": "Mysuru", "lat": 12.2958, "lon": 76.6394},
    "DHARWAD": {"state": "Karnataka", "district": "Dharwad", "lat": 15.4589, "lon": 75.0078},
}

# Approximate district radius in degrees (~30-50km)
RADIUS_DEG = 0.5


def create_circle_polygon(lon: float, lat: float, radius_deg: float, n_points: int = 32):
    """Create a circular polygon around a point."""
    coords = []
    for i in range(n_points):
        angle = 2 * 3.14159 * i / n_points
        dx = radius_deg * cos(angle) / cos(radians(lat))
        dy = radius_deg * 3.14159 / 180 * radius_deg  # simplified
        # Better: use proper lat/lon offsets
        lat_offset = radius_deg * cos(angle)
        lon_offset = radius_deg * cos(angle) / cos(radians(lat))
        coords.append([lon + lon_offset, lat + lat_offset])
    coords.append(coords[0])  # close the ring
    return coords


def compute_checksum(filepath: Path) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def main():
    print("Creating simplified district GeoJSON (buffered centroids)...")
    
    features = []
    for district_id, info in DISTRICTS.items():
        lat = info["lat"]
        lon = info["lon"]
        
        # Create a simple square polygon around centroid
        # ~0.5 degree ≈ 55km at equator
        delta = 0.5
        coords = [
            [lon - delta, lat - delta],
            [lon + delta, lat - delta],
            [lon + delta, lat + delta],
            [lon - delta, lat + delta],
            [lon - delta, lat - delta],
        ]
        
        feature = {
            "type": "Feature",
            "properties": {
                "district_id": district_id,
                "state": info["state"],
                "district": info["district"],
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            }
        }
        features.append(feature)
        print(f"  Created: {district_id} ({info['district']}, {info['state']})")
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    output_file = RAW_GEOJSON_DIR / "districts.geojson"
    with open(output_file, "w") as f:
        json.dump(geojson, f, indent=2)
    
    checksum = compute_checksum(output_file)
    print(f"\nSaved to {output_file}")
    print(f"SHA256: {checksum}")
    print(f"Features: {len(features)}")
    print("\nNOTE: These are simplified square approximations.")
    print("Replace with actual district boundaries when available.")


if __name__ == "__main__":
    main()