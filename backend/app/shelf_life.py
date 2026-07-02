import datetime
from typing import Dict, List, Any

# Predefined shelf life configurations in days
SHELF_LIFE_DAYS: Dict[str, int] = {
    "Banana": 5,
    "Tomato": 7,
    "Coriander": 3,
    "Mango": 6,
    "Strawberry": 4,
    "Avocado": 5,
    "Grapes": 7,
    "Cucumber": 7,
    "Green Chilli": 10,
    "Lemon": 14
}

# Predefined emojis for the UI and system display
PRODUCE_EMOJIS: Dict[str, str] = {
    "Banana": "🍌",
    "Tomato": "🍅",
    "Coriander": "🌿",
    "Mango": "🥭",
    "Strawberry": "🍓",
    "Avocado": "🥑",
    "Grapes": "🍇",
    "Cucumber": "🥒",
    "Green Chilli": "🌶️",
    "Lemon": "🍋"
}

def get_shelf_life(item_name: str) -> int:
    """Returns the shelf life of an item, defaulting to 7 days for unknown produce."""
    return SHELF_LIFE_DAYS.get(item_name, 7)

def get_emoji(item_name: str) -> str:
    """Returns the emoji associated with the produce, defaulting to 📦."""
    return PRODUCE_EMOJIS.get(item_name, "📦")

def calculate_remaining_days(purchase_date_str: str, shelf_life: int) -> int:
    """Calculates remaining shelf life days: Shelf Life - Days Since Purchase."""
    try:
        purchase_date = datetime.date.fromisoformat(purchase_date_str)
        today = datetime.date.today()
        days_since_purchase = (today - purchase_date).days
        return shelf_life - days_since_purchase
    except Exception:
        # Fallback if date is invalid or corrupt
        return shelf_life

def get_freshness_status(remaining_days: int) -> str:
    """
    Status Rules:
    Remaining > 2 -> Fresh (Green)
    Remaining 1-2 -> Expiring Soon (Orange)
    Remaining <= 0 -> Expired (Red)
    """
    if remaining_days > 2:
        return "Fresh"
    elif remaining_days >= 1:
        return "Expiring Soon"
    else:
        return "Expired"

def calculate_kitchen_health(items: List[Dict[str, Any]]) -> int:
    """
    Kitchen Health Score:
    Start at 100.
    Subtract 15 points for each expired item.
    Subtract 5 points for each expiring soon item.
    Score cannot fall below 0.
    """
    score = 100
    for item in items:
        status = item.get("freshness_status")
        if status == "Expired":
            score -= 15
        elif status == "Expiring Soon":
            score -= 5
    return max(0, score)
