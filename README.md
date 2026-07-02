# 🥗 FreshTrack AI - Smart Kitchen Inventory System

> An AI-powered kitchen management assistant that tracks produce freshness, reduces food waste, and helps you maintain a healthy, well-managed kitchen.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📦 **Smart Inventory** | Track fresh fruits and vegetables with real-time shelf life tracking |
| 🤖 **AI Chat Assistant** | Ask FreshTrack for recipes, storage tips, and waste analysis (Gemini API ready) |
| 📊 **Kitchen Health Score** | Dynamic 0–100 score based on freshness distribution |
| 🛒 **Shopping Assistant** | Auto-generated shopping list based on missing or expired produce |
| 📅 **Freshness Tracking** | Visual badges and progress bars for Fresh / Expiring / Expired status |
| 📱 **Responsive Design** | Works beautifully on desktop and mobile screens |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript (Vite) |
| **Backend** | Python 3.14 + FastAPI + SQLAlchemy |
| **Database** | SQLite (`kitchen.db`) |
| **Styling** | Vanilla CSS (custom design system) |
| **AI Integration** | Gemini API (optional, with local fallback) |

---

## 📁 Project Structure

```
Capstone/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app, routes, CORS, chat endpoint
│   │   ├── database.py         # SQLAlchemy connection + session management
│   │   ├── models.py           # ORM model for Inventory table
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── crud.py             # Database CRUD operations
│   │   └── shelf_life.py       # Shelf life data + freshness logic
│   ├── requirements.txt
│   ├── kitchen.db              # SQLite database (auto-created on first run)
│   └── .venv/
│
└── frontend/                   # React TypeScript frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx       # Overview with KPI cards and widgets
    │   │   ├── AddItem.tsx         # Add/edit produce form
    │   │   ├── Inventory.tsx       # Card grid inventory with filters
    │   │   ├── AskFreshTrack.tsx   # AI chatbot interface
    │   │   ├── Shopping.tsx        # Smart shopping recommendations
    │   │   ├── KitchenHealth.tsx   # Health score and freshness chart
    │   │   └── Settings.tsx        # API key, seeding, reset controls
    │   ├── App.tsx                 # Main app shell + routing state
    │   ├── types.ts                # TypeScript interfaces
    │   ├── index.css               # Global design system + styles
    │   ├── App.css                 # Scrollbar and overlay styles
    │   └── main.tsx                # React entry point
    └── package.json
```

---

## 🚀 Quick Start

### 1. Start the Backend

```powershell
# Install Python dependencies (first time only)
d:\Capstone\backend\.venv\Scripts\python.exe -m pip install -r d:\Capstone\backend\requirements.txt

# Start the FastAPI backend server
d:\Capstone\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at: **http://localhost:8000**
API docs (Swagger UI): **http://localhost:8000/docs**

### 2. Start the Frontend

```powershell
cd d:\Capstone\frontend
npm install        # First time only
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 🧩 Shelf Life Configuration

| Produce | Shelf Life (Days) |
|---|---|
| 🍌 Banana | 5 |
| 🍅 Tomato | 7 |
| 🌿 Coriander | 3 |
| 🥭 Mango | 6 |
| 🍓 Strawberry | 4 |
| 🥑 Avocado | 5 |
| 🍇 Grapes | 7 |
| 🥒 Cucumber | 7 |
| 🌶️ Green Chilli | 10 |
| 🍋 Lemon | 14 |

---

## 🎯 Freshness Status Rules

| Condition | Status | Color |
|---|---|---|
| Remaining Days > 2 | **Fresh** | 🟢 Green |
| Remaining Days 1–2 | **Expiring Soon** | 🟠 Orange |
| Remaining Days ≤ 0 | **Expired** | 🔴 Red |

---

## 🤖 AI Integration (Gemini API)

By default, FreshTrack AI uses a **built-in rule-based system** for the chat assistant.

To upgrade to real Gemini AI responses:
1. Open the **Settings** page
2. Paste your **Google Gemini API key** (`AIzaSy...`)
3. Click **Save Key** — it's stored in your browser localStorage
4. The backend reads `GEMINI_API_KEY` environment variable on the server side

```powershell
# Optionally set in your terminal before starting the backend:
$env:GEMINI_API_KEY = "your_api_key_here"
d:\Capstone\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

---

## 🧪 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/inventory` | List all inventory items |
| POST | `/api/inventory` | Add a new item |
| PUT | `/api/inventory/{id}` | Update an item |
| DELETE | `/api/inventory/{id}` | Delete an item |
| GET | `/api/dashboard` | Get KPI metrics for dashboard |
| POST | `/api/chat` | Send message to AI assistant |

---

## 🔮 Future AI Features (Roadmap)

- [ ] Gemini Vision API image recognition (scan produce photo)
- [ ] Barcode scanning for packaged goods
- [ ] Voice assistant integration
- [ ] Predictive expiry from purchase patterns
- [ ] Personalized recipe generation
- [ ] Grocery delivery integration

---

*Built with ❤️ using React, FastAPI, and FreshTrack AI*
