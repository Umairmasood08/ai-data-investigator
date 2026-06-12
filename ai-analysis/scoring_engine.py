import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
import re
from difflib import SequenceMatcher

# ─────────────────────────────────────────
# 1. TRANSLITERATION & SIMILARITY HELPERS
# ─────────────────────────────────────────
URDU_TO_ENGLISH = {
    "محمد": "muhammad", "احمد": "ahmed", "علی": "ali", "خان": "khan", "اقبال": "iqbal",
    "سلمان": "salman", "حمزہ": "hamza", "بلال": "bilal", "عمر": "umar", "رضا": "raza",
    "طارق": "tariq", "فرحان": "farhan", "جنید": "junaid", "فیصل": "faisal", "وقاص": "waqas",
    "زين": "zain", "محمود": "mahmood", "قريشي": "qureshi", "باجوة": "bajwa", "ملك": "malik",
    "شيخ": "sheikh", "شاه": "shah", "دار": "dar", "اختر": "akhtar", "ظفر": "zafar", "بت": "butt"
}

def clean_name(name_str):
    if not isinstance(name_str, str):
        return ""
    name_str = name_str.lower().strip()
    words = name_str.split()
    translated = [URDU_TO_ENGLISH.get(w, w) for w in words]
    name_str = " ".join(translated)
    name_str = re.sub(r'[^\w\s]', '', name_str)
    name_str = re.sub(r'\s+', ' ', name_str)
    
    # Common abbreviations
    abbrev = {
        r'\bm\b': 'muhammad', r'\bu\b': 'usman', r'\ba\b': 'ahmed',
        r'\bz\b': 'zain', r'\bk\b': 'khalid', r'\bs\b': 'salman',
        r'\bf\b': 'faisal', r'\bh\b': 'hamza', r'\br\b': 'rizwan'
    }
    for pattern, replacement in abbrev.items():
        name_str = re.sub(pattern, replacement, name_str)
        
    phonetics = {
        "mehmood": "mahmood", "ahmad": "ahmed", "mohammad": "muhammad",
        "mohamed": "muhammad", "mian": "muhammad", "butt": "bat"
    }
    for orig, rep in phonetics.items():
        name_str = name_str.replace(orig, rep)
        
    return name_str.strip()

def is_name_mismatch(p_name, asset_name):
    if not asset_name or pd.isna(asset_name):
        return False
    n1 = clean_name(p_name)
    n2 = clean_name(asset_name)
    if not n1 or not n2:
        return False
    if n1 == n2:
        return False
        
    # Calculate Jaccard similarity on bigrams
    def get_bigrams(s):
        return set(s[i:i+2] for i in range(len(s)-1))
    b1, b2 = get_bigrams(n1), get_bigrams(n2)
    if not b1 or not b2:
        return True
    sim = len(b1 & b2) / len(b1 | b2)
    return sim < 0.65  # Mismatch if similarity is low

# ─────────────────────────────────────────
# 2. LOAD DATASETS
# ─────────────────────────────────────────
print("Loading datasets...")
persons = pd.read_excel("Persons.xlsx")
vehicles = pd.read_excel("Vehicles.xlsx")
utility = pd.read_excel("UtilityBills.xlsx")
tax = pd.read_excel("TaxReturn.xlsx")
properties = pd.read_excel("Properties.xlsx")
travel = pd.read_excel("TravelLog.xlsx")

# Standardize column headers
for df in [persons, vehicles, utility, tax, properties, travel]:
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

# Standardize CNICs
persons["cnic"] = persons["cnic"].astype(str).str.strip()
vehicles["owner_cnic"] = vehicles["owner_cnic"].astype(str).str.strip()
utility["consumer_cnic"] = utility["consumer_cnic"].astype(str).str.strip()
tax["filer_cnic"] = tax["filer_cnic"].astype(str).str.strip()
properties["owner_cnic"] = properties["owner_cnic"].astype(str).str.strip()
travel["traveler_cnic"] = travel["traveler_cnic"].astype(str).str.strip()

# ─────────────────────────────────────────
# 3. ENTITY RESOLUTION & NAME MISMATCHES
# ─────────────────────────────────────────
print("Analyzing name mismatches (Entity Resolution)...")
# Map cnic -> full_name
cnic_to_name = dict(zip(persons["cnic"], persons["full_name"]))

mismatches = {}
for cnic in persons["cnic"]:
    mismatches[cnic] = 0

# Check vehicles
for _, row in vehicles.iterrows():
    c = row["owner_cnic"]
    if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["owner_name"]):
        mismatches[c] += 1

# Check utility bills
for _, row in utility.iterrows():
    c = row["consumer_cnic"]
    if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["consumer_name"]):
        mismatches[c] += 1

# Check properties
for _, row in properties.iterrows():
    c = row["owner_cnic"]
    if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["owner_name"]):
        mismatches[c] += 1

# Check travel
for _, row in travel.iterrows():
    c = row["traveler_cnic"]
    if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["traveler_name"]):
        mismatches[c] += 1

persons["name_mismatch_count"] = persons["cnic"].map(mismatches)

# ─────────────────────────────────────────
# 4. GRAPH NETWORK FEATURES (Shared Address/Location)
# ─────────────────────────────────────────
print("Extracting Graph network features...")
# Map utility addresses to list of consumer CNICs
addr_to_cnics = {}
for _, row in utility.iterrows():
    addr = str(row["address"]).strip().lower()
    if addr and addr != "nan" and addr != "0":
        if addr not in addr_to_cnics:
            addr_to_cnics[addr] = set()
        addr_to_cnics[addr].add(row["consumer_cnic"])

# Map property locations to list of owner CNICs
loc_to_cnics = {}
for _, row in properties.iterrows():
    loc = str(row["location"]).strip().lower()
    if loc and loc != "nan" and loc != "0":
        if loc not in loc_to_cnics:
            loc_to_cnics[loc] = set()
        loc_to_cnics[loc].add(row["owner_cnic"])

# Calculate shared address counts for each person
shared_address_counts = {}
for cnic in persons["cnic"]:
    shared_address_counts[cnic] = 0

# Utility bills shared address
person_utility_addrs = utility.groupby("consumer_cnic")["address"].apply(list).to_dict()
for cnic, addrs in person_utility_addrs.items():
    max_shared = 0
    for a in addrs:
        addr_key = str(a).strip().lower()
        if addr_key in addr_to_cnics:
            max_shared = max(max_shared, len(addr_to_cnics[addr_key]))
    if max_shared > 1:
        shared_address_counts[cnic] = max(shared_address_counts[cnic], max_shared)

# Property locations shared address
person_property_locs = properties.groupby("owner_cnic")["location"].apply(list).to_dict()
for cnic, locs in person_property_locs.items():
    max_shared = 0
    for l in locs:
        loc_key = str(l).strip().lower()
        if loc_key in loc_to_cnics:
            max_shared = max(max_shared, len(loc_to_cnics[loc_key]))
    if max_shared > 1:
        shared_address_counts[cnic] = max(shared_address_counts[cnic], max_shared)

persons["shared_address_count"] = persons["cnic"].map(shared_address_counts)

# Identify non-filers (people who do not exist in TaxReturn.xlsx or have tax_paid_pkr == 0)
filer_cnics = set(tax[tax["tax_paid_pkr"] > 0]["filer_cnic"])
persons["is_non_filer"] = persons["cnic"].apply(lambda c: 0 if c in filer_cnics else 1)
non_filers_set = set(persons[persons["is_non_filer"] == 1]["cnic"])

# Community Risk: Count how many non-filers share physical space with each person
non_filer_neighbors = {}
for cnic in persons["cnic"]:
    non_filer_neighbors[cnic] = 0
    # Utility addresses
    addrs = person_utility_addrs.get(cnic, [])
    for a in addrs:
        addr_key = str(a).strip().lower()
        if addr_key in addr_to_cnics:
            count = sum(1 for neighbor in addr_to_cnics[addr_key] if neighbor in non_filers_set and neighbor != cnic)
            non_filer_neighbors[cnic] = max(non_filer_neighbors[cnic], count)
    # Property locations
    locs = person_property_locs.get(cnic, [])
    for l in locs:
        loc_key = str(l).strip().lower()
        if loc_key in loc_to_cnics:
            count = sum(1 for neighbor in loc_to_cnics[loc_key] if neighbor in non_filers_set and neighbor != cnic)
            non_filer_neighbors[cnic] = max(non_filer_neighbors[cnic], count)

persons["non_filer_neighbors"] = persons["cnic"].map(non_filer_neighbors)

# ─────────────────────────────────────────
# 5. ASSET AGGREGATION & LIFESTYLE FEATURES
# ─────────────────────────────────────────
print("Aggregating assets and wealth indicators...")

# Vehicle features
veh_agg = vehicles.groupby("owner_cnic").agg(
    max_cc=("engine_cc", "max"),
    veh_count=("vehicle_id", "count")
).reset_index()
persons = persons.merge(veh_agg, left_on="cnic", right_on="owner_cnic", how="left").fillna({"max_cc": 0, "veh_count": 0})
persons["vehicle_score"] = persons["max_cc"].apply(
    lambda x: 100 if x >= 2000 else (60 if x >= 1300 else (20 if x > 0 else 0))
)

# Utility features
util_agg = utility.groupby("consumer_cnic").agg(
    max_bill=("avg_monthly_bill_pkr", "max")
).reset_index()
persons = persons.merge(util_agg, left_on="cnic", right_on="consumer_cnic", how="left").fillna({"max_bill": 0})
persons["utility_score"] = persons["max_bill"].apply(
    lambda x: 100 if x >= 150000 else (60 if x >= 50000 else (20 if x > 0 else 0))
)

# Property features
prop_agg = properties.groupby("owner_cnic").agg(
    sum_prop_value=("estimated_value_pkr", "sum"),
    prop_count=("property_id", "count")
).reset_index()
persons = persons.merge(prop_agg, left_on="cnic", right_on="owner_cnic", how="left").fillna({"sum_prop_value": 0, "prop_count": 0})
persons["property_score"] = persons["sum_prop_value"].apply(
    lambda x: 100 if x >= 20000000 else (60 if x >= 5000000 else (20 if x > 0 else 0))
)

# Travel features
trav_agg = travel.groupby("traveler_cnic").agg(
    trip_count=("travel_id", "count"),
    biz_first_count=("travel_class", lambda x: sum(1 for c in x if str(c) in ["Business", "First"]))
).reset_index()
persons = persons.merge(trav_agg, left_on="cnic", right_on="traveler_cnic", how="left").fillna({"trip_count": 0, "biz_first_count": 0})
persons["travel_score"] = persons.apply(
    lambda r: 100 if r["biz_first_count"] > 0 else (50 if r["trip_count"] > 0 else 0),
    axis=1
)

# Tax returns features
tax_agg = tax.groupby("filer_cnic").agg(
    declared_income=("declared_income_pkr", "max"),
    tax_paid=("tax_paid_pkr", "sum")
).reset_index()
persons = persons.merge(tax_agg, left_on="cnic", right_on="filer_cnic", how="left").fillna({"declared_income": 0, "tax_paid": 0})

# Tax gap score (lifestyle discrepancy vs declared income)
persons["tax_gap_score"] = persons.apply(
    lambda r: 100 if r["is_non_filer"] == 1
    else (80 if r["declared_income"] < 500000 and (r["vehicle_score"] >= 60 or r["property_score"] >= 60) else 10),
    axis=1
)

# Lifestyle Index (weighted score of assets & spending)
persons["lifestyle_index"] = (
    persons["vehicle_score"]  * 0.20 +
    persons["utility_score"]  * 0.20 +
    persons["property_score"] * 0.25 +
    persons["travel_score"]   * 0.15 +
    persons["tax_gap_score"]  * 0.20
)

# ─────────────────────────────────────────
# 6. ISOLATION FOREST WITH GRAPH & ER FEATURES
# ─────────────────────────────────────────
print("Training Anomaly Model (Isolation Forest)...")
features = [
    "vehicle_score", "utility_score", "property_score",
    "travel_score", "tax_gap_score", "lifestyle_index",
    "name_mismatch_count", "shared_address_count", "non_filer_neighbors"
]

X = persons[features].fillna(0)
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

model = IsolationForest(
    n_estimators=300,
    contamination=0.16,  # 300 / 2000 anomalies is 15%
    random_state=42
)
model.fit(X_scaled)

# ML Anomaly Score (0-100)
raw_scores = model.decision_function(X_scaled)
persons["ml_anomaly_score"] = MinMaxScaler().fit_transform(
    (-raw_scores).reshape(-1, 1)
) * 100

# ─────────────────────────────────────────
# 7. FINAL TAX COMPLIANCE DEVIATION SCORE
# ─────────────────────────────────────────
# Compute deviation score (combining lifestyle discrepancy + ML anomaly score)
persons["tax_deviation_score"] = (
    persons["lifestyle_index"]  * 0.45 +
    persons["ml_anomaly_score"] * 0.55
).round(2)

# Flag anomalies based on target threshold
persons["flagged"] = (persons["tax_deviation_score"] >= 60).astype(int)

# ─────────────────────────────────────────
# 8. EXPLAINABLE AUDIT TRAIL GENERATION
# ─────────────────────────────────────────
def generate_audit(row):
    reasons = []
    if row["is_non_filer"] == 1:
        reasons.append("Non-Filer (No active tax filings recorded)")
    else:
        reasons.append(f"Filer with declared annual income PKR {int(row['declared_income']):,}")
        
    if row["veh_count"] > 0:
        reasons.append(f"Owns {int(row['veh_count'])} vehicle(s) (Max engine CC: {int(row['max_cc'])}cc)")
    if row["max_bill"] > 0:
        reasons.append(f"Monthly utility consumption: Max bill PKR {int(row['max_bill']):,}")
    if row["prop_count"] > 0:
        reasons.append(f"Owns {int(row['prop_count'])} property/properties (Total estimated value: PKR {int(row['sum_prop_value']):,})")
    if row["trip_count"] > 0:
        reasons.append(f"International travels logged: {int(row['trip_count'])} flight(s) ({int(row['biz_first_count'])} Business/First class)")
        
    # ER name mismatches
    if row["name_mismatch_count"] > 0:
        reasons.append(f"Entity Resolution Warning: {int(row['name_mismatch_count'])} asset records registered under conflicting name variations (Benami risk)")
        
    # Graph network warnings
    if row["shared_address_count"] > 1:
        reasons.append(f"Network Risk: Shares registered address with {int(row['shared_address_count'])-1} other individuals")
    if row["non_filer_neighbors"] > 0:
        reasons.append(f"Community Risk: Shares property space with {int(row['non_filer_neighbors'])} unregistered non-filers")
        
    return " | ".join(reasons) if reasons else "No anomalous lifestyle indicators flagged."

persons["audit_trail"] = persons.apply(generate_audit, axis=1)

# ─────────────────────────────────────────
# 9. EXPORT RESULTS & EVALUATION
# ─────────────────────────────────────────
output_cols = [
    "cnic", "full_name", "city",
    "vehicle_score", "utility_score", "property_score",
    "travel_score", "tax_gap_score", "lifestyle_index",
    "ml_anomaly_score", "tax_deviation_score",
    "flagged", "audit_trail"
]

result = persons[output_cols].drop_duplicates(subset="cnic").sort_values(
    "tax_deviation_score", ascending=False
)
result.to_csv("scored_entities.csv", index=False)

print(f"\n✅ Scoring pipeline complete!")
print(f"   Total persons scored : {len(result)}")
print(f"   Flagged as Anomaly   : {result['flagged'].sum()}")

try:
    gt = pd.read_excel("GroundTruth.xlsx")
    gt.columns = gt.columns.str.strip().str.lower().str.replace(" ", "_")
    gt_cnics = set(gt["canonical_cnic"].astype(str))
    flagged_cnics = set(result[result["flagged"]==1]["cnic"].astype(str))

    TP = len(gt_cnics & flagged_cnics)
    FP = len(flagged_cnics - gt_cnics)
    FN = len(gt_cnics - flagged_cnics)

    precision = TP / (TP + FP) if (TP + FP) > 0 else 0
    recall    = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1        = 2*precision*recall / (precision+recall) if (precision+recall) > 0 else 0

    print(f"\n📊 Evaluation vs Ground Truth:")
    print(f"   Precision : {precision:.2%}")
    print(f"   Recall    : {recall:.2%}")
    print(f"   F1 Score  : {f1:.2%}")
except Exception as e:
    print(f"\n⚠️ Ground truth evaluation skipped: {str(e)}")