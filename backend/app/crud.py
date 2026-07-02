from sqlalchemy.orm import Session
from . import models, schemas, shelf_life

def format_item(db_item: models.InventoryItem) -> dict:
    """Computes shelf life, remaining days, freshness status and adds it to the item dictionary."""
    sl = shelf_life.get_shelf_life(db_item.item_name)
    rem = shelf_life.calculate_remaining_days(db_item.purchase_date, sl)
    status = shelf_life.get_freshness_status(rem)
    emoji = shelf_life.get_emoji(db_item.item_name)
    
    return {
        "id": db_item.id,
        "item_name": db_item.item_name,
        "quantity": db_item.quantity,
        "unit": db_item.unit,
        "purchase_date": db_item.purchase_date,
        "created_at": db_item.created_at,
        "emoji": emoji,
        "shelf_life_days": sl,
        "remaining_days": rem,
        "freshness_status": status
    }

def get_items(db: Session):
    items = db.query(models.InventoryItem).order_by(models.InventoryItem.purchase_date.desc()).all()
    return [format_item(item) for item in items]

def get_item(db: Session, item_id: int):
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    return format_item(item) if item else None

def create_item(db: Session, item: schemas.InventoryItemCreate):
    db_item = models.InventoryItem(
        item_name=item.item_name,
        quantity=item.quantity,
        unit=item.unit,
        purchase_date=item.purchase_date
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return format_item(db_item)

def update_item(db: Session, item_id: int, item_update: schemas.InventoryItemUpdate):
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not db_item:
        return None
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return format_item(db_item)

def delete_item(db: Session, item_id: int):
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True
