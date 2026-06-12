import pandas as pd

# Load all xlsx files
persons    = pd.read_excel("Persons.xlsx")
vehicles   = pd.read_excel("Vehicles.xlsx")
utility    = pd.read_excel("UtilityBills.xlsx")
tax        = pd.read_excel("TaxReturn.xlsx")
properties = pd.read_excel("Properties.xlsx")
travel     = pd.read_excel("TravelLog.xlsx")

# Normalize column names
for df in [persons, vehicles, utility, tax, properties, travel]:
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

# Print all columns for debugging
print("Persons columns:",    persons.columns.tolist())
print("Vehicles columns:",   vehicles.columns.tolist())
print("Utility columns:",    utility.columns.tolist())
print("Tax columns:",        tax.columns.tolist())
print("Properties columns:", properties.columns.tolist())
print("Travel columns:",     travel.columns.tolist())

# Rename cnic columns to match
vehicles   = vehicles.rename(columns={"owner_cnic": "cnic"})
utility    = utility.rename(columns={"consumer_cnic": "cnic"})
tax        = tax.rename(columns={"filer_cnic": "cnic"})
properties = properties.rename(columns={"owner_cnic": "cnic"})
travel     = travel.rename(columns={"traveler_cnic": "cnic"})

# Merge everything on cnic
merged = persons.merge(vehicles,   on="cnic", how="left", suffixes=("", "_veh"))
merged = merged.merge(utility,     on="cnic", how="left", suffixes=("", "_util"))
merged = merged.merge(tax,         on="cnic", how="left", suffixes=("", "_tax"))
merged = merged.merge(properties,  on="cnic", how="left", suffixes=("", "_prop"))
merged = merged.merge(travel,      on="cnic", how="left", suffixes=("", "_trav"))

# Flag non-filers
if "tax_paid_pkr" in merged.columns:
    merged["is_non_filer"] = merged["tax_paid_pkr"].isna().astype(int)
else:
    merged["is_non_filer"] = 0

merged.to_csv("merged.csv", index=False)
print(f"\n✅ merged.csv created with {len(merged)} rows and {len(merged.columns)} columns")