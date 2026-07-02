from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    purchase_date = Column(String, nullable=False)  # ISO Date String (YYYY-MM-DD)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
