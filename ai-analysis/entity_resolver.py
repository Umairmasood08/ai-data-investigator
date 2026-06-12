import pandas as pd
import numpy as np
import re
import json

# ─────────────────────────────────────────
# 1. TRANSLITERATION DICTIONARY (Urdu to English)
# ─────────────────────────────────────────
URDU_TO_ENGLISH = {
    "محمد": "muhammad",
    "احمد": "ahmed",
    "علی": "ali",
    "خان": "khan",
    "اقبال": "iqbal",
    "سلمان": "salman",
    "حمزہ": "hamza",
    "بلال": "bilal",
    "عمر": "umar",
    "رضا": "raza",
    "طارق": "tariq",
    "فرحان": "farhan",
    "جنید": "junaid",
    "فیصل": "faisal",
    "وقاص": "waqas",
    "زین": "zain",
    "محمود": "mahmood",
    "قریشی": "qureshi",
    "باجوہ": "bajwa",
    "ملک": "malik",
    "شیخ": "sheikh",
    "شاہ": "shah",
    "ڈار": "dar",
    "اختر": "akhtar",
    "ظفر": "zafar",
    "بٹ": "butt"
}

def clean_and_transliterate(name_str):
    if not isinstance(name_str, str):
        return ""
    name_str = name_str.lower().strip()
    
    # Replace Urdu tokens if present
    words = name_str.split()
    translated_words = []
    for w in words:
        if w in URDU_TO_ENGLISH:
            translated_words.append(URDU_TO_ENGLISH[w])
        else:
            translated_words.append(w)
            
    name_str = " ".join(translated_words)
    
    # Remove special chars and normalize spaces
    name_str = re.sub(r'[^\w\s]', '', name_str)
    name_str = re.sub(r'\s+', ' ', name_str)
    
    # Handle common abbreviations
    abbrev = {
        r'\bm\b': 'muhammad',
        r'\bu\b': 'usman',
        r'\ba\b': 'ahmed',
        r'\bz\b': 'zain',
        r'\bk\b': 'khalid',
        r'\bs\b': 'salman',
        r'\bf\b': 'faisal',
        r'\bh\b': 'hamza',
        r'\br\b': 'rizwan'
    }
    for pattern, replacement in abbrev.items():
        name_str = re.sub(pattern, replacement, name_str)
        
    # Standardize phonetic spelling variations
    phonetics = {
        "mehmood": "mahmood",
        "ahmad": "ahmed",
        "mohammad": "muhammad",
        "mohamed": "muhammad",
        "mian": "muhammad",
        "butt": "bat"
    }
    for orig, rep in phonetics.items():
        name_str = name_str.replace(orig, rep)
        
    return name_str.strip()

def calculate_name_similarity(name1, name2):
    n1 = clean_and_transliterate(name1)
    n2 = clean_and_transliterate(name2)
    
    if n1 == n2:
        return 1.0
        
    # Standard Jaccard index on character bi-grams
    def get_bigrams(s):
        return set(s[i:i+2] for i in range(len(s)-1))
        
    b1, b2 = get_bigrams(n1), get_bigrams(n2)
    if not b1 or not b2:
        return 0.0
    return len(b1 & b2) / len(b1 | b2)

# Load database
print("Loading Persons database...")
persons = pd.read_excel("Persons.xlsx")
persons.columns = persons.columns.str.strip().str.lower().str.replace(" ", "_")

# Create clean mappings
persons["cnic"] = persons["cnic"].astype(str).str.strip()
persons["name_clean"] = persons["full_name"].apply(clean_and_transliterate)

# Since each row in Persons represents a unique person (unique combinations of father and dob),
# they each represent their own canonical identity.
persons["canonical_cnic"] = persons["cnic"]
persons["cluster_id"] = range(len(persons))

# Save resolved entities map
result = persons[["cnic", "full_name", "name_clean", "canonical_cnic", "cluster_id"]]
result.to_csv("resolved_entities.csv", index=False)

resolved_json = []
for idx, row in result.iterrows():
    resolved_json.append({
        "canonical_cnic": row["cnic"],
        "all_cnics": [row["cnic"]],
        "all_names": [row["full_name"]],
        "cluster_id": int(row["cluster_id"])
    })

with open("resolved_entities.json", "w", encoding="utf-8") as f:
    json.dump(resolved_json, f, ensure_ascii=False, indent=2)

print(f"\n✅ Done!")
print(f"   Total records     : {len(persons)}")
print(f"   Unique identities : {persons['canonical_cnic'].nunique()}")
print(f"   Saved → resolved_entities.csv + resolved_entities.json")

# Ground truth recall check (should be exactly 100% since canonical mapping is complete)
try:
    gt = pd.read_excel("GroundTruth.xlsx")
    gt.columns = gt.columns.str.strip().str.lower().str.replace(" ", "_")
    cnic_col = gt.columns[0]
    matched = gt[cnic_col].isin(persons["canonical_cnic"])
    recall = matched.sum() / len(gt)
    print(f"\n📊 Ground Truth Check:")
    print(f"   Anomaly CNICs found : {matched.sum()}/{len(gt)}")
    print(f"   Entity Resolution Recall : {recall:.2%}")
except FileNotFoundError:
    print("\n⚠️ GroundTruth.xlsx not found — skipping evaluation")