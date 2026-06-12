#!/bin/bash

# Start backend and frontend in parallel

echo "🚀 Starting AI Data Investigator monorepo..."

# Start backend
echo "📡 Starting FastAPI backend..."
cd ai-analysis
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
echo "⚛️  Starting React frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started!"
echo "📡 Backend: http://localhost:8000"
echo "⚛️  Frontend: http://localhost:5173"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services..."

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
