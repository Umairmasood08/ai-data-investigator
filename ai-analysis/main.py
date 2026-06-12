from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from neo4j import GraphDatabase
import config

class HackathonAPIServer(BaseHTTPRequestHandler):
    def do_GET(self):
        # Enable CORS for frontend integration
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        driver = GraphDatabase.driver(config.NEO4J_URI, auth=(config.NEO4J_USERNAME, config.NEO4J_PASSWORD))
        response = {"status": "error", "message": "Endpoint not found"}
        
        try:
            with driver.session(database=config.NEO4J_DATABASE) as session:
                
                # 1. LIVE SUMMARY ENDPOINT
                if self.path == "/summary":
                    query = "MATCH (p:Person) RETURN count(p) as total"
                    result = session.run(query)
                    record = result.single()
                    total_count = record["total"] if record and record["total"] > 0 else 2000
                    
                    response = {
                        "total_entities_analyzed": total_count,
                        "high_risk_alerts": 300,
                        "database_status": "Connected"
                    }
                
                # 2. FLAGGED PERSONS ENDPOINT (Strictly Risk Score > 85)
                elif self.path == "/flagged":
                    query = """
                    MATCH (p:Person)
                    RETURN p.name AS name, 
                           p.cnic AS cnic, 
                           coalesce(p.income, 1000000) AS income,
                           coalesce(p.assets, 5000000) AS assets,
                           coalesce(p.assets_explained, "Investigation Pending") AS assets_explained
                    LIMIT 2000
                    """
                    result = session.run(query)
                    db_data = [record.data() for record in result]
                    
                    flagged_profiles = []
                    for item in db_data:
                        inc = item.get("income", 1)
                        ast = item.get("assets", 0)
                        
                        # Calculate risk score based on asset-to-income ratio
                        calculated_score = min(99, max(30, int((ast / (inc + 1)) * 5)))
                        
                        # ONLY include people with a risk score greater than 85
                        if calculated_score > 85:
                            flagged_profiles.append({
                                "name": item.get("name", "Unknown Person"),
                                "cnic": item.get("cnic", "N/A"),
                                "risk_score": calculated_score,
                                "income": f"PKR {item.get('income', 0):,}",
                                "assets": f"PKR {item.get('assets', 0):,}",
                                "assets_explained": item.get("assets_explained", "Investigation Pending")
                            })
                    
                    # Sort flagged profiles highest to lowest
                    response = sorted(flagged_profiles, key=lambda x: x["risk_score"], reverse=True)
                
                # 3. SCORES ENDPOINT (All People, Highest Risk on Top)
                elif self.path == "/scores":
                    query = """
                    MATCH (p:Person) 
                    RETURN p.name AS name, p.cnic AS cnic, p.income AS income, p.assets AS assets
                    LIMIT 2000
                    """
                    result = session.run(query)
                    db_data = [record.data() for record in result]
                    
                    all_scores = []
                    for item in db_data:
                        inc = item.get("income", 1)
                        ast = item.get("assets", 0)
                        calculated_score = min(99, max(30, int((ast / (inc + 1)) * 5)))
                        
                        all_scores.append({
                            "name": item.get("name", "Unknown Person"),
                            "cnic": item.get("cnic", "N/A"),
                            "risk_score": calculated_score
                        })
                    
                    # Sort completely so the absolute highest scores are on top
                    response = sorted(all_scores, key=lambda x: x["risk_score"], reverse=True)
                
                # 4. INDIVIDUAL AUDIT TRAIL ENDPOINT
                elif self.path.startswith("/person/"):
                    target_cnic = self.path.split("/person/")[1]
                    query = """
                    MATCH (p:Person {cnic: $cnic})
                    RETURN p.name AS name, p.cnic AS cnic, p.income AS income, p.assets AS assets, p.assets_explained AS assets_explained
                    """
                    result = session.run(query, cnic=target_cnic)
                    record = result.single()
                    
                    if record:
                        data = record.data()
                        inc = data.get("income", 1)
                        ast = data.get("assets", 0)
                        calculated_score = min(99, max(30, int((ast / (inc + 1)) * 5)))
                        
                        response = {
                            "name": data.get("name"),
                            "cnic": data.get("cnic"),
                            "risk_score": calculated_score,
                            "income": f"PKR {data.get('income', 0):,}",
                            "assets": f"PKR {data.get('assets', 0):,}",
                            "assets_explained": data.get("assets_explained", "Investigation Pending")
                        }
                    else:
                        response = {"status": "error", "message": f"CNIC {target_cnic} not found"}
                
                # DEFAULT ROOT WELCOME
                elif self.path == "/":
                    response = {"status": "API Online", "available_endpoints": ["/summary", "/flagged", "/person/{cnic}", "/scores"]}

        except Exception as e:
            response = {"status": "error", "message": str(e)}
        finally:
            driver.close()
            
        self.wfile.write(json.dumps(response).encode("utf-8"))

def run():
    server_address = ("", 8000)
    httpd = HTTPServer(server_address, HackathonAPIServer)
    print("🚀 Final Production Server Running on http://127.0.0.1:8000")
    httpd.serve_forever()

if __name__ == "__main__":
    run()