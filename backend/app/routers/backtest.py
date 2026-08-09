from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..db import engine
from ..models import BacktestEvent
from ..schemas import BacktestEventSchema

router = APIRouter(prefix="/backtest", tags=["Backtest"])

def get_db():
    with Session(engine) as session:
        yield session

@router.get("/{event_id}", response_model=BacktestEventSchema)
def get_backtest_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(BacktestEvent).filter(BacktestEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Backtest event '{event_id}' not found")
    return ev
