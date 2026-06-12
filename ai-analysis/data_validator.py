import pandas as pd
import re

CNIC_PATTERN = re.compile(r'^\d{5}-\d{7}-\d{1}$')

def validate_table(filepath, required_cols, cnic_col):
    df = pd.read_csv(filepath)

    # Check 1: All required columns exist
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        print(f"MISSING COLUMNS: {missing}")

    # Check 2: CNIC format
    bad_cnics = df[~df[cnic_col].astype(str).str.match(CNIC_PATTERN)]
    print(f"Bad CNIC format: {len(bad_cnics)} rows")

    # Check 3: Null rate per column
    print(df.isnull().mean().round(3))

    # Check 4: Row count sanity
    print(f"Total rows: {len(df)}")

    return df