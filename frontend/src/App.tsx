import { useState, useEffect } from 'react';
import type { InventoryItem, DashboardMetrics, ChatMessage } from './types';
import { Dashboard } from './pages/Dashboard';
import { AddItem } from './pages/AddItem';
import { Inventory } from './pages/Inventory';
import { AskFreshTrack } from './pages/AskFreshTrack';
import { Shopping } from './pages/Shopping';
import { KitchenHealth } from './pages/KitchenHealth';
import { Settings } from './pages/Settings';

const API_BASE = 'http://localhost:8000/api';

const DEFAULT_METRICS: DashboardMetrics = {
  total_items: 0,
  kitchen_health_score: 100,
  expiring_soon_count: 0,
  expired_count: 0,
  use_today: [],
  expiring_soon: [],
  waste_alerts: [],
  recent_inventory: [],
};

// ──────────────────────────────────────────
// SVG Icon Components
// ──────────────────────────────────────────
const Icon = {
  Grid: () => (
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Cart: () => (
    <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>
  ),
  Leaf: () => (
    <svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 19.34L5.71 21c1-1 2-2 3-2 4 0 6-3 9-3 3 0 3 2 3 2V8z"/><path d="M3.82 19.34C2.31 17.23 2 12 2 12s4 0 6 2"/></svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
};

// ──────────────────────────────────────────
// Sidebar Menu Items
// ──────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',      icon: Icon.Grid },
  { id: 'add-item',       label: 'Add Item',        icon: Icon.Plus },
  { id: 'inventory',      label: 'Inventory',       icon: Icon.List },
  { id: 'ask-freshtrack', label: 'Ask FreshTrack',  icon: Icon.Chat },
  { id: 'shopping',       label: 'Shopping',        icon: Icon.Cart },
  { id: 'kitchen-health', label: 'Kitchen Health',  icon: Icon.Heart },
  { id: 'settings',       label: 'Settings',        icon: Icon.Settings },
];

// ──────────────────────────────────────────
// App Component
// ──────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('freshtrack_gemini_key') || '');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendError, setBackendError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // ── Data Fetching ──────────────────────
  const fetchData = async () => {
    try {
      setBackendError(false);
      const [invRes, dashRes] = await Promise.all([
        fetch(`${API_BASE}/inventory`),
        fetch(`${API_BASE}/dashboard`),
      ]);
      if (!invRes.ok || !dashRes.ok) throw new Error('Bad response from API');
      const invData = await invRes.json();
      const dashData = await dashRes.json();
      setItems(invData);
      setMetrics(dashData);
    } catch {
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Re-sync every 15s
    return () => clearInterval(interval);
  }, []);

  // ── CRUD Handlers ──────────────────────
  const handleSaveItem = async (itemData: {
    item_name: string; quantity: number; unit: string; purchase_date: string;
  }): Promise<boolean> => {
    try {
      const url = editingItem
        ? `${API_BASE}/inventory/${editingItem.id}`
        : `${API_BASE}/inventory`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error('Save failed');
      await fetchData();
      setEditingItem(null);
      setTimeout(() => setActiveTab('inventory'), 800);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Remove this item from your kitchen inventory?')) return;
    try {
      await fetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch {
      alert('Failed to delete item. Please check your backend connection.');
    }
  };

  // ── Chat Handler ───────────────────────
  const handleSendMessage = async (message: string): Promise<string> => {
    const userMsg: ChatMessage = { sender: 'user', message, timestamp: new Date().toISOString() };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: updatedHistory }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      const aiMsg: ChatMessage = { sender: 'ai', message: data.reply, timestamp: data.timestamp };
      setChatHistory(prev => [...prev, aiMsg]);
      return data.reply;
    } catch {
      const errMsg: ChatMessage = {
        sender: 'ai',
        message: '⚠️ Could not reach the FreshTrack AI backend. Please make sure the server is running on port 8000.',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errMsg]);
      return '';
    }
  };

  // ── Settings Handlers ──────────────────
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('freshtrack_gemini_key', key);
  };

  const handleSeedDemoData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };

    const seeds = [
      { item_name: 'Banana',      quantity: 4, unit: 'pcs',   purchase_date: today },        // Fresh  (5d shelf)
      { item_name: 'Lemon',       quantity: 6, unit: 'pcs',   purchase_date: today },        // Fresh  (14d shelf)
      { item_name: 'Strawberry',  quantity: 2, unit: 'pcs',   purchase_date: daysAgo(3) },   // Expiring (4d shelf)
      { item_name: 'Coriander',   quantity: 1, unit: 'bunch', purchase_date: daysAgo(2) },   // Expiring (3d shelf)
      { item_name: 'Tomato',      quantity: 5, unit: 'pcs',   purchase_date: daysAgo(9) },   // Expired  (7d shelf)
      { item_name: 'Avocado',     quantity: 3, unit: 'pcs',   purchase_date: today },        // Fresh  (5d shelf)
    ];

    for (const item of seeds) {
      await fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
    await fetchData();
  };

  const handleResetDatabase = async () => {
    const current = [...items];
    for (const item of current) {
      await fetch(`${API_BASE}/inventory/${item.id}`, { method: 'DELETE' });
    }
    await fetchData();
  };

  const handleAddFromShopping = (itemName: string) => {
    setEditingItem({
      id: 0, item_name: itemName, quantity: 1, unit: 'pcs',
      purchase_date: new Date().toISOString().split('T')[0],
      created_at: '', emoji: '', shelf_life_days: 0,
      remaining_days: 0, freshness_status: 'Fresh',
    });
    setActiveTab('add-item');
  };

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleTriggerEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setActiveTab('add-item');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setActiveTab('inventory');
  };

  // ── Page Renderer ──────────────────────
  const renderPage = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
          <div style={{ fontSize: 40 }}>🌿</div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}>Initializing FreshTrack AI…</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard metrics={metrics} onNavigate={navigateTo} onDelete={handleDeleteItem} />;
      case 'add-item':
        return <AddItem onSave={handleSaveItem} existingItem={editingItem} onCancelEdit={editingItem?.id ? handleCancelEdit : undefined} />;
      case 'inventory':
        return <Inventory items={items} onEdit={handleTriggerEdit} onDelete={handleDeleteItem} />;
      case 'ask-freshtrack':
        return <AskFreshTrack chatHistory={chatHistory} onSendMessage={handleSendMessage} />;
      case 'shopping':
        return <Shopping items={items} onAddFromShopping={handleAddFromShopping} />;
      case 'kitchen-health':
        return <KitchenHealth metrics={metrics} items={items} />;
      case 'settings':
        return <Settings apiKey={apiKey} onSaveApiKey={handleSaveApiKey} onSeedDemoData={handleSeedDemoData} onResetDatabase={handleResetDatabase} />;
      default:
        return <Dashboard metrics={metrics} onNavigate={navigateTo} onDelete={handleDeleteItem} />;
    }
  };

  return (
    <div className="app-container">
      {/* ── Mobile Header ── */}
      <div className="mobile-header">
        <div className="sidebar-logo" style={{ border: 'none', padding: 0, margin: 0 }}>
          <div className="sidebar-logo-icon">
            <Icon.Leaf />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">FreshTrack AI</span>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn">
          {mobileMenuOpen ? <Icon.X /> : <Icon.Menu />}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Icon.Leaf />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">FreshTrack AI</span>
            <span className="sidebar-logo-badge">Kitchen Manager</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          {NAV_ITEMS.map(({ id, label, icon: NavIcon }) => (
            <li key={id}>
              <div
                onClick={() => navigateTo(id)}
                className={`sidebar-item ${activeTab === id ? 'active' : ''}`}
              >
                <NavIcon />
                <span>{label}</span>
                {id === 'inventory' && items.length > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    borderRadius: 'var(--radius-full)',
                    padding: '1px 7px',
                  }}>
                    {items.length}
                  </span>
                )}
                {id === 'dashboard' && metrics.expired_count > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'var(--expired-bg)',
                    color: 'var(--expired)',
                    borderRadius: 'var(--radius-full)',
                    padding: '1px 7px',
                  }}>
                    {metrics.expired_count}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <span>🌿</span>
          <span>FreshTrack AI v1.0</span>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Backend error banner */}
        {backendError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--expired-bg)',
            color: 'var(--expired)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            border: '1px solid var(--expired-border)',
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>
              <strong>Backend Offline</strong> — FreshTrack AI is running in offline mode.
              Start the FastAPI server (<code style={{ background: 'rgba(0,0,0,.07)', padding: '1px 5px', borderRadius: 4 }}>uvicorn app.main:app --port 8000</code>) to enable full functionality.
            </span>
          </div>
        )}

        {renderPage()}
      </main>
    </div>
  );
}

export default App;
