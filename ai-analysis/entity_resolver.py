import pandas as pd
import numpy as np
import re
import json
from sentence_transformers import SentenceTransformer
import hdbscan

# ─────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────
print("Loading merged dataset...")
df = pd.read_csv("merged.csv")

print("Columns:", df.columns.tolist())

# Use full_name as the name column
df = df[["cnic", "full_name"]].dropna(subset=["cnic"])
df = df.rename(columns={"full_name": "name"})
df = df.drop_duplicates()
df["cnic"] = df["cnic"].astype(str).str.strip()
df["name"] = df["name"].astype(str).str.strip()

# ─────────────────────────────────────────
# 2. NORMALIZE NAMES
# ─────────────────────────────────────────
def normalize_name(name):
    name = str(name).lower().strip()
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name)
    abbrev = {
        r'\bm\b': 'muhammad',
        r'\bu\b': 'usman',
        r'\ba\b': 'ahmed',
        r'\bz\b': 'zain',
        r'\bk\b': 'khalid',
    }
    for pattern, replacement in abbrev.items():
        name = re.sub(pattern, replacement, name)
    return name

print("Normalizing names...")
df["name_clean"] = df["name"].apply(normalize_name)

# ─────────────────────────────────────────
# 3. EMBED NAMES
# ─────────────────────────────────────────
print("Loading embedding model...")
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

print("Embedding names... (takes ~1 min)")
embeddings = model.encode(df["name_clean"].tolist(), show_progress_bar=True)

# ─────────────────────────────────────────
# 4. CLUSTER
# ─────────────────────────────────────────
print("Clustering similar identities...")
clusterer = hdbscan.HDBSCAN(
    min_cluster_size=2,
    metric='euclidean',
    min_samples=1
)
df["cluster_id"] = clusterer.fit_predict(embeddings)

noise_mask = df["cluster_id"] == -1
df.loc[noise_mask, "cluster_id"] = range(
    df["cluster_id"].max() + 1,
    df["cluster_id"].max() + 1 + noise_mask.sum()
)

# ─────────────────────────────────────────
# 5. ASSIGN CANONICAL ID
# ─────────────────────────────────────────
print("Assigning canonical IDs...")

def pick_canonical_cnic(group):
    pattern = re.compile(r'^\d{5}-\d{7}-\d$')
    valid = group[group["cnic"].str.match(pattern)]
    if len(valid) > 0:
        return valid.iloc[0]["cnic"]
    return group.iloc[0]["cnic"]

canonical_map = (
    df.groupby("cluster_id")
    .apply(pick_canonical_cnic)
    .reset_index()
    .rename(columns={0: "canonical_cnic"})
)

df = df.merge(canonical_map, on="cluster_id", how="left")

# ─────────────────────────────────────────
# 6. OUTPUT
# ─────────────────────────────────────────
result = df[["cnic", "name", "name_clean", "canonical_cnic", "cluster_id"]]
result.to_csv("resolved_entities.csv", index=False)

resolved_json = []
for canonical, group in result.groupby("canonical_cnic"):
    resolved_json.append({
        "canonical_cnic": canonical,
        "all_cnics": group["cnic"].tolist(),
        "all_names": group["name"].tolist(),
        "cluster_id": int(group.iloc[0]["cluster_id"])
    })

with open("resolved_entities.json", "w", encoding="utf-8") as f:
    json.dump(resolved_json, f, ensure_ascii=False, indent=2)

print(f"\n✅ Done!")
print(f"   Total records     : {len(df)}")
print(f"   Unique identities : {df['canonical_cnic'].nunique()}")
print(f"   Clusters formed   : {df['cluster_id'].nunique()}")
print(f"   Saved → resolved_entities.csv + resolved_entities.json")

# ─────────────────────────────────────────
# 7. PRECISION/RECALL vs GROUND TRUTH
# ─────────────────────────────────────────
try:
    gt = pd.read_excel("GroundTruth.xlsx")
    gt.columns = gt.columns.str.strip().str.lower().str.replace(" ", "_")
    print("Ground Truth columns:", gt.columns.tolist())
    cnic_col = gt.columns[0]
    matched = gt[cnic_col].isin(df["canonical_cnic"])
    recall = matched.sum() / len(gt)
    print(f"\n📊 Ground Truth Check:")
    print(f"   Anomaly CNICs found : {matched.sum()}/{len(gt)}")
    print(f"   Entity Resolution Recall : {recall:.2%}")
except FileNotFoundError:
    print("\n⚠️  GroundTruth.xlsx not found — skipping evaluation")