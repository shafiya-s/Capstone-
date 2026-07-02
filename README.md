# 🥗 FreshTrack AI - Smart Kitchen Inventory System

An AI-powered kitchen companion that tracks item shelf-life, evaluates kitchen health, and suggests personalized recipes to reduce food waste.

---

## 🔄 How It Works (Project Flow)

The application coordinates data flows across the frontend interface, Python FastAPI server, local SQLite database, and the Gemini AI engine.

### 1. Smart Inventory Flow
1. **Input**: You add a produce item (like *Banana* or *Tomato*).
2. **Auto-Calculate**: The system automatically determines its expiry date based on default shelf-life rules.
3. **Storage**: The item details are securely saved in a SQLite database.
4. **Display**: The dashboard updates with live visual badges:
   * 🟢 **Fresh** (> 2 days remaining)
   * 🟠 **Expiring Soon** (1–2 days remaining)
   * 🔴 **Expired** (0 or fewer days remaining)

### 2. AI Chat & Recipe Flow
1. **Query**: You ask the chatbot for recipe ideas or kitchen tips.
2. **Context**: The app sends your current inventory items alongside your question.
3. **AI Generation**: 
   * If a **Gemini API Key** is configured, Gemini generates personalized recipes using ingredients that are about to expire.
   * If no key is present, the app falls back to a smart rule-based local assistant.

### 3. Kitchen Health & Shopping Flow
1. **Analytics**: The app computes a **Kitchen Health Score** (0-100) based on the ratio of fresh to expired items.
2. **Replenishment**: Expired or expiring items are automatically suggested for your smart **Shopping List**.

---

## 🛠️ Technology Stack

* **Frontend**: React + TypeScript (Vite) & Vanilla CSS
* **Backend**: Python + FastAPI
* **Database**: SQLite + SQLAlchemy ORM
* **AI Engine**: Google Gemini API

---

## 📂 Directory Map

* 📂 **`backend/`** — Server setup, REST API endpoints, database schema, and shelf-life rule logic.
* 📂 **`frontend/`** — Interactive user interface, including Dashboard, Inventory list, AI chatbot, and Settings controls.

---

*Built with ❤️ for a waste-free, healthy kitchen.*

