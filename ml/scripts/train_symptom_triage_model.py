"""
Indian Healthcare Symptom-Disease Clinical Triage ML Pipeline
============================================================
Trains multi-task NLP and Gradient Boosting models for:
  1. Symptom -> Possible Diseases Multi-Label Prediction (TF-IDF + OneVsRestClassifier)
  2. Clinical Severity Grading (Mild / Moderate / Severe Classifier)

Inputs:
  data/raw/healthcare/symptom_disease_dataset.csv

Outputs:
  ml/models/symptom_triage_model.pkl
  ml/results/symptom_triage_metrics.json
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import MultiLabelBinarizer, LabelEncoder
from sklearn.multiclass import OneVsRestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "healthcare", "symptom_disease_dataset.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


def train_symptom_triage_pipeline():
    print("=" * 65)
    print("Training Healthcare Symptom-Disease Triage ML Models")
    print("=" * 65)

    if not os.path.exists(DATA_PATH):
        print(f"Healthcare dataset not found at {DATA_PATH}, skipping...")
        return

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded Healthcare Dataset: {len(df)} symptom records")

    # Clean text
    df["Symptom"] = df["Symptom"].fillna("").astype(str).str.strip()
    df["Severity"] = df["Severity"].fillna("Moderate").astype(str).str.strip().str.capitalize()
    
    # Parse comma-separated possible diseases
    df["disease_list"] = df["Possible Diseases"].fillna("").apply(
        lambda x: [d.strip() for d in str(x).split(",") if d.strip()]
    )

    # Filter out empty symptom rows
    df = df[df["Symptom"].str.len() > 1].reset_index(drop=True)

    # 1. Multi-label Binarizer for Diseases
    mlb = MultiLabelBinarizer()
    Y_diseases = mlb.fit_transform(df["disease_list"])
    disease_classes = list(mlb.classes_)
    print(f"Total Unique Target Diseases: {len(disease_classes)}")

    # 2. Text Vectorizer
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1500)
    X_tfidf = vectorizer.fit_transform(df["Symptom"])

    # 3. Train Disease Classifier (OneVsRest + GradientBoosting / RandomForest)
    clf_disease = OneVsRestClassifier(
        RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    )
    clf_disease.fit(X_tfidf, Y_diseases)

    # 4. Severity Classifier
    label_enc_sev = LabelEncoder()
    y_severity = label_enc_sev.fit_transform(df["Severity"])

    X_train_sev, X_test_sev, y_train_sev, y_test_sev = train_test_split(
        X_tfidf, y_severity, test_size=0.2, random_state=42
    )

    clf_severity = GradientBoostingClassifier(n_estimators=80, learning_rate=0.1, random_state=42)
    clf_severity.fit(X_train_sev, y_train_sev)
    y_pred_sev = clf_severity.predict(X_test_sev)
    sev_acc = float(accuracy_score(y_test_sev, y_pred_sev))
    sev_f1 = float(f1_score(y_test_sev, y_pred_sev, average="weighted"))

    print(f"Severity Classification Test Accuracy: {sev_acc:.2%}, Weighted F1: {sev_f1:.3f}")

    # Build Pipeline Bundle
    pipeline_bundle = {
        "vectorizer": vectorizer,
        "disease_classifier": clf_disease,
        "mlb": mlb,
        "severity_classifier": clf_severity,
        "severity_encoder": label_enc_sev,
        "disease_classes": disease_classes,
        "severity_classes": list(label_enc_sev.classes_)
    }

    model_path = os.path.join(MODELS_DIR, "symptom_triage_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(pipeline_bundle, f)
    print(f"Saved symptom triage model bundle -> {model_path}")

    # Sample Inference Test
    sample_symptoms = ["Fever and skin rash with joint pain", "Difficulty breathing and chest pain", "Persistent cough and fatigue"]
    inference_samples = []
    for s in sample_symptoms:
        vec = vectorizer.transform([s])
        dis_prob = clf_disease.predict_proba(vec)[0]
        top_indices = np.argsort(dis_prob)[::-1][:4]
        top_diseases = [{"disease": disease_classes[i], "confidence": round(float(dis_prob[i]), 3)} for i in top_indices if dis_prob[i] > 0.05]
        
        sev_idx = clf_severity.predict(vec)[0]
        sev_label = label_enc_sev.inverse_transform([sev_idx])[0]
        
        inference_samples.append({
            "symptom_input": s,
            "predicted_severity": sev_label,
            "top_suspected_diseases": top_diseases
        })

    # Save Metrics
    metrics = {
        "total_training_samples": len(df),
        "total_disease_classes": len(disease_classes),
        "severity_classes": list(label_enc_sev.classes_),
        "severity_test_accuracy": round(sev_acc, 3),
        "severity_test_f1": round(sev_f1, 3),
        "sample_inferences": inference_samples
    }

    metrics_path = os.path.join(RESULTS_DIR, "symptom_triage_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics -> {metrics_path}")

    print("=" * 65)
    print("Healthcare Symptom Triage Training Complete!")
    print("=" * 65)


if __name__ == "__main__":
    train_symptom_triage_pipeline()
