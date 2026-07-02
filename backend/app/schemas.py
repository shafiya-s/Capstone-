from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class InventoryItemBase(BaseModel):
    item_name: str
    quantity: float
    unit: str
    purchase_date: str  # YYYY-MM-DD

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    purchase_date: Optional[str] = None

class InventoryItemResponse(InventoryItemBase):
    id: int
    created_at: datetime
    emoji: str
    shelf_life_days: int
    remaining_days: int
    freshness_status: str

    model_config = ConfigDict(from_attributes=True)
    
class KitchenDashboardResponse(BaseModel):
    total_items: int
    kitchen_health_score: int
    expiring_soon_count: int
    expired_count: int
    use_today: list[InventoryItemResponse]
    expiring_soon: list[InventoryItemResponse]
    waste_alerts: list[InventoryItemResponse]
    recent_inventory: list[InventoryItemResponse]

class ChatMessage(BaseModel):
    sender: str  # 'user' or 'ai'
    message: str
    timestamp: datetime

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    timestamp: datetime
