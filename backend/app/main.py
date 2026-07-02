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
            
    # ── Rich rule-based fallback chat engine ──────────────────────────────────
    msg_lower = request.message.lower()

    # Helper snippets
    inv_list = ", ".join([it['item_name'] for it in items]) if items else "nothing yet"
    expiring_str = ", ".join(expiring_items) if expiring_items else "none"
    expired_str  = ", ".join(expired_items)  if expired_items  else "none"

    # ── Greeting ──
    if any(w in msg_lower for w in ["hello", "hi", "hey", "good morning", "good evening"]):
        if health_score == 100:
            status_line = f"Your kitchen is in **perfect health** (score: {health_score}/100) 🎉"
        elif expired_items:
            status_line = f"⚠️ Heads up — you have **{len(expired_items)} expired item(s)** ({expired_str}). Score: {health_score}/100."
        else:
            status_line = f"Your Kitchen Health Score is **{health_score}/100**."

        reply = (
            f"👋 Hey! I'm **FreshTrack AI**, your smart kitchen assistant.\n\n"
            f"{status_line}\n\n"
            f"You currently have **{len(items)} item(s)** in inventory: {inv_list}.\n\n"
            "**What can I help with?**\n"
            "- 🍳 *Suggest a recipe using my expiring items*\n"
            "- 📊 *How do I improve my kitchen health score?*\n"
            "- 🥑 *How do I store avocados properly?*\n"
            "- 🛒 *What should I buy this week?*"
        )

    # ── Recipe / Cook / Meal ideas ──
    elif any(w in msg_lower for w in ["recipe", "cook", "meal", "eat", "dish", "make", "prepare", "food idea"]):
        import re
        words_in_msg = set(re.findall(r'\b\w+\b', msg_lower))

        known_recipes = {
            "banana": "🍌 **Banana Smoothie**: Blend 2 bananas, 1 cup milk, 1 tbsp honey, and ice. Or bake **Banana Bread** if they are very ripe!",
            "tomato": "🍅 **Quick Tomato Pasta**: Sauté garlic in olive oil, add chopped tomatoes, salt, and basil. Toss with pasta. Or blend into a fresh **Tomato Soup**.",
            "coriander": "🌿 **Coriander Chutney**: Blend coriander, green chilli, garlic, lemon juice, and salt into a smooth paste. Perfect for sandwiches!",
            "mango": "🥭 **Mango Lassi**: Blend 1 ripe mango, ½ cup yogurt, 2 tbsp sugar, and a pinch of cardamom. Or chop into a fresh **Mango Salsa**.",
            "strawberry": "🍓 **Strawberry Jam**: Simmer 1 cup strawberries with 2 tbsp sugar and a squeeze of lemon for 15 min. Or toss in a **Strawberry Spinach Salad**.",
            "avocado": "🥑 **Avocado Toast**: Mash avocado with salt, lemon, and chilli flakes on toasted bread. Or blend into a creamy **Guacamole**.",
            "grapes": "🍇 **Frozen Grape Snack**: Wash grapes and freeze them for 2 hours — a refreshing healthy snack! Or add them to a fruit salad.",
            "cucumber": "🥒 **Cucumber Raita**: Mix sliced cucumber, yogurt, cumin powder, and salt. Serve chilled. Or make a crunchy **Cucumber Salad** with dill.",
            "green chilli": "🌶️ **Chilli Garlic Noodles**: Sauté minced garlic and green chillies in sesame oil, toss with boiled noodles and soy sauce.",
            "lemon": "🍋 **Fresh Lemonade**: Squeeze juice of 2 lemons, mix with 3 tbsp sugar and 2 cups water. Or make a **Lemon Herb Vinaigrette** for salads.",
            "chicken": "🍗 **Easy Garlic Butter Chicken**: Pan-sear chicken breast or thighs with butter, minced garlic, rosemary, salt, and black pepper until golden and cooked through.",
            "potato": "🥔 **Crispy Garlic Rosemary Potatoes**: Toss cubed potatoes with olive oil, salt, garlic powder, and rosemary. Bake at 200°C (400°F) for 35 mins.",
            "apple": "🍎 **Cinnamon Baked Apples**: Core apples, fill with brown sugar, butter, and cinnamon, then bake at 180°C (350°F) for 30 minutes. Serve with vanilla ice cream!",
            "egg": "🍳 **Classic French Omelette**: Whisk 2-3 eggs with salt and pepper. Melt butter in a pan, pour eggs, stir gently until set, fold and serve.",
            "onion": "🧅 **French Onion Soup**: Caramelize sliced onions in butter for 30 mins, add beef or vegetable broth, simmer, and top with toasted bread and melted cheese.",
            "rice": "🍚 **Golden Fried Rice**: Sauté cold cooked rice with garlic, onions, soy sauce, and scrambled eggs. Add spring onions on top.",
            "garlic": "🧄 **Garlic Bread**: Mix softened butter with minced garlic and parsley, spread on sliced bread, and bake or grill until toasted.",
            "bread": "🍞 **Classic French Toast**: Whisk eggs, milk, cinnamon, and vanilla. Dip bread slices and fry in butter until golden on both sides.",
            "cheese": "🧀 **Gourmet Grilled Cheese**: Butter two slices of bread, sandwich with cheddar and mozzarella, and fry on medium-low heat until bread is crispy and cheese is gooey.",
            "milk": "🥛 **Golden Milk (Turmeric Latte)**: Warm 1 cup of milk with ½ tsp turmeric, a pinch of black pepper, ginger, honey, and cinnamon."
        }

        # Check if the user is asking about a specific item
        matched_key = None
        for key in known_recipes:
            if " " in key:
                if key in msg_lower:
                    matched_key = key
                    break
            elif key in words_in_msg:
                matched_key = key
                break
        
        if not matched_key:
            for it in items:
                name_lower = it['item_name'].lower()
                if " " in name_lower:
                    if name_lower in msg_lower:
                        matched_key = name_lower
                        break
                elif name_lower in words_in_msg:
                    matched_key = name_lower
                    break

        if matched_key:
            # Let's check if the matched item is in the inventory
            inv_item = next((it for it in items if it['item_name'].lower() == matched_key), None)
            recipe_text = known_recipes.get(matched_key)
            if not recipe_text:
                capitalized_name = matched_key.capitalize()
                recipe_text = f"🍳 **Simple {capitalized_name} Dish**: Sauté {capitalized_name} with olive oil, garlic, salt, and pepper for a quick, delicious meal!"
            
            if inv_item:
                status = inv_item['freshness_status']
                qty = f"{inv_item['quantity']} {inv_item['unit']}"
                days_left = inv_item['remaining_days']
                
                status_emoji = "🟢" if status == "Fresh" else ("orange" if status == "Expiring Soon" else "🔴")
                status_emoji = "🟢" if status == "Fresh" else ("🟠" if status == "Expiring Soon" else "🔴")
                status_desc = f"{status} ({days_left} days left)" if status != "Expired" else "Expired"
                
                reply = (
                    f"📖 **Recipe for {inv_item['item_name']}** (which you have in your inventory):\n\n"
                    f"📦 **Inventory Status**: {status_emoji} {qty} - {status_desc}\n\n"
                    f"{recipe_text}\n\n"
                    f"*Tip: Using items in your inventory helps reduce food waste and keeps your Kitchen Health Score high!*"
                )
            else:
                capitalized_name = matched_key.capitalize()
                reply = (
                    f"📖 **Recipe for {capitalized_name}**:\n\n"
                    f"{recipe_text}\n\n"
                    f"⚠️ Note: **{capitalized_name}** is not currently in your kitchen inventory. "
                    f"If you buy some, don't forget to add it to your FreshTrack inventory so we can help you track its freshness!"
                )
        else:
            # Fall back to general recipe suggestions
            if expiring_items:
                tips = []
                if "Banana" in expiring_items:
                    tips.append("🍌 **Banana Smoothie** — Blend 2 bananas, 1 cup milk, 1 tbsp honey, and ice.")
                if "Strawberry" in expiring_items:
                    tips.append("🍓 **Strawberry Jam** — Simmer 1 cup strawberries with 2 tbsp sugar and a squeeze of lemon for 15 min.")
                if "Tomato" in expiring_items:
                    tips.append("🍅 **Quick Tomato Pasta** — Sauté garlic in olive oil, add chopped tomatoes, salt, and basil. Toss with pasta.")
                if "Coriander" in expiring_items:
                    tips.append("🌿 **Coriander Chutney** — Blend coriander, green chilli, garlic, lemon juice, and salt into a paste.")
                if "Avocado" in expiring_items:
                    tips.append("🥑 **Avocado Toast** — Mash avocado with salt, lemon, and chilli flakes on toasted bread.")
                if "Mango" in expiring_items:
                    tips.append("🥭 **Mango Lassi** — Blend 1 ripe mango, ½ cup yogurt, 2 tbsp sugar, and a pinch of cardamom.")
                if "Grapes" in expiring_items:
                    tips.append("🍇 **Frozen Grape Snack** — Wash grapes and freeze them for 2 hours — a refreshing healthy snack!")
                if "Cucumber" in expiring_items:
                    tips.append("🥒 **Cucumber Raita** — Mix sliced cucumber, yogurt, cumin powder, and salt. Serve chilled.")

                if not tips:
                    items_str = ", ".join(expiring_items)
                    tips.append(f"🥗 **Quick Stir-fry**: Sauté {items_str} with garlic, olive oil, soy sauce, and black pepper over high heat for 5 min.")
                    tips.append(f"🍲 **Simple Soup**: Simmer {items_str} in 2 cups of vegetable broth with onion, turmeric and salt.")

                recipe_list = "\n".join(tips)
                reply = (
                    f"🕐 These items are **expiring soon**: {expiring_str}\n\n"
                    f"Here are recipes using them:\n\n{recipe_list}\n\n"
                    "*Cook them today to avoid waste and keep your health score high!*"
                )
            elif items:
                names = [it['item_name'] for it in items[:4]]
                reply = (
                    f"Your inventory looks fresh! Here are quick ideas using your current items ({', '.join(names)}):\n\n"
                    "1. 🥗 **Fresh Salad Bowl** — Combine cucumbers, tomatoes, and lemon juice with olive oil and salt.\n"
                    "2. 🍹 **Tropical Smoothie** — Blend mango or banana with milk and a pinch of cardamom.\n"
                    "3. 🍳 **Vegetable Omelette** — Beat 2 eggs, add diced tomatoes, green chilli, and coriander. Pan-fry.\n\n"
                    "Ask me for a recipe for any specific item you have!"
                )
            else:
                reply = "Your kitchen is empty right now! Add fresh produce via **Add Item** and I'll suggest recipes based on what you have. 🛒"

    # ── Health / Score ──
    elif any(w in msg_lower for w in ["health", "score", "grade", "rating", "how am i doing"]):
        if health_score == 100:
            reply = f"🌟 **Perfect Score: {health_score}/100!**\n\nAll your produce is fresh and well-managed. Keep logging items as you buy them to maintain this streak!"
        elif health_score >= 80:
            reply = (
                f"📊 **Kitchen Health Score: {health_score}/100** (Grade: A — Good)\n\n"
                f"You have {len(expiring_items)} item(s) expiring soon: **{expiring_str}**.\n"
                "- Use them in a meal today to recover **+5 pts each**.\n"
                "- Your kitchen is in good shape overall — keep it up!"
            )
        elif health_score >= 60:
            reply = (
                f"📊 **Kitchen Health Score: {health_score}/100** (Grade: B — Fair)\n\n"
                f"⏰ Expiring soon: **{expiring_str}**\n"
                f"🗑️ Already expired: **{expired_str}**\n\n"
                "**How to improve:**\n"
                "- Remove expired items from your inventory (−15 pts each)\n"
                "- Cook the expiring items today (−5 pts each)\n"
                f"- Doing both will push your score to **{min(100, health_score + (len(expired_items)*15) + (len(expiring_items)*5))}/100**"
            )
        else:
            reply = (
                f"🚨 **Kitchen Health Score: {health_score}/100** (Grade: D — Critical)\n\n"
                f"You have significant food waste:\n"
                f"- Expired: **{expired_str}** (−{len(expired_items)*15} pts)\n"
                f"- Expiring: **{expiring_str}** (−{len(expiring_items)*5} pts)\n\n"
                "**Urgent actions:**\n"
                "1. Go to **Inventory** → delete expired items\n"
                "2. Cook the expiring items immediately\n"
                "3. Future tip: Buy smaller quantities more frequently"
            )

    # ── Waste / Reduction ──
    elif any(w in msg_lower for w in ["waste", "wasting", "reduce", "save", "prevent", "spoil", "rotten"]):
        reply = (
            "♻️ **Food Waste Reduction Tips:**\n\n"
            "1. **Buy less, more often** — Only buy 3–4 days' worth of perishables at a time.\n"
            "2. **FIFO Rule** — First In, First Out. Always use older items before newer ones.\n"
            "3. **Meal planning** — Plan your meals on Sunday for the whole week.\n"
            "4. **Freeze extras** — Ripe bananas, leftover coriander, and cut avocado freeze well.\n"
            "5. **Check FreshTrack daily** — Use the Dashboard to catch expiring items early.\n\n"
        )
        if expiring_items:
            reply += f"⚠️ Right now you should prioritise using: **{expiring_str}** before they expire!"

    # ── Shopping / Buy ──
    elif any(w in msg_lower for w in ["shop", "buy", "grocery", "purchase", "what do i need", "shopping list"]):
        produce_options = list(shelf_life.SHELF_LIFE_DAYS.keys())
        current_names   = [it['item_name'] for it in items]
        missing         = [p for p in produce_options if p not in current_names][:5]

        reply = "🛒 **Shopping Recommendations:**\n\n"
        if expired_items:
            reply += f"**Replace these expired items:** {expired_str}\n\n"
        if missing:
            reply += f"**You don't currently have:** {', '.join(missing)}\n\n"
        reply += (
            "**Smart shopping tips:**\n"
            "- Buy produce with different shelf lives so not everything expires at once\n"
            "- Longer shelf life: Lemon (14d), Green Chilli (10d), Cucumber (7d), Tomato (7d), Grapes (7d)\n"
            "- Shorter shelf life: Coriander (3d), Strawberry (4d), Banana (5d), Avocado (5d), Mango (6d)\n\n"
            "Check the **Shopping** page for a full smart list!"
        )

    # ── Storage tips (general or specific produce) ──
    elif any(w in msg_lower for w in ["store", "storage", "keep", "preserve", "how long", "shelf life", "last", "fresh"]):
        # Produce-specific
        produce_tips = {
            "banana":      "🍌 **Banana** (5 days): Keep at room temperature. To slow ripening, wrap the stems in cling wrap. Never refrigerate unripe bananas — they'll turn black.",
            "tomato":      "🍅 **Tomato** (7 days): Store at room temperature stem-side down. Never in the fridge — cold destroys flavour and texture.",
            "coriander":   "🌿 **Coriander** (3 days): Trim stems, place in a glass of water, cover loosely with a plastic bag, and refrigerate. Lasts up to 7 days this way!",
            "mango":       "🥭 **Mango** (6 days): Ripen at room temperature. Once ripe, refrigerate and use within 2–3 days.",
            "strawberry":  "🍓 **Strawberry** (4 days): Never wash before storing. Keep dry in the fridge. Line container with paper towel to absorb moisture.",
            "avocado":     "🥑 **Avocado** (5 days): Ripen at room temp. Once ripe, refrigerate. If cut, brush with lemon juice and wrap tightly.",
            "grapes":      "🍇 **Grapes** (7 days): Keep unwashed in a ventilated bag in the fridge. Wash right before eating.",
            "cucumber":    "🥒 **Cucumber** (7 days): Wrap in paper towel and store in fridge. Keep away from tomatoes and bananas.",
            "green chilli":"🌶️ **Green Chilli** (10 days): Store in a zip-lock bag in the fridge. Remove stems before storing for longer life.",
            "lemon":       "🍋 **Lemon** (14 days): Keeps well at room temp for 1 week, or up to 4 weeks in the fridge in a sealed bag.",
        }
        matched = [tip for key, tip in produce_tips.items() if key in msg_lower]
        if matched:
            reply = "**Storage Guide:**\n\n" + "\n\n".join(matched)
        else:
            all_tips = "\n".join(produce_tips.values())
            reply = f"🧊 **Complete Storage Guide for All Tracked Produce:**\n\n{all_tips}"

    # ── Expiring / Expire ──
    elif any(w in msg_lower for w in ["expir", "expire", "going bad", "use up", "urgent"]):
        if expiring_items and expired_items:
            reply = (
                f"⚠️ **Urgent Kitchen Alert:**\n\n"
                f"🔴 **Already expired** (remove now): {expired_str}\n"
                f"🟠 **Expiring within 1–2 days** (use today): {expiring_str}\n\n"
                "Go to **Inventory** to delete expired items and the **Kitchen Health** page to see your recovery plan."
            )
        elif expiring_items:
            reply = (
                f"⏰ These items are **expiring soon** (use within 1–2 days): **{expiring_str}**\n\n"
                "💡 Ask me: *Suggest a recipe using my expiring items* — I'll give you specific meal ideas!"
            )
        elif expired_items:
            reply = (
                f"🗑️ You have **{len(expired_items)} expired item(s)**: {expired_str}\n\n"
                "Please remove them from your inventory — they're reducing your Kitchen Health Score by "
                f"**{len(expired_items) * 15} points**.\n\n"
                "Go to **Inventory** → click the trash icon on each expired item."
            )
        else:
            reply = "✅ Great news! None of your current items are expiring soon. Your kitchen is fresh and healthy!"

    # ── How many / Count / Inventory summary ──
    elif any(w in msg_lower for w in ["how many", "what do i have", "inventory", "list", "show me", "what's in"]):
        if items:
            item_lines = "\n".join([
                f"- {it['emoji']} **{it['item_name']}** × {it['quantity']} {it['unit']} — "
                f"{it['remaining_days']}d left ({'✅ Fresh' if it['freshness_status'] == 'Fresh' else ('⏰ Expiring' if it['freshness_status'] == 'Expiring Soon' else '❌ Expired')})"
                for it in items
            ])
            reply = (
                f"📦 **Your Kitchen Inventory ({len(items)} items):**\n\n"
                f"{item_lines}\n\n"
                f"**Health Score:** {health_score}/100"
            )
        else:
            reply = "📭 Your inventory is empty. Head to **Add Item** to start tracking your produce!"

    # ── Thank you ──
    elif any(w in msg_lower for w in ["thank", "thanks", "great", "awesome", "nice", "perfect", "helpful"]):
        reply = (
            "😊 You're welcome! I'm always here to help you keep your kitchen fresh and waste-free.\n\n"
            "Remember: A healthy kitchen score = healthy eating habits. Keep it green! 🌿"
        )

    # ── Gemini / AI key ──
    elif any(w in msg_lower for w in ["gemini", "api key", "ai key", "smarter", "upgrade"]):
        reply = (
            "🤖 **Upgrade to Gemini AI:**\n\n"
            "FreshTrack AI supports Google Gemini for richer, more personalized responses.\n\n"
            "**How to enable it:**\n"
            "1. Go to [Google AI Studio](https://aistudio.google.com) and create an API key\n"
            "2. Open the **Settings** page in FreshTrack\n"
            "3. Paste your key and click **Save Key**\n"
            "4. The backend also reads the `GEMINI_API_KEY` environment variable\n\n"
            "Once enabled, I'll be able to answer any question about food, nutrition, and cooking! 🍽️"
        )

    else:
        # ── Smart catch-all: always references real inventory ──
        if items:
            catch_reply = (
                f"You currently have **{len(items)} items** in inventory: {inv_list}.\n"
                f"Kitchen Health Score: **{health_score}/100**"
            )
            if expiring_items:
                catch_reply += f"\n⏰ Expiring soon: **{expiring_str}**"
            if expired_items:
                catch_reply += f"\n🗑️ Expired: **{expired_str}**"
        else:
            catch_reply = "Your kitchen inventory is currently empty."

        reply = (
            f"I'm not sure I understood that — here's a quick summary of your kitchen:\n\n"
            f"{catch_reply}\n\n"
            "**Things you can ask me:**\n"
            "- 🍳 *Suggest a recipe using my expiring food*\n"
            "- 📊 *How do I improve my kitchen health score?*\n"
            "- 🧊 *How do I store coriander / strawberries / avocado?*\n"
            "- 🛒 *What should I buy this week?*\n"
            "- 📦 *What's in my inventory right now?*\n"
            "- ♻️ *How do I reduce food waste?*"
        )

    return {
        "reply": reply,
        "timestamp": datetime.datetime.now()
    }

