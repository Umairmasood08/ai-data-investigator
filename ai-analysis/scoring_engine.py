import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
import json

# Load data
print("Loading data...")
df = pd.read_csv("merged.csv").fillna(0)

# ─────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────
# Vehicle score
df["vehicle_score"] = df["engine_cc"].apply(
    lambda x: 100 if x >= 2000 else (60 if x >= 1300 else 20)
)

# Utility score
df["utility_score"] = df["avg_monthly_bill_pkr"].apply(
    lambda x: 100 if x >= 150000 else (60 if x >= 50000 else 20)
)

# Property score
df["property_score"] = df["estimated_value_pkr"].apply(
    lambda x: 100 if x >= 20000000 else (60 if x >= 5000000 else 20)
)

# Travel score
df["travel_score"] = df["travel_class"].apply(
    lambda x: 100 if str(x) in ["Business", "First"] else 20
)

# Tax gap score
df["declared_income_pkr"] = pd.to_numeric(df["declared_income_pkr"], errors="coerce").fillna(0)
df["tax_gap_score"] = df.apply(
    lambda r: 100 if r["is_non_filer"] == 1
    else (80 if r["declared_income_pkr"] < 500000 and r["vehicle_score"] > 60 else 10),
    axis=1
)

# ─────────────────────────────────────────
# LIFESTYLE INDEX
# ─────────────────────────────────────────
df["lifestyle_index"] = (
    df["vehicle_score"]  * 0.25 +
    df["utility_score"]  * 0.25 +
    df["property_score"] * 0.25 +
    df["travel_score"]   * 0.10 +
    df["tax_gap_score"]  * 0.15
)

# ─────────────────────────────────────────
# ISOLATION FOREST (ML Anomaly Detection)
# ─────────────────────────────────────────
features = ["vehicle_score", "utility_score", "property_score",
            "travel_score", "tax_gap_score", "declared_income_pkr"]

X = df[features].fillna(0)
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

print("Training Isolation Forest...")
model = IsolationForest(
    n_estimators=200,
    contamination=0.15,
    random_state=42
)
model.fit(X_scaled)

# Anomaly score: convert to 0-100
raw_scores = model.decision_function(X_scaled)
df["ml_anomaly_score"] = MinMaxScaler().fit_transform(
    (-raw_scores).reshape(-1, 1)
) * 100

# ─────────────────────────────────────────
# FINAL TAX COMPLIANCE DEVIATION SCORE
# ─────────────────────────────────────────
df["tax_deviation_score"] = (
    df["lifestyle_index"]   * 0.50 +
    df["ml_anomaly_score"]  * 0.50
).round(2)

df["flagged"] = (df["tax_deviation_score"] >= 60).astype(int)

# ─────────────────────────────────────────
# AUDIT TRAIL
# ─────────────────────────────────────────
def generate_audit(row):
    reasons = []
    if row["vehicle_score"] >= 100:
        reasons.append(f"Owns high-CC vehicle (>{int(row['engine_cc'])}cc)")
    if row["utility_score"] >= 100:
        reasons.append(f"Monthly utility bill PKR {int(row['avg_monthly_bill_pkr']):,}")
    if row["property_score"] >= 100:
        reasons.append(f"Property value PKR {int(row['estimated_value_pkr']):,}")
    if row["travel_score"] >= 100:
        reasons.append(f"Travels {row['travel_class']} class")
    if row["is_non_filer"] == 1:
        reasons.append("ZERO tax filing on record")
    elif row["declared_income_pkr"] < 500000:
        reasons.append(f"Declared income only PKR {int(row['declared_income_pkr']):,}")
    return " | ".join(reasons) if reasons else "No major flags"

df["audit_trail"] = df.apply(generate_audit, axis=1)

# ─────────────────────────────────────────
# OUTPUT
# ─────────────────────────────────────────
output_cols = [
    "cnic", "full_name", "city",
    "vehicle_score", "utility_score", "property_score",
    "travel_score", "tax_gap_score", "lifestyle_index",
    "ml_anomaly_score", "tax_deviation_score",
    "flagged", "audit_trail"
]

result = df[output_cols].drop_duplicates(subset="cnic").sort_values(
    "tax_deviation_score", ascending=False
)
result.to_csv("scored_entities.csv", index=False)

print(f"\n✅ Scoring complete!")
print(f"   Total persons scored : {len(result)}")
print(f"   Flagged              : {result['flagged'].sum()}")
print(f"   Top scorer           : {result.iloc[0]['full_name']} — {result.iloc[0]['tax_deviation_score']}")

# ─────────────────────────────────────────
# PRECISION / RECALL
# ─────────────────────────────────────────
try:
    gt = pd.read_excel("GroundTruth.xlsx")
    gt.columns = gt.columns.str.strip().str.lower().str.replace(" ", "_")
    gt_cnics = set(gt["canonical_cnic"].astype(str))
    flagged_cnics = set(result[result["flagged"]==1]["cnic"].astype(str))

    TP = len(gt_cnics & flagged_cnics)
    FP = len(flagged_cnics - gt_cnics)
    FN = len(gt_cnics - flagged_cnics)

    precision = TP / (TP + FP) if (TP+FP) > 0 else 0
    recall    = TP / (TP + FN) if (TP+FN) > 0 else 0
    f1        = 2*precision*recall / (precision+recall) if (precision+recall) > 0 else 0

    print(f"\n📊 Evaluation vs Ground Truth:")
    print(f"   Precision : {precision:.2%}")
    print(f"   Recall    : {recall:.2%}")
    print(f"   F1 Score  : {f1:.2%}")
except Exception as e:
    print(f"\n⚠️ Ground truth evaluation skipped: {str(e)}")