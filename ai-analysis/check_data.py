from neo4j import GraphDatabase
import config

driver = GraphDatabase.driver(config.NEO4J_URI, auth=(config.NEO4J_USERNAME, config.NEO4J_PASSWORD))
with driver.session(database=config.NEO4J_DATABASE) as session:
    result = session.run("MATCH (p:Person) RETURN p LIMIT 1")
    record = result.single()
    if record:
        print("🔑 YOUR EXACT DATABASE KEYS ARE:")
        print(list(record["p"].keys()))
    else:
        print("No data found.")
driver.close()