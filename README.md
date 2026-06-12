# AI Data Investigator

A comprehensive monorepo for entity resolution, data validation, and interactive risk analysis visualization. Combines powerful Python-based backend AI/ML analysis with a modern React TypeScript frontend dashboard.

## 📁 Project Structure

```
ai-data-investigator/
├── ai-analysis/              # Backend - Python AI/ML analysis engine
│   ├── api.py               # API server
│   ├── main.py              # Entry point
│   ├── config.py            # Configuration
│   ├── entity_resolver.py   # Entity deduplication & linking
│   ├── data_validator.py    # Data validation logic
│   ├── data_merger.py       # Data merging utilities
│   ├── graph_builder.py     # Knowledge graph construction
│   ├── scoring_engine.py    # Entity scoring
│   ├── evaluate.py          # Evaluation metrics
│   └── [data files]         # CSV/JSON outputs
│
├── frontend/                 # Frontend - React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/           # Dashboard, Graph, Investigation, Risk Cases
│   │   ├── components/      # Reusable UI components
│   │   ├── layout/          # App layout & sidebar
│   │   ├── store/           # State management
│   │   └── data/            # Mock data
│   ├── vite.config.ts       # Vite configuration
│   ├── package.json
│   └── tsconfig.json
│
└── .gitignore              # Git ignore rules
```

## 🚀 Features

- **Entity Resolution**: Identify and merge duplicate entities across datasets
- **Data Validation**: Comprehensive data quality checking
- **Graph Visualization**: Interactive knowledge graph exploration
- **Risk Analysis**: Dashboard for risk case management and investigation
- **Scoring Engine**: ML-based entity scoring and matching

## 🛠️ Tech Stack

### Backend
- **Language**: Python
- **Framework**: Flask/FastAPI (see `api.py`)
- **ML**: Entity resolution, data validation, graph building

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **State Management**: Zustand (`useGraphStore`)

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd ai-analysis
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🏃 Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
cd ai-analysis
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build
```

## 📊 Data Flow

1. **Data Ingestion** → `data_merger.py`, `data_validator.py`
2. **Entity Resolution** → `entity_resolver.py`
3. **Graph Construction** → `graph_builder.py`
4. **Scoring** → `scoring_engine.py`
5. **API Exposure** → `api.py`
6. **Frontend Visualization** → React Dashboard

## 🔍 Main Components

| File | Purpose |
|------|---------|
| `entity_resolver.py` | Core entity matching & deduplication |
| `graph_builder.py` | Create knowledge graphs from resolved entities |
| `scoring_engine.py` | Score entity matches & relationships |
| `api.py` | REST API for frontend integration |
| `Dashboard.tsx` | Main visualization & analytics |
| `Graph.tsx` | Interactive graph explorer |
| `RiskCases.tsx` | Risk case management |
| `Investigation.tsx` | Detailed investigation interface |

## 📝 Environment Variables

Create `.env` file in root or respective folders:

```bash
# Backend
API_PORT=5000
DEBUG=True

# Frontend
VITE_API_URL=http://localhost:5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Umair Masood**
- GitHub: [@Umairmasood08](https://github.com/Umairmasood08)

---

## ❓ FAQ

**Q: Why isn't the `ai-analysis/` folder showing on GitHub?**

**A:** The `ai-analysis/` folder might not appear if:
1. ✅ **Files weren't staged/committed** - Run `git add ai-analysis/` then `git commit`
2. ✅ **Folder was in .gitignore** - Check `.gitignore` for exclusions
3. ✅ **Empty folders** - Git doesn't track empty directories (add `.gitkeep` if needed)

**Solution:**
```bash
# Add all files from ai-analysis
git add ai-analysis/

# Commit
git commit -m "Add AI analysis backend"

# Push
git push origin main
```

