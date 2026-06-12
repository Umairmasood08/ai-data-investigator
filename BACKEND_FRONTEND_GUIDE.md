# Backend & Frontend Connection Guide

## ✅ What's Been Set Up

### Backend (FastAPI)
- ✅ CORS enabled for frontend communication
- ✅ Running on `http://localhost:8000`
- ✅ API endpoints ready:
  - `GET /summary` - Dashboard stats
  - `GET /flagged` - Flagged entities
  - `GET /scores` - All scores
  - `GET /audit/ai/all-profiles` - AI audit reports

### Frontend (React)
- ✅ API client service created: `frontend/src/services/api.ts`
- ✅ Data hooks created: `frontend/src/hooks/useFetchData.ts`
- ✅ Zustand store updated with API integration
- ✅ Environment variables configured: `frontend/.env.local`

## 🚀 Quick Start

### Step 1: Install Dependencies

**Backend:**
```bash
cd ai-analysis
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Start Both Services

#### On Windows (Recommended - opens 2 terminals):
```bash
start-dev.bat
```

#### On macOS/Linux:
```bash
bash start-dev.sh
```

#### Or Start Manually:

**Terminal 1 (Backend):**
```bash
cd ai-analysis
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Step 3: Verify Connection

1. **Backend Health Check**: http://localhost:8000/
   - Should show: `{"status": "Tax Compliance Machine Learning API Running"}`

2. **API Documentation**: http://localhost:8000/docs
   - Interactive Swagger UI with all endpoints

3. **Frontend Dashboard**: http://localhost:5173
   - Should display data from backend

## 📝 Usage in Frontend Components

### Example 1: In a React Component
```tsx
import { useFetchDashboard } from "../hooks/useFetchData";

export function Dashboard() {
  const { loading, error, summary, flaggedEntities } = useFetchDashboard();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Total Taxpayers: {summary?.total_persons}</h1>
      <h2>Flagged Cases: {summary?.flagged}</h2>
    </div>
  );
}
```

### Example 2: Using the Store Directly
```tsx
import { useGraphStore } from "../store/useGraphStore";

export function MyComponent() {
  const { summary, flaggedEntities, loading, fetchAll } = useGraphStore();

  useEffect(() => {
    fetchAll(); // Load all data
  }, []);

  return <>{/* render data */}</>;
}
```

### Example 3: Custom Fetches
```tsx
import { useFetchAuditReports } from "../hooks/useFetchData";

export function AuditReports() {
  const { auditReports, loading, refetch } = useFetchAuditReports(20);

  return (
    <div>
      <button onClick={refetch}>Refresh Reports</button>
      {auditReports.map(report => (
        <div key={report.cnic}>{report.ai_audit_report}</div>
      ))}
    </div>
  );
}
```

## 🔧 Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
```

For production, set to your deployed backend URL:
```
VITE_API_URL=https://api.yourdomain.com
```

## 🐛 Troubleshooting

### Frontend can't reach backend?
- Check backend is running: `curl http://localhost:8000/`
- Verify API_URL in `.env.local`
- Check browser console for CORS errors

### Backend not loading CSV files?
- Ensure `scored_entities.csv` exists in `ai-analysis/`
- Check file path in `api.py` load_scored_matrix()

### Port already in use?
- Backend: `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows)
- Frontend: `lsof -i :5173` (macOS/Linux) or check `vite.config.ts`

## 📚 Next Steps

1. **Update Dashboard.tsx** to use `useFetchDashboard()` hook
2. **Update RiskCases.tsx** to use `useFetchFlaggedCases()` hook
3. **Update pages** to fetch real data instead of mock data
4. **Add loading states** and error handling
5. **Deploy** both services to production

## 📖 API Documentation

When running, view full API docs at: **http://localhost:8000/docs**

All endpoints are automatically documented with Swagger UI!
