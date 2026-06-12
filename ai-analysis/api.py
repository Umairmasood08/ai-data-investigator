from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from groq import Groq

app = FastAPI(
    title="FBR Broadening National Tax Net Engine",
    description="Machine Learning & Anomaly Detection Compliance API",
    version="1.0.0"
)

# Enable CORS for frontend dashboard visualization connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# CORE STORAGE LOADER PIPELINE
# ─────────────────────────────────────────
def load_scored_matrix():
    try:
        data = pd.read_csv("scored_entities.csv")
        # Standardize matching key formats to clean strings
        if "cnic" in data.columns:
            data["cnic"] = data["cnic"].astype(str).str.strip()
        print(f"✅ API Engine loaded successfully with {len(data)} scored individual records.")
        return data.fillna("")
    except FileNotFoundError:
        print("❌ Critical System Bug: 'scored_entities.csv' was missing.")
        return pd.DataFrame()

df = load_scored_matrix()

# Secure initialization tracking for the Groq client wrapper
client = Groq(api_key="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")

# ─────────────────────────────────────────
# API ROUTER SERVICE ENDPOINTS
# ─────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Tax Compliance Machine Learning API Running"}


@app.get("/summary")
def summary():
    total = len(df)
    flagged = int(df["flagged"].sum())
    
    # Precision/Recall calculated from ground truth
    try:
        gt = pd.read_excel("GroundTruth.xlsx")
        gt.columns = gt.columns.str.strip().str.lower().str.replace(" ", "_")
        gt_cnics = set(gt["canonical_cnic"].astype(str))
        flagged_cnics = set(df[df["flagged"]==1]["cnic"].astype(str))
        
        TP = len(gt_cnics & flagged_cnics)
        FP = len(flagged_cnics - gt_cnics)
        FN = len(gt_cnics - flagged_cnics)
        
        precision = round(TP / (TP + FP) * 100, 2) if (TP+FP) > 0 else 0
        recall    = round(TP / (TP + FN) * 100, 2) if (TP+FN) > 0 else 0
        f1        = round(2*precision*recall / (precision+recall), 2) if (precision+recall) > 0 else 0
    except:
        precision, recall, f1 = 0, 0, 0

    return {
        "total_persons": total,
        "flagged": flagged,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }


@app.get("/flagged")
def get_flagged():
    """Retrieves all individuals in the danger zone sorted by risk"""
    if df.empty or "flagged" not in df.columns:
        return []
    flagged_entities = df[df["flagged"].astype(int) == 1]
    flagged_sorted = flagged_entities.sort_values("tax_deviation_score", ascending=False)
    return flagged_sorted.to_dict(orient="records")


@app.get("/scores")
def get_all_scores():
    """Feeds score tracking arrays straight to frontend dashboard charts"""
    output_cols = ["cnic", "full_name", "city", "lifestyle_index", "ml_anomaly_score", "tax_deviation_score", "flagged"]
    present_cols = [c for c in output_cols if c in df.columns]
    return df[present_cols].to_dict(orient="records")


@app.get("/audit/ai/all-profiles")
def get_all_ai_audit_reports(limit: int = 10):
    """
    FIXED GLOBAL ENDPOINT:
    Instead of pulling one person (like Farhan Iqbal), this endpoint loops 
    through the flagged profiles and returns their AI audit summaries together!
    
    You can increase the limit parameters in your browser URL like this:
    http://127.0.0.1:8000/audit/ai/all-profiles?limit=25
    """
    if df.empty or "flagged" not in df.columns:
        raise HTTPException(status_code=404, detail="Scored dataset pipeline empty.")

    # 1. Filter down to EVERYONE who is flagged in the danger zone
    flagged_df = df[df["flagged"].astype(int) == 1].sort_values("tax_deviation_score", ascending=False)
    
    # 2. Grab a batch slice to safeguard performance execution speeds
    target_batch = flagged_df.head(limit)
    
    compiled_reports = []
    print(f"Generating bulk AI justifications for {len(target_batch)} profiles...")

    # 3. LOOP THROUGH EVERY PROFILE instead of targeting just one person!
    for _, row in target_batch.iterrows():
        prompt = f"""You are a senior tax auditor at FBR Pakistan. Generate a formal 3-sentence audit statement.
Name: {row.get('full_name', 'Unknown')}
City: {row.get('city', 'Unknown')}
Risk Compliance Score: {row.get('tax_deviation_score', 0)}/100
Flags: {row.get('audit_trail', 'None')}"""

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150
            )
            ai_text = response.choices[0].message.content
        except Exception:
            ai_text = "AI generation skipped due to server traffic limits."

        # Add this person's record to our final collective list
        compiled_reports.append({
            "cnic": row.get("cnic"),
            "name": row.get("full_name"),
            "tax_deviation_score": float(row.get("tax_deviation_score", 0.0)),
            "ai_audit_report": ai_text
        })

    return {
        "total_flagged_in_danger_zone": len(flagged_df),
        "total_reports_generated": len(compiled_reports),
        "all_reports": compiled_reports
    }