"""Generate EpiWatch presentation PDF with charts."""
import json
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

# ---------------------------------------------------------------------------
# Theme
# ---------------------------------------------------------------------------
DARK_BG = HexColor("#1A1F3A")
PANEL_BG = HexColor("#252A4A")
ACCENT_BLUE = HexColor("#00D4AA")
ACCENT_ORANGE = HexColor("#FF6B6B")
LIGHT_GRAY = HexColor("#CCCCCC")
MID_GRAY = HexColor("#888888")
TEAL = HexColor("#009688")
WHITE = HexColor("#FFFFFF")

ROOT = os.getcwd()
TMP = os.path.join(ROOT, ".ppt_tmp")
os.makedirs(TMP, exist_ok=True)

PAGE_W, PAGE_H = landscape(A4)  # 842 x 595 pts


def mpl(c):
    return (c.red, c.green, c.blue)


# ---------------------------------------------------------------------------
# Chart helpers
# ---------------------------------------------------------------------------
def style_ax(ax, title=None):
    ax.set_facecolor(mpl(PANEL_BG))
    for spine in ax.spines.values():
        spine.set_color(mpl(HexColor("#3A4065")))
    ax.tick_params(colors=mpl(HexColor("#CCCCCC")))
    if title:
        ax.set_title(title, color=mpl(white), fontsize=12, fontweight="bold")


def chart_mae():
    districts = ["Bengaluru\nUrban", "Dharwad", "Howrah", "Kolkata", "Mumbai",
                 "Mysuru", "Nagpur", "N 24\nParganas", "Pune"]
    dengue = [4.39, 0.85, 2.10, 2.07, 3.94, 1.32, 1.76, 3.36, 3.96]
    malaria = [2.81, 0.57, 1.07, 1.81, 2.70, 0.81, 1.24, 1.91, 2.17]
    add = [5.52, 1.13, 2.72, 3.11, 5.66, 1.72, 2.44, 4.17, 4.12]

    fig, ax = plt.subplots(figsize=(10.5, 4.2), dpi=150)
    fig.patch.set_facecolor(mpl(PANEL_BG))
    x = np.arange(len(districts))
    w = 0.26
    ax.bar(x - w, dengue, w, label="Dengue", color=mpl(ACCENT_BLUE))
    ax.bar(x, malaria, w, label="Malaria", color=mpl(ACCENT_ORANGE))
    ax.bar(x + w, add, w, label="ADD", color=mpl(TEAL))
    ax.set_xticks(x)
    ax.set_xticklabels(districts, fontsize=8, color=mpl(HexColor("#CCCCCC")))
    ax.set_ylabel("MAE (cases/week)", color=mpl(white), fontsize=10)
    ax.legend(facecolor=mpl(PANEL_BG), edgecolor=mpl(HexColor("#3A4065")), labelcolor=mpl(white), fontsize=9)
    style_ax(ax, "Model Performance: Mean Absolute Error by District & Disease")
    fig.tight_layout()
    path = os.path.join(TMP, "mae.png")
    fig.savefig(path, transparent=True)
    plt.close(fig)
    return path


def chart_backtest():
    weeks = ["W1\n11-04", "W2\n11-11", "W3\n11-18", "W4\n11-25",
             "W5\n12-02", "W6\n12-09", "W7\n12-16", "W8\n12-23"]
    actual = [89, 72, 64, 63, 67, 56, 42, 46]
    predicted = [67.5, 82.5, 76.4, 73.6, 69.6, 68.0, 67.1, 55.2]

    fig, ax = plt.subplots(figsize=(10.5, 4.2), dpi=150)
    fig.patch.set_facecolor(mpl(PANEL_BG))
    ax.plot(weeks, actual, marker="o", label="Actual cases", color=mpl(ACCENT_BLUE), linewidth=2.5)
    ax.plot(weeks, predicted, marker="s", ls="--", label="Predicted cases", color=mpl(ACCENT_ORANGE), linewidth=2.5)
    for i, a in enumerate(actual):
        ax.annotate(str(a), (i, a), textcoords="offset points", xytext=(0, 8),
                    color=mpl(HexColor("#CCCCCC")), fontsize=8, ha="center")
    ax.set_ylabel("Weekly cases", color=mpl(white), fontsize=10)
    ax.set_ylim(30, 100)
    ax.legend(facecolor=mpl(PANEL_BG), edgecolor=mpl(HexColor("#3A4065")), labelcolor=mpl(white), fontsize=9)
    style_ax(ax, "8-Week Holdout Backtest - Pune Dengue (MAE 12.99, RMSE 14.60)")
    fig.tight_layout()
    path = os.path.join(TMP, "backtest.png")
    fig.savefig(path, transparent=True)
    plt.close(fig)
    return path


def chart_shap():
    models = [
        "Bengaluru Urban - Dengue",
        "Dharwad - Malaria",
        "Mumbai - ADD",
        "N 24 Parganas - Dengue",
    ]
    features = [
        ("rainfall_mm", 0.141), ("temp_max_c", 0.136), ("humidity_pct", 0.225),
        ("rainfall_lag2", 0.190), ("humidity_pct", 0.224), ("temp_max_c", 0.112),
        ("temp_max_c", 0.306), ("rainfall_lag2", 0.266), ("humidity_lag1", 0.132),
        ("temp_max_lag1", 0.388), ("rainfall_mm", 0.114), ("humidity_pct", 0.106),
    ]

    fig, axes = plt.subplots(1, 4, figsize=(11, 4.0), dpi=150)
    fig.patch.set_facecolor(mpl(PANEL_BG))
    colors = [mpl(ACCENT_BLUE), mpl(ACCENT_ORANGE), mpl(TEAL)]
    for idx, ax in enumerate(axes):
        base = idx * 3
        names = [features[base + j][0] for j in range(3)]
        vals = [features[base + j][1] for j in range(3)]
        ax.barh(names[::-1], vals[::-1], color=colors[::-1], height=0.55)
        ax.set_title(models[idx], color=mpl(white), fontsize=8.5, fontweight="bold")
        ax.tick_params(axis="y", labelsize=8, colors=mpl(HexColor("#CCCCCC")))
        ax.tick_params(axis="x", labelsize=7, colors=mpl(HexColor("#CCCCCC")))
        ax.set_xlim(0, 0.45)
        for spine in ax.spines.values():
            spine.set_color(mpl(HexColor("#3A4065")))
        ax.set_facecolor(mpl(PANEL_BG))
        ax.grid(axis="x", color=mpl(HexColor("#3A4065")), alpha=0.6)
    fig.suptitle("SHAP Feature Importance - Top 3 Climate Drivers per District-Disease",
                 color=mpl(white), fontsize=12, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.93])
    path = os.path.join(TMP, "shap.png")
    fig.savefig(path, transparent=True)
    plt.close(fig)
    return path


def chart_pipeline():
    fig, ax = plt.subplots(figsize=(11, 2.6), dpi=150)
    fig.patch.set_facecolor(mpl(PANEL_BG))
    ax.set_facecolor(mpl(PANEL_BG))
    stages = ["IDSP\nSurveillance", "NASA POWER\nClimate", "Census 2011\nDemographics",
              "ETL JOIN\n11,232 rows", "HGB\nBaseline", "XGB\nCorrection",
              "ENSEMBLE\nForecast", "Risk Maps\n+ AI Chat"]
    colors = [mpl(ACCENT_BLUE), mpl(ACCENT_BLUE), mpl(ACCENT_BLUE), mpl(TEAL),
              mpl(ACCENT_ORANGE), mpl(ACCENT_ORANGE), mpl(WHITE), mpl(TEAL)]
    for i, (stage, c) in enumerate(zip(stages, colors)):
        x = i * 0.125
        w = 0.115
        ax.bar([x], [1], w, color=c, edgecolor=mpl(HexColor("#3A4065")))
        ax.text(x, 1.55, stage, ha="center", va="bottom", fontsize=7.5, color=mpl(HexColor("#CCCCCC")))
        if i < len(stages) - 1:
            ax.annotate("", xy=(x + w + 0.01, 1), xytext=(x + w, 1),
                        arrowprops=dict(arrowstyle="-|>", color=mpl(white), lw=1.2))
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(0, 2.6)
    ax.axis("off")
    ax.set_title("End-to-End Prediction Pipeline", color=mpl(white), fontsize=12, fontweight="bold")
    fig.tight_layout()
    path = os.path.join(TMP, "pipeline.png")
    fig.savefig(path, transparent=True)
    plt.close(fig)
    return path


# ---------------------------------------------------------------------------
# PDF building
# ---------------------------------------------------------------------------
def new_page(c):
    c.showPage()


def draw_header(c, title):
    c.setFillColor(ACCENT_BLUE)
    c.rect(0, PAGE_H - 6, PAGE_W, 6, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, PAGE_H - 60, title)
    c.setStrokeColor(ACCENT_BLUE)
    c.setLineWidth(2)
    c.line(50, PAGE_H - 70, PAGE_W - 50, PAGE_H - 70)


def draw_footer(c, page_num):
    c.setFillColor(MID_GRAY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 25, f"EpiWatch - AI Disease Surveillance  |  {page_num}")
    c.setFillColor(ACCENT_BLUE)
    c.rect(0, 0, PAGE_W, 4, stroke=0, fill=1)


def bullets(c, x, y, items, font=11, gap=16, color=LIGHT_GRAY):
    c.setFillColor(color)
    c.setFont("Helvetica", font)
    yy = y
    for it in items:
        c.drawString(x, yy, it)
        yy -= gap
    return yy


def panel(c, x, y, w, h, fill=PANEL_BG, outline=ACCENT_BLUE):
    c.setFillColor(fill)
    c.setStrokeColor(outline)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, 6, stroke=1, fill=1)


def text_in(c, x, y, text, font="Helvetica", size=11, color=LIGHT_GRAY, **kw):
    if isinstance(font, int):
        size = font
        font = "Helvetica"
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, y, text)


PAGE_NUM = 0


def page(c):
    global PAGE_NUM
    PAGE_NUM += 1
    draw_footer(c, PAGE_NUM)
    c.showPage()


def build():
    c = canvas.Canvas(os.path.join(ROOT, "EpiWatch_Presentation.pdf"), pagesize=(PAGE_W, PAGE_H))
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # ------------------------------------------------------------------ Slide 1: Title
    c.setFillColor(ACCENT_BLUE)
    c.rect(0, PAGE_H - 10, PAGE_W, 10, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 54)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 210, "EpiWatch")
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 250,
                        "AI-Powered Multi-Disease Outbreak Prediction System for India")
    c.setStrokeColor(ACCENT_ORANGE)
    c.setLineWidth(3)
    c.line(PAGE_W / 2 - 120, PAGE_H - 280, PAGE_W / 2 + 120, PAGE_H - 280)
    c.setFillColor(LIGHT_GRAY)
    c.setFont("Helvetica", 15)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 320,
                        "Real-time Outbreak Forecasting  |  9 Districts  |  3 Diseases  |  54 Models")
    c.setFillColor(MID_GRAY)
    c.setFont("Helvetica", 11)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 345,
                        "HistGradientBoosting + XGBoost Ensemble  |  IDSP  |  NASA POWER  |  Census 2011")
    page(c)

    # ------------------------------------------------------------------ Slide 2: The Problem
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "The Problem")
    panel(c, 50, PAGE_H - 300, PAGE_W - 100, 150)
    text_in(c, 75, PAGE_H - 260,
            "India's disease surveillance system (IDSP) produces weekly reports, but by the time", 13)
    text_in(c, 75, PAGE_H - 280,
            "outbreaks are detected through traditional reporting, they have already spread.", 13)
    text_in(c, 75, PAGE_H - 300,
            "There is no public, district-level early warning system that links climate triggers", 13)
    text_in(c, 75, PAGE_H - 320,
            "with historical case patterns to predict outbreaks BEFORE they peak.", 13)

    c.setFillColor(ACCENT_ORANGE)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, PAGE_H - 390, "Key Challenges")
    bullets(c, 50, PAGE_H - 420, [
        " Weekly reporting lags the actual outbreak peak",
        " No district-level early warning exists",
        " Climate - disease relationship is not modeled",
        " No real-time risk prediction available",
    ], font=12, gap=20)

    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(PAGE_W / 2 + 30, PAGE_H - 390, "Our Solution")
    bullets(c, PAGE_W / 2 + 30, PAGE_H - 420, [
        " Real-time climate-data-driven forecasting",
        " District-level 8-week outbreak prediction",
        " Explainable AI with SHAP attributions",
        " Grounded AI assistant with source citations",
    ], font=12, gap=20)
    page(c)

    # ------------------------------------------------------------------ Slide 3: The Idea
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "The Idea")
    img = chart_pipeline()
    c.drawImage(img, 50, PAGE_H - 430, width=PAGE_W - 100, height=210, preserveAspectRatio=True, mask="auto")

    panel(c, 50, 70, PAGE_W - 100, 80)
    text_in(c, 75, 120, "EpiWatch closes this gap with a complete pipeline - from raw data ingestion to", 13, color=ACCENT_ORANGE)
    text_in(c, 75, 98, "interactive risk maps - predicting outbreaks weeks in advance by learning the climate-disease relationship for each district.", 13, color=ACCENT_ORANGE)
    page(c)

    # ------------------------------------------------------------------ Slide 4: ML Architecture
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "ML Architecture")

    # HGB box
    panel(c, 50, 380, 330, 140)
    text_in(c, 65, 500, "HistGradientBoostingRegressor", "Helvetica-Bold", 14, ACCENT_BLUE)
    text_in(c, 65, 478, "Seasonality Baseline", "Helvetica-Bold", 12, white)
    bullets(c, 65, 448, [
        " sin_week, cos_week features",
        " cases_lag1, lag2, lag4",
        " Captures seasonality & trend",
        " max_iter=150, lr=0.08",
    ], font=11, gap=18)

    # + sign
    c.setFillColor(ACCENT_ORANGE)
    c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(PAGE_W / 2, 460, "+")

    # XGB box
    panel(c, PAGE_W / 2 + 40, 380, 330, 140)
    text_in(c, PAGE_W / 2 + 55, 500, "XGBoost Regressor", "Helvetica-Bold", 14, ACCENT_ORANGE)
    text_in(c, PAGE_W / 2 + 55, 478, "Climate Residual Correction", "Helvetica-Bold", 12, white)
    bullets(c, PAGE_W / 2 + 55, 448, [
        " rainfall_mm, rainfall_lag2",
        " temp_max_c, temp_max_lag1",
        " humidity_pct, humidity_lag1",
        " n_estimators=80, depth=4",
    ], font=11, gap=18)

    panel(c, 50, 280, PAGE_W - 100, 90, outline=TEAL)
    text_in(c, 75, 350, "ENSEMBLE PREDICTION", "Helvetica-Bold", 14, white)
    text_in(c, 75, 328, "Final cases = HGB baseline  +  XGB climate correction", "Helvetica", 13, ACCENT_ORANGE)
    text_in(c, 75, 306, "8-week forward forecast with confidence intervals (0.8x - 1.25x) and risk tiering", "Helvetica", 11, LIGHT_GRAY)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(50, 245, "Training Pipeline")
    bullets(c, 50, 222, [
        " For each of 9 districts x 3 diseases: train HGB -> compute residuals -> train XGB on residuals -> combine -> evaluate MAE/RMSE -> save .pkl",
        " Result: 54 models (27 district-disease x 2 model types)  |  0 training failures  |  avg MAE = 2.64",
    ], font=10, gap=15, color=ACCENT_BLUE)
    page(c)

    # ------------------------------------------------------------------ Slide 5: Data & Features
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "Data Sources & Feature Engineering")

    cols = [
        ("IDSP Surveillance", "Weekly cases & deaths\n9 districts · 3 diseases\n104 weeks of data", ACCENT_BLUE),
        ("NASA POWER API", "Temperature, rainfall, humidity\nDaily · 2023-2025\nper district centroid", ACCENT_BLUE),
        ("Census 2011", "District populations + 2025\nprojections for per-capita\nrisk calculations", ACCENT_BLUE),
    ]
    x = 50
    for title, body, col in cols:
        panel(c, x, 290, 225, 165)
        text_in(c, x + 15, 425, title, "Helvetica-Bold", 13, col)
        c.setFillColor(LIGHT_GRAY)
        c.setFont("Helvetica", 10)
        lines = body.split("\n")
        yy = 395
        for ln in lines:
            c.drawString(x + 15, yy, ln)
            yy -= 16
        x += 255

    panel(c, 50, 95, PAGE_W - 100, 185)
    text_in(c, 75, 255, "Feature Engineering", "Helvetica-Bold", 14, white)
    features = [
        ("Seasonality", "sin_week, cos_week (cyclical week-of-year encoding)"),
        ("Case lagging", "cases_lag1, lag2, lag4 (autoregressive history)"),
        ("Rainfall", "rainfall_mm (current), rainfall_lag2 (2-week delayed monsoon trigger)"),
        ("Temperature", "temp_max_c (current), temp_max_lag1 (heat spike driver)"),
        ("Humidity", "humidity_pct (current), humidity_lag1 (vector breeding conditions)"),
    ]
    yy = 230
    for name, desc in features:
        c.setFillColor(ACCENT_BLUE)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(75, yy, name)
        c.setFillColor(LIGHT_GRAY)
        c.setFont("Helvetica", 10)
        c.drawString(180, yy, desc)
        yy -= 27
    page(c)

    # ------------------------------------------------------------------ Slide 6: Model Performance
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "Model Performance")
    img = chart_mae()
    c.drawImage(img, 50, PAGE_H - 420, width=PAGE_W - 100, height=300, preserveAspectRatio=True, mask="auto")

    panel(c, 50, 60, PAGE_W - 100, 55, outline=ACCENT_ORANGE)
    text_in(c, 75, 92, "Cross-district average MAE: 2.64   |   27/27 district-disease models successful   |   0 training failures", "Helvetica-Bold", 12, ACCENT_ORANGE)
    text_in(c, 75, 70, "Worst: Mumbai ADD 5.66   |   Best: Dharwad Malaria 0.57   |   Backtest: MAE 12.99 / RMSE 14.60 (Pune Dengue)", "Helvetica", 10, LIGHT_GRAY)
    page(c)

    # ------------------------------------------------------------------ Slide 7: Backtest
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "Backtest Proof - 8-Week Holdout")
    img = chart_backtest()
    c.drawImage(img, 50, PAGE_H - 420, width=PAGE_W - 100, height=300, preserveAspectRatio=True, mask="auto")

    panel(c, 50, 60, PAGE_W - 100, 55, outline=TEAL)
    text_in(c, 75, 92, "Predicted lead weeks: 6.5 weeks before the actual outbreak peak (2024-11-04, 89 cases)", "Helvetica-Bold", 12, TEAL)
    text_in(c, 75, 70, "Every prediction claim is auditable against ml/results/backtest_results.json", "Helvetica", 10, LIGHT_GRAY)
    page(c)

    # ------------------------------------------------------------------ Slide 8: SHAP
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "Explainability - SHAP Feature Importance")
    img = chart_shap()
    c.drawImage(img, 40, PAGE_H - 410, width=PAGE_W - 80, height=280, preserveAspectRatio=True, mask="auto")

    panel(c, 50, 60, PAGE_W - 100, 60, outline=ACCENT_ORANGE)
    text_in(c, 75, 95, "Key insight: temperature and rainfall lag features are consistently top drivers across districts -", "Helvetica-Bold", 12, ACCENT_ORANGE)
    text_in(c, 75, 72, "confirming the climate-disease linkage that powers every forecast.", "Helvetica-Bold", 12, ACCENT_ORANGE)
    page(c)

    # ------------------------------------------------------------------ Slide 9: Coverage
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "Coverage - 9 Districts x 3 Diseases")
    header = ["District", "State", "Diseases Tracked"]
    rows = [
        ("Bengaluru Urban", "Karnataka", "Dengue, Malaria, ADD"),
        ("Dharwad", "Karnataka", "Dengue, Malaria, ADD"),
        ("Mysuru", "Karnataka", "Dengue, Malaria, ADD"),
        ("Mumbai", "Maharashtra", "Dengue, Malaria, ADD"),
        ("Pune", "Maharashtra", "Dengue, Malaria, ADD"),
        ("Nagpur", "Maharashtra", "Dengue, Malaria, ADD"),
        ("Kolkata", "West Bengal", "Dengue, Malaria, ADD"),
        ("Howrah", "West Bengal", "Dengue, Malaria, ADD"),
        ("North 24 Parganas", "West Bengal", "Dengue, Malaria, ADD"),
    ]
    x0, y0, row_h = 50, PAGE_H - 160, 30
    col_x = [60, 300, 430]
    panel(c, x0, y0 - 30, PAGE_W - 100, row_h, fill=ACCENT_BLUE, outline=ACCENT_BLUE)
    for idx, h in enumerate(header):
        text_in(c, col_x[idx], y0 - 18, h, "Helvetica-Bold", 12, white)
    yy = y0 - 30 - row_h
    for i, (d, s, di) in enumerate(rows):
        fill = PANEL_BG if i % 2 == 0 else HexColor("#1E2440")
        panel(c, x0, yy, PAGE_W - 100, row_h, fill=fill, outline=HexColor("#3A4065"))
        text_in(c, col_x[0], yy + 9, d, "Helvetica", 11, LIGHT_GRAY)
        text_in(c, col_x[1], yy + 9, s, "Helvetica", 11, LIGHT_GRAY)
        text_in(c, col_x[2], yy + 9, di, "Helvetica", 11, ACCENT_BLUE)
        yy -= row_h

    panel(c, 50, 60, PAGE_W - 100, 55, outline=ACCENT_ORANGE)
    text_in(c, 75, 92, "54 trained models  |  27 district-disease combinations x 2 model types (HGB baseline + XGB correction)  |  0 failures", "Helvetica-Bold", 11, ACCENT_ORANGE)
    text_in(c, 75, 70, "613,493 records across 11 Supabase PostgreSQL tables power the dashboard.", "Helvetica", 10, LIGHT_GRAY)
    page(c)

    # ------------------------------------------------------------------ Slide 10: API & Integration
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "API Endpoints & Integration")

    endpoints = [
        ("GET", "/health", "Health check + DB connectivity"),
        ("GET", "/districts", "List all 9 tracked districts"),
        ("GET", "/districts/{id}", "Single district metadata"),
        ("GET", "/districts/{id}/forecast", "8-week disease forecast"),
        ("GET", "/districts/{id}/history", "Historical cases + climate"),
        ("GET", "/districts/{id}/risk", "Risk tier by disease"),
        ("GET", "/methodology", "Model pipeline + SHAP importance"),
        ("GET", "/backtest/{id}", "Backtest event details"),
        ("POST", "/assistant/query", "Grounded AI assistant query"),
    ]
    x0, y0, row_h = 50, PAGE_H - 190, 30
    c.setFillColor(ACCENT_BLUE)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, y0 + 8, "Method")
    c.drawString(180, y0 + 8, "Endpoint")
    c.drawString(440, y0 + 8, "Description")
    yy = y0 - row_h
    for i, (m, e, d) in enumerate(endpoints):
        fill = PANEL_BG if i % 2 == 0 else HexColor("#1E2440")
        panel(c, x0, yy, PAGE_W - 100, row_h, fill=fill, outline=HexColor("#3A4065"))
        text_in(c, 60, yy + 9, m, "Helvetica-Bold", 11, ACCENT_BLUE)
        text_in(c, 180, yy + 9, e, "Courier-Bold", 11, LIGHT_GRAY)
        text_in(c, 440, yy + 9, d, "Helvetica", 10, LIGHT_GRAY)
        yy -= row_h

    panel(c, 50, 85, PAGE_W - 100, 55, outline=TEAL)
    text_in(c, 75, 117, "40/40 integration tests pass  |  Full audit trail (13/13 artifacts verified)  |  SHA-256 data provenance manifest", "Helvetica-Bold", 11, TEAL)
    text_in(c, 75, 95, "Static JSON fallbacks ensure the demo works even without network access.", "Helvetica", 10, LIGHT_GRAY)
    page(c)

    # ------------------------------------------------------------------ Slide 11: How we solve it
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "How EpiWatch Solves the Problem")

    steps = [
        ("1. DATA INGESTION", "Weekly IDSP disease cases + NASA POWER climate + Census 2011 demographics", ACCENT_BLUE),
        ("2. ETL PIPELINE", "Join on district_id + week_start -> 11,232 rows x 12 features", TEAL),
        ("3. FEATURE ENGINEERING", "Seasonality, case lags (1/2/4 weeks), climate lags (2-wk rainfall, 1-day temp/humidity)", ACCENT_ORANGE),
        ("4. HGB BASELINE", "HistGradientBoosting captures seasonal trend from case history", ACCENT_BLUE),
        ("5. XGB CORRECTION", "XGBoost learns how climate anomalies adjust the baseline via residuals", TEAL),
        ("6. ENSEMBLE PREDICT", "Final = HGB + XGB, 8-week forward forecast with confidence intervals", ACCENT_ORANGE),
        ("7. RISK TIERING", "Low -> Medium -> High -> Critical (cases per 100K), color-coded maps", TEAL),
        ("8. AI ASSISTANT", "Grounded Claude chat: every answer sourced from DB / SHAP / documents - refuses to hallucinate", ACCENT_BLUE),
    ]
    yy = PAGE_H - 110
    for title, desc, color in steps:
        c.setFillColor(color)
        c.circle(70, yy + 4, 9, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(70, yy - 1, title[0])
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(95, yy + 4, title)
        c.setFillColor(LIGHT_GRAY)
        c.setFont("Helvetica", 10)
        c.drawString(95, yy - 14, desc)
        yy -= 52

    panel(c, 50, 60, PAGE_W - 100, 40, outline=ACCENT_ORANGE)
    text_in(c, 75, 82, "RESULT: District-level 8-week outbreak forecasts weeks before peak  |  avg MAE 2.64  |  zero training failures  |  fully auditable", "Helvetica-Bold", 11, ACCENT_ORANGE)
    page(c)

    # ------------------------------------------------------------------ Slide 12: Conclusion
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_header(c, "Conclusion & Impact")

    panel(c, 50, 190, (PAGE_W - 100) / 2 - 15, 300, outline=ACCENT_BLUE)
    text_in(c, 70, 455, "EpiWatch Impact", "Helvetica-Bold", 15, ACCENT_BLUE)
    bullets(c, 70, 430, [
        " 9 Indian districts, 3 diseases covered",
        " 8-week advance warning before peak",
        " Avg MAE 2.64 across all combos",
        " 54 trained models, 0 failures",
        " SHA-256 auditable provenance",
        " Grounded AI with source citations",
        " Real-time risk maps for action",
    ], font=11, gap=20)

    panel(c, (PAGE_W - 100) / 2 + 65, 190, (PAGE_W - 100) / 2 - 15, 300, outline=ACCENT_ORANGE)
    text_in(c, (PAGE_W - 100) / 2 + 85, 455, "Future Directions", "Helvetica-Bold", 15, ACCENT_ORANGE)
    bullets(c, (PAGE_W - 100) / 2 + 85, 430, [
        " Expand to all 738 Indian districts",
        " Add El Nino / La Nina signals",
        " Live NASA feed deployments",
        " Respiratory disease extension",
        " Deep learning seasonality",
        " Intervention optimization",
    ], font=11, gap=20)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(50, 150, "Tech Stack")
    text_in(c, 150, 150, "Next.js 15 / FastAPI 0.115 / Supabase PostgreSQL (613K records) / scikit-learn HistGBR + XGBoost / NASA POWER / Claude AI", "Helvetica", 10, LIGHT_GRAY)
    text_in(c, 150, 132, "Full audit trail: 40/40 integration tests · 13/13 artifacts verified · SHA-256 data provenance", "Helvetica", 10, LIGHT_GRAY)

    c.setFillColor(ACCENT_ORANGE)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, 95, "EpiWatch - predicting outbreaks before they peak")
    page(c)

    c.save()
    print("PDF saved: EpiWatch_Presentation.pdf")


if __name__ == "__main__":
    build()
