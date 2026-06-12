import requests
import json

url = "http://localhost:8000/api/graph/network?cnic=35203-8576250-5"
try:
    print(f"Fetching from {url}...")
    res = requests.get(url)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print(f"Total Nodes: {len(data.get('nodes', []))}")
        print(f"Total Edges: {len(data.get('edges', []))}")
        print("\nNodes:")
        print(json.dumps(data.get('nodes', [])[:5], indent=2))
        print("\nEdges:")
        print(json.dumps(data.get('edges', [])[:5], indent=2))
    else:
        print("Response:", res.text)
except Exception as e:
    print("Request failed:", e)
