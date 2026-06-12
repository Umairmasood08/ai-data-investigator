import os

# Neo4j Graph Database Connection Settings
NEO4J_URI      = os.getenv("NEO4J_URI", "neo4j+s://c5884cc0.databases.neo4j.io")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "c5884cc0")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "8DxEeyaOhBmhUGhEvAz6L4JJRuXHFPz9drZiZGxUCxU")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "c5884cc0")

# Inference AI LLM Settings
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "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")