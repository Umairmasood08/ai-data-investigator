import sys
import os
from neo4j import GraphDatabase
import config

cnic = "35203-8576250-5"
print("=== DIAGNOSTIC REPORT ===")
print("Python version:", sys.version)

try:
    import neo4j
    print("neo4j driver version:", neo4j.__version__)
except Exception as e:
    print("Could not get neo4j version:", e)

driver = GraphDatabase.driver(config.NEO4J_URI, auth=(config.NEO4J_USERNAME, config.NEO4J_PASSWORD))
try:
    with driver.session(database=config.NEO4J_DATABASE) as session:
        # Check node
        res_p = session.run("MATCH (p:Person {cnic: $cnic}) RETURN p", cnic=cnic)
        records_p = list(res_p)
        if not records_p:
            print("No Person node found in Neo4j!")
        else:
            p_node = records_p[0]["p"]
            print("Person node properties:", dict(p_node))
            print("Has element_id attribute:", hasattr(p_node, "element_id"))
            if hasattr(p_node, "element_id"):
                print("element_id value:", p_node.element_id)
            print("Has id attribute:", hasattr(p_node, "id"))
            
        # Check assets optional match query
        query = """
        MATCH (p:Person {cnic: $cnic})
        OPTIONAL MATCH (p)-[r]->(a)
        RETURN p, r, a
        """
        res_assets = session.run(query, cnic=cnic)
        records_assets = list(res_assets)
        print("Total assets records returned:", len(records_assets))
        for idx, rec in enumerate(records_assets):
            p = rec["p"]
            r = rec["r"]
            a = rec["a"]
            if r is None:
                print(f"Record {idx}: r is None, a is None")
            else:
                print(f"Record {idx}: rel_type={r.type}, asset_labels={list(a.labels)}, r.element_id={r.element_id if hasattr(r, 'element_id') else 'N/A'}")
finally:
    driver.close()
