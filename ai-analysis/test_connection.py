from neo4j import GraphDatabase

URI      = "neo4j+s://c5884cc0.databases.neo4j.io"
USERNAME = "c5884cc0"
PASSWORD = "8DxEeyaOhBmhUGhEvAz6L4JJRuXHFPz9drZiZGxUCxU"

try:
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    driver.verify_connectivity()
    print("✅ Connected successfully!")
    driver.close()
except Exception as e:
    print(f"❌ Error: {e}")