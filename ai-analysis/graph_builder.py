import pandas as pd
import json
from neo4j import GraphDatabase
from config import NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE
from scoring_engine import clean_name, is_name_mismatch

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# Load data
print("Loading data for Graph construction...")
persons = pd.read_excel("Persons.xlsx")
vehicles = pd.read_excel("Vehicles.xlsx")
utility = pd.read_excel("UtilityBills.xlsx")
properties = pd.read_excel("Properties.xlsx")
travel = pd.read_excel("TravelLog.xlsx")
tax = pd.read_excel("TaxReturn.xlsx")

# Standardize column headers
for df in [persons, vehicles, utility, properties, travel, tax]:
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

# Standardize CNICs
persons["cnic"] = persons["cnic"].astype(str).str.strip()
vehicles["owner_cnic"] = vehicles["owner_cnic"].astype(str).str.strip()
utility["consumer_cnic"] = utility["consumer_cnic"].astype(str).str.strip()
properties["owner_cnic"] = properties["owner_cnic"].astype(str).str.strip()
travel["traveler_cnic"] = travel["traveler_cnic"].astype(str).str.strip()

# Load scored output
try:
    scored = pd.read_csv("scored_entities.csv")
    scored["cnic"] = scored["cnic"].astype(str).str.strip()
    score_map = scored.set_index("cnic").to_dict(orient="index")
except FileNotFoundError:
    print("Warning: scored_entities.csv not found. Re-run scoring_engine.py first.")
    score_map = {}

def execute_write_query(query, params={}):
    with driver.session(database=NEO4J_DATABASE) as session:
        session.run(query, params).consume()

print("Clearing old Neo4j graph...")
execute_write_query("MATCH (n) DETACH DELETE n")

# Bulk Create Person nodes
print("Creating Person nodes in bulk...")
person_data = []
for _, row in persons.iterrows():
    cnic = row["cnic"]
    sd = score_map.get(cnic, {})
    person_data.append({
        "cnic": cnic,
        "name": str(row["full_name"]),
        "city": str(row["city"]),
        "phone": str(row["phone"]),
        "father_name": str(row["father_name"]),
        "dob": str(row["dob"]),
        "is_non_filer": int(sd.get("tax_gap_score", 10) == 100),
        "lifestyle": float(sd.get("lifestyle_index", 0.0)),
        "ml_anomaly": float(sd.get("ml_anomaly_score", 0.0)),
        "tax_deviation": float(sd.get("tax_deviation_score", 0.0)),
        "flagged": int(sd.get("flagged", 0)),
        "audit": str(sd.get("audit_trail", "No flags"))
    })

execute_write_query("""
    UNWIND $batch AS row
    MERGE (p:Person {cnic: row.cnic})
    SET p.name = row.name,
        p.city = row.city,
        p.phone = row.phone,
        p.father_name = row.father_name,
        p.dob = row.dob,
        p.is_non_filer = row.is_non_filer,
        p.lifestyle_index = row.lifestyle,
        p.ml_anomaly_score = row.ml_anomaly,
        p.tax_deviation_score = row.tax_deviation,
        p.flagged = row.flagged,
        p.audit_trail = row.audit
""", {"batch": person_data})

cnic_to_name = dict(zip(persons["cnic"], persons["full_name"]))

# Bulk Create Vehicle nodes
print("Creating Vehicle nodes...")
vehicle_data = []
for _, row in vehicles.iterrows():
    c = row["owner_cnic"]
    vehicle_data.append({
        "cnic": c,
        "vid": str(row["vehicle_id"]),
        "make": str(row["vehicle_make"]),
        "cc": int(row["engine_cc"]) if not pd.isna(row["engine_cc"]) else 0,
        "vtype": str(row["vehicle_type"]),
        "year": int(row["model_year"]) if not pd.isna(row["model_year"]) else 0,
        "owner_name": str(row["owner_name"]),
        "mismatch": 1 if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["owner_name"]) else 0
    })

execute_write_query("""
    UNWIND $batch AS row
    MERGE (v:Vehicle {vehicle_id: row.vid})
    SET v.make = row.make, v.engine_cc = row.cc,
        v.type = row.vtype, v.model_year = row.year,
        v.owner_name = row.owner_name
    WITH v, row
    MATCH (p:Person {cnic: row.cnic})
    MERGE (p)-[:OWNS]->(v)
    WITH p, v, row
    WHERE row.mismatch = 1
    MERGE (p)-[:NAME_MISMATCH_WARNING {reason: 'Name in excise database does not match CNIC profile'}]->(v)
""", {"batch": vehicle_data})

# Bulk Create Utility nodes
print("Creating Utility nodes...")
utility_data = []
for _, row in utility.iterrows():
    c = row["consumer_cnic"]
    utility_data.append({
        "cnic": c,
        "bid": str(row["bill_id"]),
        "bill": float(row["avg_monthly_bill_pkr"]) if not pd.isna(row["avg_monthly_bill_pkr"]) else 0.0,
        "address": str(row["address"]),
        "city": str(row["billing_city"]),
        "consumer_name": str(row["consumer_name"]),
        "mismatch": 1 if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["consumer_name"]) else 0
    })

execute_write_query("""
    UNWIND $batch AS row
    MERGE (u:Utility {bill_id: row.bid})
    SET u.monthly_bill = row.bill,
        u.address = row.address,
        u.city = row.city,
        u.consumer_name = row.consumer_name
    WITH u, row
    MATCH (p:Person {cnic: row.cnic})
    MERGE (p)-[:CONSUMES]->(u)
    WITH p, u, row
    WHERE row.mismatch = 1
    MERGE (p)-[:NAME_MISMATCH_WARNING {reason: 'Name on utility account does not match CNIC profile'}]->(u)
""", {"batch": utility_data})

# Bulk Create Property nodes
print("Creating Property nodes...")
property_data = []
for _, row in properties.iterrows():
    c = row["owner_cnic"]
    property_data.append({
        "cnic": c,
        "pid": str(row["property_id"]),
        "ptype": str(row["property_type"]),
        "area": float(row["area_sqft"]) if not pd.isna(row["area_sqft"]) else 0.0,
        "value": float(row["estimated_value_pkr"]) if not pd.isna(row["estimated_value_pkr"]) else 0.0,
        "loc": str(row["location"]),
        "owner_name": str(row["owner_name"]),
        "mismatch": 1 if c in cnic_to_name and is_name_mismatch(cnic_to_name[c], row["owner_name"]) else 0
    })

execute_write_query("""
    UNWIND $batch AS row
    MERGE (pr:Property {property_id: row.pid})
    SET pr.type = row.ptype, pr.area = row.area,
        pr.value = row.value, pr.location = row.loc,
        pr.owner_name = row.owner_name
    WITH pr, row
    MATCH (p:Person {cnic: row.cnic})
    MERGE (p)-[:OWNS_PROPERTY]->(pr)
    WITH p, pr, row
    WHERE row.mismatch = 1
    MERGE (p)-[:NAME_MISMATCH_WARNING {reason: 'Name on property registry does not match CNIC profile'}]->(pr)
""", {"batch": property_data})

# Bulk Create Travel nodes
print("Creating Travel nodes...")
travel_data = []
for _, row in travel.iterrows():
    c = row["traveler_cnic"]
    travel_data.append({
        "cnic": c,
        "tid": str(row["travel_id"]),
        "dest": str(row["destination_country"]),
        "tclass": str(row["travel_class"]),
        "price": float(row["ticket_price_pkr"]) if not pd.isna(row["ticket_price_pkr"]) else 0.0,
        "airline": str(row["airline"]),
        "traveler_name": str(row["traveler_name"])
    })

execute_write_query("""
    UNWIND $batch AS row
    MERGE (tr:Travel {travel_id: row.tid})
    SET tr.destination = row.dest,
        tr.class = row.tclass,
        tr.ticket_price = row.price,
        tr.airline = row.airline,
        tr.traveler_name = row.traveler_name
    WITH tr, row
    MATCH (p:Person {cnic: row.cnic})
    MERGE (p)-[:TRAVELS]->(tr)
""", {"batch": travel_data})

# Shared Address Relationships
print("Creating shared physical address relationships...")
shared_addr = []
# Shared utility address
addr_groups = utility.groupby("address")["consumer_cnic"].apply(list)
for addr, cnics in addr_groups.items():
    if not addr or str(addr).lower() == "nan" or str(addr) == "0":
        continue
    unique = list(set([str(c) for c in cnics]))
    if len(unique) > 1:
        for i in range(len(unique)):
            for j in range(i+1, len(unique)):
                shared_addr.append({"c1": unique[i], "c2": unique[j], "addr": str(addr), "src": "Utility"})

# Shared property location
loc_groups = properties.groupby("location")["owner_cnic"].apply(list)
for loc, cnics in loc_groups.items():
    if not loc or str(loc).lower() == "nan" or str(loc) == "0":
        continue
    unique = list(set([str(c) for c in cnics]))
    if len(unique) > 1:
        for i in range(len(unique)):
            for j in range(i+1, len(unique)):
                shared_addr.append({"c1": unique[i], "c2": unique[j], "addr": str(loc), "src": "Property"})

execute_write_query("""
    UNWIND $batch AS row
    MATCH (p1:Person {cnic: row.c1})
    MATCH (p2:Person {cnic: row.c2})
    MERGE (p1)-[r:SHARES_ADDRESS {address: row.addr, source: row.src}]->(p2)
""", {"batch": shared_addr})

print("\n✅ Knowledge Graph built successfully in Neo4j!")
driver.close()