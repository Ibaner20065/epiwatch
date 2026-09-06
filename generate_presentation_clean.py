"""
EpiWatch GramRaksha + PashuRaksha: Professional PowerPoint Presentation Generator

This script generates a comprehensive PowerPoint presentation covering:
- Project Overview & Mission
- Rural Problem Statement
- Core Modules & Features
- System Architecture
- Data & ML Components
- Frontend Dashboard
- Impact & Metrics
- Technical Stack
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pathlib import Path
from datetime import datetime


class EpiWatchPresentationGenerator:
    def __init__(self, output_file="EpiWatch_Presentation.pptx"):
        self.prs = Presentation()
        self.prs.slide_width = Inches(10)
        self.prs.slide_height = Inches(7.5)
        self.output_file = output_file
        
        # Color scheme
        self.COLOR_PRIMARY = RGBColor(0, 212, 170)      # Teal/Cyan
        self.COLOR_SECONDARY = RGBColor(76, 175, 80)    # Green
        self.COLOR_ACCENT = RGBColor(33, 150, 243)      # Blue
        self.COLOR_DARK = RGBColor(33, 33, 33)          # Dark Gray
        self.COLOR_LIGHT = RGBColor(245, 245, 245)      # Light Gray
        self.COLOR_TEXT = RGBColor(51, 51, 51)          # Text Gray
        
    def _add_title_slide(self, title, subtitle=""):
        """Add a title slide with custom styling"""
        slide = self.prs.slides.add_slide(self.prs.slide_layouts[6])  # Blank layout
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = self.COLOR_PRIMARY
        
        # Add main title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(9), Inches(1.5))
        title_frame = title_box.text_frame
        title_frame.word_wrap = True
        title_frame.text = title
        
        title_paragraph = title_frame.paragraphs[0]
        title_paragraph.font.size = Pt(60)
        title_paragraph.font.bold = True
        title_paragraph.font.color.rgb = RGBColor(255, 255, 255)
        title_paragraph.alignment = PP_ALIGN.CENTER
        
        # Add subtitle
        if subtitle:
            subtitle_box = slide.shapes.add_textbox(Inches(0.5), Inches(4.2), Inches(9), Inches(2))
            subtitle_frame = subtitle_box.text_frame
            subtitle_frame.word_wrap = True
            subtitle_frame.text = subtitle
            
            subtitle_para = subtitle_frame.paragraphs[0]
            subtitle_para.font.size = Pt(24)
            subtitle_para.font.color.rgb = RGBColor(255, 255, 255)
            subtitle_para.alignment = PP_ALIGN.CENTER
        
        return slide
    
    def _add_content_slide(self, title, content_points):
        """Add a slide with title and bullet points"""
        slide = self.prs.slides.add_slide(self.prs.slide_layouts[6])  # Blank layout
        
        # Background
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(255, 255, 255)
        
        # Add title bar
        title_shape = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(10), Inches(0.8))
        title_shape.fill.solid()
        title_shape.fill.fore_color.rgb = self.COLOR_PRIMARY
        title_shape.line.color.rgb = self.COLOR_PRIMARY
        
        # Title text
        title_frame = title_shape.text_frame
        title_frame.text = title
        title_para = title_frame.paragraphs[0]
        title_para.font.size = Pt(40)
        title_para.font.bold = True
        title_para.font.color.rgb = RGBColor(255, 255, 255)
        title_para.space_before = Pt(8)
        title_para.space_after = Pt(8)
        title_frame.margin_left = Inches(0.3)
        
        # Add content
        content_box = slide.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(9), Inches(6))
        text_frame = content_box.text_frame
        text_frame.word_wrap = True
        
        for i, point in enumerate(content_points):
            if i == 0:
                p = text_frame.paragraphs[0]
            else:
                p = text_frame.add_paragraph()
            
            p.text = point
            p.level = 0
            p.font.size = Pt(18)
            p.font.color.rgb = self.COLOR_TEXT
            p.space_before = Pt(6)
            p.space_after = Pt(6)
            p.line_spacing = 1.3
        
        return slide
    
    def _add_two_column_slide(self, title, left_content, right_content):
        """Add a slide with two columns"""
        slide = self.prs.slides.add_slide(self.prs.slide_layouts[6])
        
        # Background
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(255, 255, 255)
        
        # Title bar
        title_shape = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(10), Inches(0.8))
        title_shape.fill.solid()
        title_shape.fill.fore_color.rgb = self.COLOR_SECONDARY
        title_shape.line.color.rgb = self.COLOR_SECONDARY
        
        title_frame = title_shape.text_frame
        title_frame.text = title
        title_para = title_frame.paragraphs[0]
        title_para.font.size = Pt(40)
        title_para.font.bold = True
        title_para.font.color.rgb = RGBColor(255, 255, 255)
        title_para.space_before = Pt(8)
        title_frame.margin_left = Inches(0.3)
        
        # Left column
        left_box = slide.shapes.add_textbox(Inches(0.4), Inches(1.2), Inches(4.5), Inches(6))
        left_frame = left_box.text_frame
        left_frame.word_wrap = True
        
        for i, point in enumerate(left_content):
            if i == 0:
                p = left_frame.paragraphs[0]
            else:
                p = left_frame.add_paragraph()
            p.text = point
            p.font.size = Pt(16)
            p.font.color.rgb = self.COLOR_TEXT
            p.space_after = Pt(8)
        
        # Right column
        right_box = slide.shapes.add_textbox(Inches(5.1), Inches(1.2), Inches(4.5), Inches(6))
        right_frame = right_box.text_frame
        right_frame.word_wrap = True
        
        for i, point in enumerate(right_content):
            if i == 0:
                p = right_frame.paragraphs[0]
            else:
                p = right_frame.add_paragraph()
            p.text = point
            p.font.size = Pt(16)
            p.font.color.rgb = self.COLOR_TEXT
            p.space_after = Pt(8)
        
        return slide
    
    def generate(self):
        """Generate the complete presentation"""
        
        # Slide 1: Title Slide
        self._add_title_slide(
            "EpiWatch GramRaksha + PashuRaksha",
            "AI-Powered Rural One-Health Disease Intelligence\nand Smallholder Livelihood Protection Platform"
        )
        
        # Slide 2: The Rural Problem
        self._add_content_slide(
            "[The Rural Problem & Mission]",
            [
                "[*] Livestock is the Farmer's Primary Bank Account",
                "  - 80 percent of India's livestock reared by smallholders",
                "  - Single outbreak (FMD, LSD, PPR) = economic catastrophe",
                "[*] The Zoonotic & Monsoon Health Nexus",
                "  - 75 percent of emerging diseases at rural human-animal-forest interface",
                "  - Monsoon: waterborne diseases + vector-borne illnesses",
                "[*] The Rural Diagnostic Desert",
                "  - 7-21 day delays for lab confirmation",
                "  - Farmers lose critical time for disease response"
            ]
        )
        
        # Slide 3: The Solution
        self._add_content_slide(
            "[Solution: EpiWatch Outbreak Shield]",
            [
                "[+] 4-8 Week Lead-Time Warning",
                "  - Uses satellite climate telemetry (NASA POWER)",
                "  - Forecasts outbreaks before hospital/cattle spikes",
                "[+] Tehsil/Block-Level Granularity",
                "  - Grounded in 19th Livestock Census (356 MH tehsils)",
                "  - 32.48M livestock, 77.79M poultry coverage",
                "[+] Grassroots Field Triage",
                "  - AI NLP symptom triage for Pashu Sakhis & ASHA workers",
                "  - Vernacular Marathi/Hindi voice support",
                "[+] Farmer Health Screening (SwasthSandhi)",
                "  - Early digital WOMAC screening for OA (AUC 0.96)"
            ]
        )
        
        # Slide 4: System Architecture
        self._add_content_slide(
            "[System Architecture Overview]",
            [
                "RURAL DATA INGESTION",
                "  [*] IDSP Rural Disease Trends",
                "  [*] MOSPI 37 Livestock Diseases",
                "  [*] 19th Census (356 MH Tehsils)",
                "  [*] NASA POWER Monsoon Climate Lags",
                "",
                "AI ENSEMBLE FORECASTING",
                "  [*] 111 National Livestock Ensembles",
                "  [*] 44 Maharashtra District Models",
                "  [*] 54 Human Vector/Water Models",
                "  [*] NLP Clinical Symptom Classifier",
                "",
                "GRASSROOTS ACTION HUBS",
                "  [*] Gram Panchayat Multilingual SMS",
                "  [*] Pashu Sakhi Field App + Audio",
                "  [*] Mobile Vet Unit (MVU) Routing"
            ]
        )
        
        # Slide 5: Core Modules - Part 1
        self._add_content_slide(
            "[Core Rural Modules (Part 1)]",
            [
                "[1] PashuRaksha - Rural Livestock Economy",
                "   [*] 37 livestock diseases, 11 years of MOSPI data",
                "   [*] 111 ensemble models (Attacks, Outbreaks, Deaths)",
                "   [*] Maharashtra: 44 District Models",
                "   [*] Mobile Veterinary Unit (MVU) route allocation",
                "",
                "[2] EpiWatch - Monsoon Epidemic Forecasting",
                "   [*] Waterborne & Vector Defense (ADD, Malaria, Dengue)",
                "   [*] HistGradientBoostingRegressor + XGBoost ensemble",
                "   [*] SHAP weather explainability",
                "   [*] 4-8 week advance warnings"
            ]
        )
        
        # Slide 6: Core Modules - Part 2
        self._add_content_slide(
            "[Core Rural Modules (Part 2)]",
            [
                "[3] Pashu Sakhi & Village Worker Field Intake",
                "   [*] Grassroots reporting portal",
                "   [*] Real-time NLP symptom-to-disease inference",
                "   [*] Vernacular Marathi, Hindi, English support",
                "   [*] Clinical severity grading (Mild, Moderate, Severe)",
                "",
                "[4] SwasthSandhi - Farmer Osteoarthritis Screening",
                "   [*] Community camp screening for farm workers",
                "   [*] WOMAC pain & stiffness evaluation",
                "   [*] Digital early-detection screening",
                "",
                "[5] Grounded Village Health AI Assistant",
                "   [*] Decision support with verified epidemiology",
                "   [*] Refuses medical hallucinations"
            ]
        )
        
        # Slide 7: Tech Stack & Backend
        self._add_two_column_slide(
            "[Technical Stack]",
            [
                "BACKEND:",
                "[*] FastAPI (Python 3.12)",
                "[*] PostgreSQL + SQLite",
                "[*] SQLAlchemy ORM",
                "[*] Supabase for production",
                "",
                "ML & DATA:",
                "[*] Prophet forecasting",
                "[*] XGBoost ensemble",
                "[*] HistGradientBoosting",
                "[*] SHAP explainability",
                "[*] Pandas/NumPy processing"
            ],
            [
                "FRONTEND:",
                "[*] Next.js 15",
                "[*] React components",
                "[*] Glassmorphic UI",
                "[*] Interactive risk maps",
                "",
                "APIs & DATA:",
                "[*] NASA POWER API",
                "[*] IDSP surveillance feeds",
                "[*] 19th Livestock Census",
                "[*] Geospatial (GeoJSON)",
                "[*] Real-time data streams"
            ]
        )
        
        # Slide 8: Frontend Dashboard
        self._add_content_slide(
            "[Frontend Dashboard Features]",
            [
                "[+] Risk Map Visualization",
                "  - Interactive district-level risk heatmap",
                "  - Real-time disease toggles",
                "",
                "[+] District Forecasts & Historical Data",
                "  - Predicted vs. actual disease trends",
                "  - 8-week backtesting proof",
                "  - Climate-driven outbreak forecasting",
                "",
                "[+] Grounded AI Assistant Chat",
                "  - Cite epidemiology documents",
                "  - Query predictions with explanations",
                "  - Multilingual support",
                "",
                "[+] Methodology & World Context",
                "  - Transparent model documentation",
                "  - Global disease surveillance context"
            ]
        )
        
        # Slide 9: Data & ML Pipeline
        self._add_content_slide(
            "[Data & ML Pipeline]",
            [
                "DATA INGESTION:",
                "  [*] 14 raw + processed files (1.38 MB joined dataset)",
                "  [*] 11,232 rows x 12 columns weekly data",
                "  [*] Climate data from NASA POWER API",
                "  [*] Census population projections",
                "",
                "ML TRAINING:",
                "  [*] 27 district x disease combinations",
                "  [*] 54 trained models (.pkl artifacts)",
                "  [*] Metrics: MAE=12.99, RMSE=14.60",
                "  [*] 8-week holdout backtest evaluation",
                "",
                "MODEL TYPES:",
                "  [*] Prophet (seasonal decomposition)",
                "  [*] XGBoost (gradient boosting)",
                "  [*] HistGradientBoostingRegressor (baseline)",
                "  [*] NLP for symptom classification"
            ]
        )
        
        # Slide 10: Database Architecture
        self._add_content_slide(
            "[Database Architecture]",
            [
                "11 PostgreSQL Tables (598,291+ seeded records):",
                "",
                "[*] districts - District metadata & population",
                "[*] case_data - Historical disease cases",
                "[*] climate_data - NASA POWER weather variables",
                "[*] livestock_inventory - 19th Census tehsil breakdown",
                "[*] livestock_diseases - MOSPI 37-disease definitions",
                "[*] forecast_results - Model predictions",
                "[*] backtest_data - 8-week holdout evaluation",
                "[*] user_reports - Pashu Sakhi field triage",
                "[*] oa_screening - SwasthSandhi OA risk profiles",
                "[*] chat_history - AI assistant conversations",
                "[*] document_chunks - Epidemiology reference library"
            ]
        )
        
        # Slide 11: API Endpoints
        self._add_content_slide(
            "[FastAPI Endpoints]",
            [
                "HEALTH & CORE:",
                "  [*] GET /health - Service status",
                "  [*] GET /districts - List all districts",
                "",
                "PREDICTIONS & FORECASTING:",
                "  [*] GET /districts/{id}/forecast - 4-8 week forecast",
                "  [*] GET /districts/{id}/history - Historical trends",
                "  [*] GET /backtest/{event_id} - Backtest results",
                "",
                "LIVESTOCK INTELLIGENCE:",
                "  [*] GET /livestock/dataful/summary - National aggregate",
                "  [*] GET /livestock/dataful/diseases - Disease catalog",
                "  [*] POST /livestock/triage - Symptom classification",
                "",
                "GROUNDED AI:",
                "  [*] POST /assistant/query - Conversational Q&A",
                "",
                "All endpoints: CORS-enabled, JSON response, 200-500ms latency"
            ]
        )
        
        # Slide 12: Implementation Milestones
        self._add_content_slide(
            "[Implementation Milestones]",
            [
                "[OK] PHASE 1: Data Ingestion & ETL (COMPLETE)",
                "   - 14 data sources ingested, 11K+ weekly records",
                "",
                "[OK] PHASE 2: ML Modeling (COMPLETE)",
                "   - 54 trained models, backtest validation",
                "",
                "[OK] PHASE 3: Backend & Database (COMPLETE)",
                "   - FastAPI + PostgreSQL, 598K+ seeded records",
                "",
                "[OK] PHASE 4: Frontend Dashboard (COMPLETE)",
                "   - Next.js + React, 7+ interactive pages",
                "",
                "[OK] PHASE 5: Integration & Testing (COMPLETE)",
                "   - 40-test e2e suite, all tests passing",
                "",
                "[OK] PHASE 6: Conversational AI (COMPLETE)",
                "   - Grounded assistant with document citations"
            ]
        )
        
        # Slide 13: Quality Assurance
        self._add_content_slide(
            "[Quality Assurance & Testing]",
            [
                "E2E TEST SUITE: 40/40 Tests Passing",
                "",
                "[+] DATABASE TESTS (11 tables, 613K+ rows)",
                "  - Schema validation, data integrity checks",
                "",
                "[+] REST API TESTS (8 endpoints)",
                "  - Latency profiling, response validation",
                "",
                "[+] ML TESTS (4 model artifacts)",
                "  - Pickle file integrity, prediction ranges",
                "",
                "[+] PIPELINE TESTS (3 chain checks)",
                "  - Data flow validation, ETL completeness",
                "",
                "[+] FRONTEND TESTS (7 pages)",
                "  - Build validation, component rendering",
                "",
                "STATUS: [OK] ALL CLEAR - Deploy Approved"
            ]
        )
        
        # Slide 14: Impact & Metrics
        self._add_content_slide(
            "[Impact & Metrics]",
            [
                "GEOGRAPHIC COVERAGE:",
                "  [*] 356 Tehsils across Maharashtra (32.48M livestock)",
                "  [*] 77.79M poultry tracked via 19th Census",
                "  [*] 9 districts with complete climate data",
                "",
                "MODEL PERFORMANCE:",
                "  [*] MAE: 12.99 cases (vs. baseline 18.5)",
                "  [*] RMSE: 14.60 (weekly forecast accuracy)",
                "  [*] Lead-time: 4-8 weeks advance warning",
                "  [*] OA Screening AUC: 0.96 (excellent discrimination)",
                "",
                "DEPLOYMENT READINESS:",
                "  [*] 40/40 tests passing",
                "  [*] 598K+ seeded production records",
                "  [*] <500ms API response latency",
                "  [*] Multilingual (Marathi, Hindi, English)"
            ]
        )
        
        # Slide 15: Next Steps & Roadmap
        self._add_content_slide(
            "[Next Steps & Roadmap]",
            [
                "IMMEDIATE (Next 30 Days):",
                "  [*] Farmer field trials (3 Gram Panchayats)",
                "  [*] Mobile app deployment (iOS/Android)",
                "  [*] Integration with ASHA worker platforms",
                "",
                "SHORT-TERM (3-6 Months):",
                "  [*] Expand to 10+ Indian states",
                "  [*] Add veterinary intervention routing",
                "  [*] Real-time SMS alert deployment",
                "",
                "MEDIUM-TERM (6-12 Months):",
                "  [*] Integrate satellite imagery for field verification",
                "  [*] Scale to 500+ Gram Panchayats",
                "  [*] Livestock insurance partnership integration",
                "",
                "LONG-TERM VISION:",
                "  [*] Pan-India One-Health surveillance",
                "  [*] Cross-country border disease tracking",
                "  [*] Open-source policy for global adoption"
            ]
        )
        
        # Slide 16: Call to Action
        closing_slide = self._add_title_slide(
            "Join Us in Building Rural India's Disease Defense",
            "EpiWatch: Protecting Livelihoods, Saving Lives\nRural | AI-Powered | Scalable | Global Impact"
        )
        
        # Add footer info
        footer_box = closing_slide.shapes.add_textbox(Inches(0.5), Inches(6.5), Inches(9), Inches(1))
        footer_frame = footer_box.text_frame
        footer_frame.word_wrap = True
        footer_text = "Generated: " + datetime.now().strftime('%B %d, %Y') + "\nRepository: Ibaner20065/epiwatch | Status: Production Ready"
        footer_frame.text = footer_text
        footer_para = footer_frame.paragraphs[0]
        footer_para.font.size = Pt(14)
        footer_para.font.color.rgb = RGBColor(200, 200, 200)
        footer_para.alignment = PP_ALIGN.CENTER
        
        return self.prs
    
    def save(self):
        """Save the presentation to file"""
        self.prs.save(self.output_file)
        return Path(self.output_file).resolve()


def main():
    """Main execution function"""
    print("[*] Generating EpiWatch Presentation...")
    print("-" * 60)
    
    try:
        # Create generator
        generator = EpiWatchPresentationGenerator()
        
        # Generate presentation
        print("[*] Building slides...")
        generator.generate()
        
        # Save to file
        output_path = generator.save()
        
        print("[+] Presentation generated successfully!")
        print("[*] File: " + str(output_path))
        print("[*] Total slides: " + str(len(generator.prs.slides)))
        print("-" * 60)
        print("\nPresentation Contents:")
        print("  1. Title Slide")
        print("  2. Rural Problem & Mission")
        print("  3. Solution: EpiWatch Outbreak Shield")
        print("  4. System Architecture Overview")
        print("  5. Core Modules (Part 1: PashuRaksha & EpiWatch)")
        print("  6. Core Modules (Part 2: Pashu Sakhi, SwasthSandhi, AI)")
        print("  7. Technical Stack")
        print("  8. Frontend Dashboard Features")
        print("  9. Data & ML Pipeline")
        print(" 10. Database Architecture")
        print(" 11. FastAPI Endpoints")
        print(" 12. Implementation Milestones")
        print(" 13. Quality Assurance & Testing")
        print(" 14. Impact & Metrics")
        print(" 15. Next Steps & Roadmap")
        print(" 16. Closing Slide (Call to Action)")
        print("-" * 60)
        
    except Exception as e:
        print("[-] Error: " + str(e))
        raise


if __name__ == "__main__":
    main()
