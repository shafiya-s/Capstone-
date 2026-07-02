import React from 'react';
import type { DashboardMetrics } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  onNavigate: (tab: string) => void;
  onDelete: (id: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ metrics, onNavigate, onDelete }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'var(--status-fresh)';
    if (score >= 50) return 'var(--status-expiring)';
    return 'var(--status-expired)';
  };

  return (
    <div className="animated">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Overview</h1>
          <p className="page-subtitle">AI-assisted kitchen fresh tracking and analytics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="card" onClick={() => onNavigate('inventory')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Total Items</div>
          <div className="card-value">{metrics.total_items}</div>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>

        <div className="card" onClick={() => onNavigate('kitchen-health')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Kitchen Health</div>
          <div className="card-value" style={{ color: getHealthColor(metrics.kitchen_health_score) }}>
            {metrics.kitchen_health_score}%
          </div>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
        </div>

        <div className="card" onClick={() => onNavigate('inventory')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--status-expiring)' }}>
          <div className="card-title">Expiring Soon</div>
          <div className="card-value" style={{ color: 'var(--status-expiring)' }}>{metrics.expiring_soon_count}</div>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
        </div>

        <div className="card" onClick={() => onNavigate('inventory')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--status-expired)' }}>
          <div className="card-title">Expired Items</div>
          <div className="card-value" style={{ color: 'var(--status-expired)' }}>{metrics.expired_count}</div>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
        </div>
      </div>

      {/* Main Widgets Container */}
      <div className="widgets-container">
        {/* Left column */}
        <div className="widget-section">
          {/* Use Today Section */}
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Use Today</h3>
              <span className="badge badge-expiring">Urgent</span>
            </div>
            {metrics.use_today.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No items expiring today. Great job!</p>
            ) : (
              <div className="item-list">
                {metrics.use_today.map((item) => (
                  <div key={item.id} className="list-row">
                    <div className="list-item-info">
                      <span className="list-item-emoji">{item.emoji}</span>
                      <div className="list-item-details">
                        <h4>{item.item_name}</h4>
                        <p>{item.quantity} {item.unit} • Purchased {item.purchase_date}</p>
                      </div>
                    </div>
                    <span className="badge badge-expiring">{item.remaining_days === 0 ? 'Expires today' : '1 day left'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Inventory */}
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Recent Inventory</h3>
              <span className="widget-action" onClick={() => onNavigate('inventory')}>View All</span>
            </div>
            {metrics.recent_inventory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Your kitchen inventory is currently empty.</p>
            ) : (
              <div className="item-list">
                {metrics.recent_inventory.map((item) => (
                  <div key={item.id} className="list-row">
                    <div className="list-item-info">
                      <span className="list-item-emoji">{item.emoji}</span>
                      <div className="list-item-details">
                        <h4>{item.item_name}</h4>
                        <p>{item.quantity} {item.unit} • Added recently</p>
                      </div>
                    </div>
                    <span className={`badge ${
                      item.freshness_status === 'Fresh' ? 'badge-fresh' : 
                      item.freshness_status === 'Expiring Soon' ? 'badge-expiring' : 'badge-expired'
                    }`}>{item.freshness_status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="widget-section">
          {/* Expiring Soon Section */}
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Expiring Soon</h3>
            </div>
            {metrics.expiring_soon.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No items expiring soon.</p>
            ) : (
              <div className="item-list">
                {metrics.expiring_soon.map((item) => (
                  <div key={item.id} className="list-row" style={{ padding: '12px' }}>
                    <div className="list-item-info" style={{ gap: '10px' }}>
                      <span className="list-item-emoji" style={{ fontSize: '18px' }}>{item.emoji}</span>
                      <div className="list-item-details">
                        <h4 style={{ fontSize: '14px' }}>{item.item_name}</h4>
                        <p style={{ fontSize: '12px' }}>{item.quantity} {item.unit}</p>
                      </div>
                    </div>
                    <span className="badge badge-expiring" style={{ fontSize: '10px' }}>{item.remaining_days}d left</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waste Alerts Section */}
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title" style={{ color: 'var(--status-expired)' }}>Waste Alerts</h3>
              <span className="badge badge-expired">Expired</span>
            </div>
            {metrics.waste_alerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No food waste alerts! Excellent kitchen management.</p>
            ) : (
              <div className="item-list">
                {metrics.waste_alerts.map((item) => (
                  <div key={item.id} className="list-row" style={{ padding: '12px', borderColor: 'rgba(244, 67, 54, 0.2)' }}>
                    <div className="list-item-info" style={{ gap: '10px' }}>
                      <span className="list-item-emoji" style={{ fontSize: '18px' }}>{item.emoji}</span>
                      <div className="list-item-details">
                        <h4 style={{ fontSize: '14px' }}>{item.item_name}</h4>
                        <p style={{ fontSize: '12px' }}>{item.quantity} {item.unit}</p>
                      </div>
                    </div>
                    <button onClick={() => onDelete(item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}>Discard</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
