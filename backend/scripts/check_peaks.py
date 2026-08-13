import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from sqlalchemy import create_engine, text

url = os.getenv("DATABASE_URL", "")
engine = create_engine(url, pool_pre_ping=True)
with engine.connect() as conn:
    for dist, dis in [("PUNE", "dengue"), ("MUMBAI", "malaria"), ("KOLKATA", "dengue"), ("NAGPUR", "malaria")]:
        rows = conn.execute(text(
            "SELECT week_start, cases FROM case_data WHERE district_id=:d AND disease=:dis ORDER BY week_start"
        ), {"d": dist, "dis": dis}).fetchall()
        max_row = max(rows, key=lambda r: r[1])
        print(f"{dist}/{dis}: n={len(rows)} full-series peak={max_row[0]} cases={max_row[1]}")
        print("   last 12 weeks:", [(r[0].isoformat(), r[1]) for r in rows[-12:]])
        print("   first 5:", [(r[0].isoformat(), r[1]) for r in rows[:5]])
