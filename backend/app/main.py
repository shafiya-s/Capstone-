import os
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, crud, shelf_life

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FreshTrack AI API", description="AI-powered kitchen inventory assistant")

# CORS Middleware to support React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "time": datetime.datetime.now().isoformat()}

# Inventory CRUD endpoints

@app.get("/api/inventory", response_model=List[schemas.InventoryItemResponse])
def get_inventory(db: Session = Depends(get_db)):
    return crud.get_items(db)

@app.get("/api/inventory/{item_id}", response_model=schemas.InventoryItemResponse)
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@app.post("/api/inventory", response_model=schemas.InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item: schemas.InventoryItemCreate, db: Session = Depends(get_db)):
    if item.item_name not in shelf_life.SHELF_LIFE_DAYS:
        raise HTTPException(status_code=400, detail=f"Invalid produce name. Allowed: {', '.join(shelf_life.SHELF_LIFE_DAYS.keys())}")
    return crud.create_item(db, item)

@app.put("/api/inventory/{item_id}", response_model=schemas.InventoryItemResponse)
def update_inventory_item(item_id: int, item_update: schemas.InventoryItemUpdate, db: Session = Depends(get_db)):
    if item_update.item_name is not None and item_update.item_name not in shelf_life.SHELF_LIFE_DAYS:
         raise HTTPException(status_code=400, detail=f"Invalid produce name. Allowed: {', '.join(shelf_life.SHELF_LIFE_DAYS.keys())}")
    item = crud.update_item(db, item_id, item_update)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@app.delete("/api/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return

# Dashboard Metrics

@app.get("/api/dashboard", response_model=schemas.KitchenDashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    items = crud.get_items(db)
    
    expiring_soon_count = sum(1 for item in items if item["freshness_status"] == "Expiring Soon")
    expired_count = sum(1 for item in items if item["freshness_status"] == "Expired")
    
    kitchen_health_score = shelf_life.calculate_kitchen_health(items)
    
    # Use Today: remaining days <= 1 and remaining_days >= 0 (so and not expired, or critical)
    use_today = [item for item in items if item["remaining_days"] <= 1 and item["remaining_days"] >= 0]
    
    # Expiring soon
    expiring_soon = [item for item in items if item["freshness_status"] == "Expiring Soon"]
    
    # Waste alerts
    waste_alerts = [item for item in items if item["freshness_status"] == "Expired"]
    
    # Recent inventory
    recent_inventory = items[:5]
    
    return {
        "total_items": len(items),
        "kitchen_health_score": kitchen_health_score,
        "expiring_soon_count": expiring_soon_count,
        "expired_count": expired_count,
        "use_today": use_today,
        "expiring_soon": expiring_soon,
        "waste_alerts": waste_alerts,
        "recent_inventory": recent_inventory
    }

# Chat Interface with Gemini API Integration

@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_with_freshtrack(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    # 1. Fetch current kitchen inventory to give context to the assistant
    items = crud.get_items(db)
    health_score = shelf_life.calculate_kitchen_health(items)
    
    inventory_summary = []
    expiring_items = []
    expired_items = []
    
    for item in items:
        summary_str = f"- {item['item_name']} ({item['quantity']} {item['unit']}): Purchased on {item['purchase_date']}, {item['remaining_days']} days left. Status: {item['freshness_status']}"
        inventory_summary.append(summary_str)
        if item['freshness_status'] == "Expiring Soon":
            expiring_items.append(item['item_name'])
        elif item['freshness_status'] == "Expired":
            expired_items.append(item['item_name'])
            
    inventory_context = "\n".join(inventory_summary) if inventory_summary else "No items currently in inventory."
    
    # Try importing and using google-generativeai if key is set
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            
            # Setup model and prompt
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            system_instruction = (
                "You are FreshTrack AI, a smart kitchen inventory assistant. "
                "Your goal is to help users manage their produce, suggest recipes to reduce food waste, "
                "give tips on extending shelf life, and answer questions. "
                f"The user's current Kitchen Health Score is {health_score}/100. "
                f"Here is their current kitchen inventory:\n{inventory_context}\n\n"
                "Provide helpful, concise, and modern responses in markdown."
            )
            
            # Build conversation context from request history
            messages = [{"role": "user" if m.sender == "user" else "model", "parts": [m.message]} for m in request.history]
            messages.append({"role": "user", "parts": [f"[System Instruction: {system_instruction}]\n\nUser Question: {request.message}"]})
            
            response = model.generate_content(messages)
            return {
                "reply": response.text,
                "timestamp": datetime.datetime.now()
            }
        except Exception as e:
            # If Gemini fails, log it and fall back to local rule-based response
            print(f"Gemini API failure: {e}")
            
    # Local fallback rule-based responses
    msg_lower = request.message.lower()
    
    if "recipe" in msg_lower or "cook" in msg_lower or "eat" in msg_lower:
        if expiring_items:
            items_str = ", ".join(expiring_items)
            reply = (
                f"Based on your kitchen inventory, you should use **{items_str}** today since they are expiring soon! "
                f"Here are a few quick recipe ideas:\n\n"
                f"1. **Quick Produce Stir-fry**: Clean and sauté your `{items_str}` with garlic, olive oil, and soy sauce.\n"
                f"2. **Fresh Track Salad**: Toss fresh ingredients together with a splash of lemon juice and black pepper.\n"
                f"3. **Smoothie Boost**: If you have fruits like Bananas or Strawberries, blend them with a cup of yogurt/milk."
            )
        elif items:
            items_str = ", ".join([it['item_name'] for it in items[:3]])
            reply = (
                f"You have a healthy kitchen! You could prepare a fresh dish using your **{items_str}**.\n\n"
                "Would you like a specific recipe for any of these?"
            )
        else:
            reply = "Your kitchen is currently empty! Go to **Add Item** to log your fresh produce first, and I will recommend recipes based on what you have."
            
    elif "health" in msg_lower or "score" in msg_lower or "waste" in msg_lower:
        if health_score == 100:
            reply = (
                f"Your Kitchen Health Score is **{health_score}/100**! Outstanding job. "
                "All your produce is perfectly fresh and stored well. Keep it up to prevent food waste!"
            )
        elif health_score >= 80:
            reply = (
                f"Your Kitchen Health Score is **{health_score}/100**. You have a few items expiring soon "
                f"({', '.join(expiring_items)}). Try to plan a meal around them today to keep your score high!"
            )
        else:
            reply = (
                f"Your Kitchen Health Score is **{health_score}/100**. This is due to expired items "
                f"({', '.join(expired_items)}) and expiring soon items ({', '.join(expiring_items)}).\n\n"
                "**Tips to recover your score:**\n"
                "- Remove or mark as consumed the expired items.\n"
                "- Plan your next meal to consume the items expiring soon."
            )
            
    elif "hello" in msg_lower or "hi" in msg_lower:
        reply = (
            f"Hello! I am **FreshTrack AI**, your smart kitchen assistant.\n\n"
            f"Currently, you have **{len(items)} items** in inventory and a Kitchen Health Score of **{health_score}/100**.\n"
            "How can I help you manage your kitchen today? You can ask me for recipes, shelf-life tips, or waste reduction strategies."
        )
    else:
        # Generic response with storage tips
        reply = (
            "I'm here to help you manage your fresh produce inventory! Here is a general kitchen tip:\n\n"
            "**Ethylene Gas Tip**: Keep bananas, tomatoes, and avocados separate from leafy greens like coriander. "
            "They release ethylene gas, which will make your greens rot much faster!\n\n"
            "Ask me about: \n"
            "- *Recipes using my expiring food*\n"
            "- *How to improve my kitchen health score*\n"
            "- *Best storage practices for strawberries or grapes*"
        )
        
    return {
        "reply": reply,
        "timestamp": datetime.datetime.now()
    }
