import pandas as pd
from difflib import SequenceMatcher
from datetime import datetime
from collections import defaultdict

p = pd.read_excel('Persons.xlsx')

def normalize_dob(val):
    if pd.isna(val):
        return ""
    if isinstance(val, (int, float)):
        # Excel date serial
        return str(int(val))
    val_str = str(val).strip()
    try:
        # try to parse date string
        dt = datetime.strptime(val_str, "%d-%m-%Y")
        return dt.strftime("%Y%m%d")
    except:
        try:
            dt = datetime.strptime(val_str, "%Y-%m-%d %H:%M:%S")
            return dt.strftime("%Y%m%d")
        except:
            return val_str

p['dob_norm'] = p['dob'].apply(normalize_dob)

# Block by normalized DOB
dob_blocks = defaultdict(list)
for idx, row in p.iterrows():
    dob_blocks[row['dob_norm']].append(row)

duplicates = []
for dob, group in dob_blocks.items():
    if dob == "" or len(group) < 2:
        continue
    for i in range(len(group)):
        for j in range(i+1, len(group)):
            row_i = group[i]
            row_j = group[j]
            
            name_sim = SequenceMatcher(None, str(row_i['full_name']).lower(), str(row_j['full_name']).lower()).ratio()
            father_sim = SequenceMatcher(None, str(row_i['father_name']).lower(), str(row_j['father_name']).lower()).ratio()
            
            if name_sim > 0.85 and father_sim > 0.85:
                duplicates.append((row_i['cnic'], row_i['full_name'], row_i['father_name'], row_i['dob'],
                                   row_j['cnic'], row_j['full_name'], row_j['father_name'], row_j['dob'],
                                   name_sim, father_sim))

print(f"Strict duplicates found: {len(duplicates)}")
for d in duplicates:
    print(d)
