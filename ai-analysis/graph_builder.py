import pandas as pd
import json
from neo4j import GraphDatabase
from config import NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

def run_query(query, params={}):
    with driver.session(database=NEO4J_DATABASE) as session:
        session.run(query, params)

# Load data
print("Loading data...")
merged   = pd.read_csv("merged.csv").fillna(0)
resolved = pd.read_csv("resolved_entities.csv")

# Map cnic -> canonical_cnic
cnic_map = dict(zip(resolved["cnic"], resolved["canonical_cnic"]))

print("Clearing old graph...")
run_query("MATCH (n) DETACH DELETE n")

print("Creating Person nodes...")
persons = merged[["cnic","full_name","city","is_non_filer","is_anomaly"]].drop_duplicates(subset="cnic")
for _, row in persons.iterrows():
    canonical = cnic_map.get(str(row["cnic"]), str(row["cnic"]))
    run_query("""
        MERGE (p:Person {cnic: $cnic})
        SET p.name = $name,
            p.city = $city,
            p.canonical_cnic = $canonical,
            p.is_non_filer = $is_non_filer,
            p.is_anomaly = $is_anomaly
    """, {
        "cnic": str(row["cnic"]),
        "name": str(row["full_name"]),
        "city": str(row["city"]),
        "canonical": canonical,
        "is_non_filer": int(row["is_non_filer"]),
        "is_anomaly": int(row["is_anomaly"])
    })

print("Creating Vehicle nodes and relationships...")
vehicles = merged[merged["vehicle_id"] != 0][["cnic","vehicle_id","vehicle_make","engine_cc","vehicle_type","model_year"]].drop_duplicates(subset="vehicle_id")
for _, row in vehicles.iterrows():
    run_query("""
        MERGE (v:Vehicle {vehicle_id: $vid})
        SET v.make = $make, v.engine_cc = $cc,
            v.type = $vtype, v.model_year = $year
        WITH v
        MATCH (p:Person {cnic: $cnic})
        MERGE (p)-[:OWNS]->(v)
    """, {
        "vid": str(row["vehicle_id"]),
        "make": str(row["vehicle_make"]),
        "cc": int(row["engine_cc"]) if row["engine_cc"] != 0 else 0,
        "vtype": str(row["vehicle_type"]),
        "year": int(row["model_year"]) if row["model_year"] != 0 else 0,
        "cnic": str(row["cnic"])
    })

print("Creating Utility nodes and relationships...")
utility = merged[merged["bill_id"] != 0][["cnic","bill_id","avg_monthly_bill_pkr","address","billing_city"]].drop_duplicates(subset="bill_id")
for _, row in utility.iterrows():
    run_query("""
        MERGE (u:Utility {bill_id: $bid})
        SET u.monthly_bill = $bill,
            u.address = $address,
            u.city = $city
        WITH u
        MATCH (p:Person {cnic: $cnic})
        MERGE (p)-[:CONSUMES]->(u)
    """, {
        "bid": str(row["bill_id"]),
        "bill": float(row["avg_monthly_bill_pkr"]) if row["avg_monthly_bill_pkr"] != 0 else 0,
        "address": str(row["address"]),
        "city": str(row["billing_city"]),
        "cnic": str(row["cnic"])
    })

print("Creating TaxReturn nodes and relationships...")
tax = merged[merged["tax_paid_pkr"] != 0][["cnic","declared_income_pkr","tax_paid_pkr","tax_year","filing_status"]].drop_duplicates()
for _, row in tax.iterrows():
    run_query("""
        MERGE (t:TaxReturn {cnic: $cnic, tax_year: $year})
        SET t.declared_income = $income,
            t.tax_paid = $tax,
            t.filing_status = $status
        WITH t
        MATCH (p:Person {cnic: $cnic})
        MERGE (p)-[:FILED]->(t)
    """, {
        "cnic": str(row["cnic"]),
        "year": int(row["tax_year"]) if row["tax_year"] != 0 else 0,
        "income": float(row["declared_income_pkr"]),
        "tax": float(row["tax_paid_pkr"]),
        "status": str(row["filing_status"])
    })

print("Creating Property nodes and relationships...")
properties = merged[merged["property_id"] != 0][["cnic","property_id","property_type","area_sqft","estimated_value_pkr","location"]].drop_duplicates(subset="property_id")
for _, row in properties.iterrows():
    run_query("""
        MERGE (pr:Property {property_id: $pid})
        SET pr.type = $ptype, pr.area = $area,
            pr.value = $value, pr.location = $loc
        WITH pr
        MATCH (p:Person {cnic: $cnic})
        MERGE (p)-[:OWNS_PROPERTY]->(pr)
    """, {
        "pid": str(row["property_id"]),
        "ptype": str(row["property_type"]),
        "area": float(row["area_sqft"]) if row["area_sqft"] != 0 else 0,
        "value": float(row["estimated_value_pkr"]) if row["estimated_value_pkr"] != 0 else 0,
        "loc": str(row["location"]),
        "cnic": str(row["cnic"])
    })

print("Creating Travel nodes and relationships...")
travel = merged[merged["travel_id"] != 0][["cnic","travel_id","destination_country","travel_class","ticket_price_pkr","airline"]].drop_duplicates(subset="travel_id")
for _, row in travel.iterrows():
    run_query("""
        MERGE (tr:Travel {travel_id: $tid})
        SET tr.destination = $dest,
            tr.class = $tclass,
            tr.ticket_price = $price,
            tr.airline = $airline
        WITH tr
        MATCH (p:Person {cnic: $cnic})
        MERGE (p)-[:TRAVELS]->(tr)
    """, {
        "tid": str(row["travel_id"]),
        "dest": str(row["destination_country"]),
        "tclass": str(row["travel_class"]),
        "price": float(row["ticket_price_pkr"]) if row["ticket_price_pkr"] != 0 else 0,
        "airline": str(row["airline"]),
        "cnic": str(row["cnic"])
    })

print("Creating shared address relationships...")
addr_groups = merged[merged["address"] != 0].groupby("address")["cnic"].apply(list)
for addr, cnics in addr_groups.items():
    unique_cnics = list(set([str(c) for c in cnics]))
    if len(unique_cnics) > 1:
        for i in range(len(unique_cnics)):
            for j in range(i+1, len(unique_cnics)):
                run_query("""
                    MATCH (p1:Person {cnic: $c1})
                    MATCH (p2:Person {cnic: $c2})
                    MERGE (p1)-[:SHARES_ADDRESS {address: $addr}]->(p2)
                """, {"c1": unique_cnics[i], "c2": unique_cnics[j], "addr": str(addr)})

print("\n✅ Knowledge Graph built successfully!")
print("Open Neo4j Browser to explore: https://console.neo4j.io")
driver.close()