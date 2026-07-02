export interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  created_at: string;
  emoji: string;
  shelf_life_days: number;
  remaining_days: number;
  freshness_status: 'Fresh' | 'Expiring Soon' | 'Expired';
}

export interface DashboardMetrics {
  total_items: number;
  kitchen_health_score: number;
  expiring_soon_count: number;
  expired_count: number;
  use_today: InventoryItem[];
  expiring_soon: InventoryItem[];
  waste_alerts: InventoryItem[];
  recent_inventory: InventoryItem[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
  timestamp: string;
}
