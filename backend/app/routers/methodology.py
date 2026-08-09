import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/methodology", tags=["Methodology"])

@router.get("")
def get_methodology():
    results_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "results")
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
    
    manifest_path = os.path.join(data_dir, "data_manifest.json")
    metrics_path = os.path.join(results_dir, "model_metrics.json")
    shap_path = os.path.join(results_dir, "shap_importance.json")
    
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    metrics = json.load(open(metrics_path)) if os.path.exists(metrics_path) else {}
    shap = json.load(open(shap_path)) if os.path.exists(shap_path) else {}
    
    return {
        "status": "success",
        "data_manifest": manifest,
        "model_metrics": metrics,
        "shap_feature_importance": shap,
        "pipeline_version": "v1.0-hgb-xgb"
    }
