import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import traceback
from app import models
from app.db import engine
from sqlalchemy.orm import Session

try:
    models.Base.metadata.create_all(bind=engine)
    print("create_all OK")
except Exception:
    traceback.print_exc()

from app.routers.backtest import run_live_backtest
with Session(engine) as db:
    try:
        ev = run_live_backtest("PUNE", "dengue", db)
        print("RESULT:", ev)
    except Exception:
        traceback.print_exc()
