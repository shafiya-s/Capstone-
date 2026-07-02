import React, { useState } from 'react';
import type { InventoryItem } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
}

type FilterStatus = 'All' | 'Fresh' | 'Expiring Soon' | 'Expired';
type SortKey = 'purchase_date' | 'remaining_days' | 'item_name';

export const Inventory: React.FC<InventoryProps> = ({ items, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [sortBy, setSortBy] = useState<SortKey>('remaining_days');

  // Filtering
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.freshness_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'item_name') {
      return a.item_name.localeCompare(b.item_name);
    }
    if (sortBy === 'remaining_days') {
      return a.remaining_days - b.remaining_days;
    }
    if (sortBy === 'purchase_date') {
      return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
    }
    return 0;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Fresh': return 'badge-fresh';
      case 'Expiring Soon': return 'badge-expiring';
      case 'Expired': return 'badge-expired';
      default: return '';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'Fresh': return 'rgba(76, 175, 80, 0.3)';
      case 'Expiring Soon': return 'rgba(255, 152, 0, 0.4)';
      case 'Expired': return 'rgba(244, 67, 54, 0.4)';
      default: return 'var(--border-color)';
    }
  };

  return (
    <div className="animated">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Inventory</h1>
          <p className="page-subtitle">Manage, view, and track fresh produce in your kitchen</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search bar */}
          <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search kitchen produce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '40px' }}
            />
            <svg
              style={{ position: 'absolute', left: '14px', top: '14px', width: '18px', height: '18px', color: 'var(--text-light)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['All', 'Fresh', 'Expiring Soon', 'Expired'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="btn"
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  backgroundColor: statusFilter === status ? 'var(--primary-light)' : 'transparent',
                  color: statusFilter === status ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${statusFilter === status ? 'var(--primary)' : 'var(--border-color)'}`,
                  fontWeight: statusFilter === status ? '600' : '500'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="remaining_days">Shelf Life Left</option>
              <option value="purchase_date">Purchase Date</option>
              <option value="item_name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      {sortedItems.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🥗</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No inventory items found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            {searchTerm || statusFilter !== 'All' 
              ? "We couldn't find items matching your filters." 
              : "Let's log your fresh items to start predicting freshness and calculating kitchen health!"
            }
          </p>
          {(searchTerm || statusFilter !== 'All') ? (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} className="btn btn-secondary">Clear Filters</button>
          ) : (
            <button className="btn btn-primary" onClick={() => onEdit(null as any)}>Add First Item</button>
          )}
        </div>
      ) : (
        <div className="inventory-grid">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="card inventory-card"
              style={{ borderLeft: `5px solid ${getBorderColor(item.freshness_status)}` }}
            >
              <div className="inventory-card-top">
                <div className="inventory-card-emoji">{item.emoji}</div>
                <span className={`badge ${getStatusBadgeClass(item.freshness_status)}`}>
                  {item.freshness_status}
                </span>
              </div>

              <div>
                <h3 className="inventory-card-title">{item.item_name}</h3>
                <div className="inventory-card-qty">{item.quantity} {item.unit}</div>
              </div>

              <div style={{ margin: '16px 0', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shelf Life Remaining:</span>
                  <strong style={{ 
                    color: item.remaining_days <= 0 ? 'var(--status-expired)' : 
                           item.remaining_days <= 2 ? 'var(--status-expiring)' : 'var(--status-fresh)'
                  }}>
                    {item.remaining_days <= 0 ? 'Expired' : `${item.remaining_days} days`}
                  </strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(0, Math.min(100, (item.remaining_days / item.shelf_life_days) * 100))}%`,
                    height: '100%',
                    backgroundColor: item.remaining_days <= 0 ? 'var(--status-expired)' : 
                                     item.remaining_days <= 2 ? 'var(--status-expiring)' : 'var(--status-fresh)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              <div className="inventory-card-meta">
                <span className="inventory-card-date">Bought {item.purchase_date}</span>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onEdit(item)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 'var(--border-radius-sm)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 'var(--border-radius-sm)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
