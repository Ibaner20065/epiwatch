"""Download India district boundary GeoJSON and filter to target 9 districts."""
import json
import hashlib
from pathlib import Path
import requests

GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/main/districts.geojson"

TARGET_DISTRICTS = {
    "PUNE": {"state": "Maharashtra", "district": "Pune"},
    "MUMBAI": {"state": "Maharashtra", "district": "Mumbai"},
    "NAGPUR": {"state": "Maharashtra", "district": "Nagpur"},
    "KOLKATA": {"state": "West Bengal", "district": "Kolkata"},
    "NORTH_24_PARGANAS": {"state": "West Bengal", "district": "North 24 Parganas"},
    "HOWRAH": {"state": "West Bengal", "district": "Howrah"},
    "BENGALURU_URBAN": {"state": "Karnataka", "district": "Bengaluru Urban"},
    "MYSURU": {"state": "Karnataka", "district": "Mysuru"},
    "DHARWAD": {"state": "Karnataka", "district": "Dharwad"},
}

RAW_GEOJSON_DIR = Path(__file__).resolve().parents[1] / "raw" / "geojson"
RAW_GEOJSON_DIR.mkdir(parents=True, exist_ok=True)


def normalize_name(name: str) -> str:
    """Normalize district name for matching."""
    return name.lower().replace(" ", "_").replace("-", "_").replace(".", "")


def compute_checksum(filepath: Path) -> str:
    """Compute SHA256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def main():
    print("Downloading India district boundaries...")
    
    response = requests.get(GEOJSON_URL, timeout=60)
    response.raise_for_status()
    data = response.json()
    
    print(f"Total features in source: {len(data.get('features', []))}")
    
    target_features = []
    matched = set()
    
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        
        state_name = props.get("st_nm") or props.get("STATE") or props.get("state")
        district_name = props.get("dt_nm") or props.get("DISTRICT") or props.get("district")
        
        if not state_name or not district_name:
            continue
        
        for target_id, target_info in TARGET_DISTRICTS.items():
            if (normalize_name(state_name) == normalize_name(target_info["state"]) and
                normalize_name(district_name) == normalize_name(target_info["district"])):
                
                feature["properties"]["district_id"] = target_id
                feature["properties"]["state"] = target_info["state"]
                feature["properties"]["district"] = target_info["district"]
                target_features.append(feature)
                matched.add(target_id)
                print(f"  Matched: {target_id} ({district_name}, {state_name})")
                break
    
    print(f"\nMatched {len(matched)} of {len(TARGET_DISTRICTS)} target districts")
    
    missing = set(TARGET_DISTRICTS.keys()) - matched
    if missing:
        print(f"WARNING: Missing districts: {missing}")
        print("Available districts in source:")
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            state_name = props.get("st_nm") or props.get("STATE") or props.get("state")
            district_name = props.get("dt_nm") or props.get("DISTRICT") or props.get("district")
            if state_name and district_name:
                print(f"  {state_name} - {district_name}")
    
    filtered_geojson = {
        "type": "FeatureCollection",
        "features": target_features
    }
    
    output_file = RAW_GEOJSON_DIR / "districts.geojson"
    with open(output_file, "w") as f:
        json.dump(filtered_geojson, f)
    
    checksum = compute_checksum(output_file)
    print(f"\nSaved filtered GeoJSON to {output_file}")
    print(f"SHA256: {checksum}")
    print(f"Features: {len(target_features)}")


if __name__ == "__main__":
    main()