@echo off
REM Windows batch script to start both services

echo.
echo 🚀 Starting AI Data Investigator monorepo...
echo.

REM Start backend in a new terminal
echo 📡 Starting FastAPI backend...
start cmd /k "cd ai-analysis && python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000"

REM Wait 3 seconds
timeout /t 3 /nobreak

REM Start frontend in a new terminal
echo ⚛️  Starting React frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Services started!
echo 📡 Backend: http://localhost:8000
echo ⚛️  Frontend: http://localhost:5173
echo 📖 API Docs: http://localhost:8000/docs
echo.
