from sqlalchemy import Column, Integer, String, Float, Date, DateTime, JSON, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class District(Base):
    __tablename__ = "districts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    population = Column(Integer, nullable=False)

class CaseData(Base):
    __tablename__ = "case_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_id = Column(String, ForeignKey("districts.id"), nullable=False)
    disease = Column(String, nullable=False)
    week_start = Column(Date, nullable=False)
    cases = Column(Integer, nullable=False)
    deaths = Column(Integer, default=0)
    source = Column(String, nullable=False)

class ClimateData(Base):
    __tablename__ = "climate_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_id = Column(String, ForeignKey("districts.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    temp_max_c = Column(Float, nullable=False)
    temp_min_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    source = Column(String, nullable=False)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_id = Column(String, ForeignKey("districts.id"), nullable=False)
    disease = Column(String, nullable=False)
    week_start = Column(Date, nullable=False)
    predicted_cases = Column(Float, nullable=False)
    ci_lower = Column(Float, nullable=False)
    ci_upper = Column(Float, nullable=False)
    risk_tier = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    generated_at = Column(DateTime, nullable=False)

class BacktestEvent(Base):
    __tablename__ = "backtest_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    district_id = Column(String, ForeignKey("districts.id"), nullable=False)
    disease = Column(String, nullable=False)
    event_name = Column(String, nullable=False)
    actual_peak_week = Column(Date, nullable=False)
    predicted_lead_weeks = Column(Float, nullable=False)
    metrics_json = Column(JSON, nullable=False)
