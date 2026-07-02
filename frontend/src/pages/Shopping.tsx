import React, { useState } from 'react';
import type { InventoryItem } from '../types';

interface ShoppingProps {
  items: InventoryItem[];
  onAddFromShopping: (itemName: string) => void;
}

const PREDEFINED_PRODUCE = [
  { name: 'Banana', emoji: '🍌', category: 'Fruits', tip: 'Look for green tips if you want them to last longer.' },
  { name: 'Tomato', emoji: '🍅', category: 'Vegetables', tip: 'Store at room temperature away from sunlight.' },
  { name: 'Coriander', emoji: '🌿', category: 'Herbs', tip: 'Keep the stems damp to double its shelf life.' },
  { name: 'Mango', emoji: '🥭', category: 'Fruits', tip: 'Slightly soft at the stem end means it is ripe.' },
  { name: 'Strawberry', emoji: '🍓', category: 'Fruits', tip: 'Discard any moldy ones immediately to save the rest.' },
  { name: 'Avocado', emoji: '🥑', category: 'Fruits', tip: 'Buy firm ones and store next to bananas to ripen fast.' },
  { name: 'Grapes', emoji: '🍇', category: 'Fruits', tip: 'Keep in the original ventilated bag in the fridge.' },
  { name: 'Cucumber', emoji: '🥒', category: 'Vegetables', tip: 'Keep dry, as moisture accelerates decaying.' },
  { name: 'Green Chilli', emoji: '🌶️', category: 'Vegetables', tip: 'Remove stems before refrigerating for longer life.' },
  { name: 'Lemon', emoji: '🍋', category: 'Fruits', tip: 'Store in a sealed bag in the fridge to stay juicy.' }
];

export const Shopping: React.FC<ShoppingProps> = ({ items, onAddFromShopping }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Logic: Identify which items are missing or expired
  // Missing: Produce not present in current inventory
  // Replenish: Produce present but expired (remaining_days <= 0)
  
  const presentItems = items.reduce((acc, item) => {
    if (item.remaining_days > 0) {
      acc.add(item.item_name);
    }
    return acc;
  }, new Set<string>());

  const expiredItems = items.reduce((acc, item) => {
    if (item.remaining_days <= 0) {
      acc.add(item.item_name);
    }
    return acc;
  }, new Set<string>());

  // Missing produce list
  const missingProduce = PREDEFINED_PRODUCE.filter(p => !presentItems.has(p.name));

  const toggleCheck = (name: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="animated">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Shopping Assistant</h1>
          <p className="page-subtitle">Auto-generated shopping recommendations based on your active kitchen inventory</p>
        </div>
      </div>

      <div className="widgets-container">
        {/* Left: Grocery List */}
        <div className="widget-section">
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Your Kitchen Shopping List</h3>
              <span className="badge badge-fresh">Auto-Generated</span>
            </div>

            {missingProduce.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🛒</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Your kitchen is fully stocked! All 10 tracked produce categories are active and fresh.
                </p>
              </div>
            ) : (
              <div className="item-list" style={{ marginTop: '16px' }}>
                {missingProduce.map((prod) => {
                  const isExpired = expiredItems.has(prod.name);
                  const isChecked = !!checkedItems[prod.name];

                  return (
                    <div
                      key={prod.name}
                      className="list-row"
                      style={{
                        padding: '16px',
                        backgroundColor: isChecked ? '#f4fbf4' : '#ffffff',
                        borderColor: isChecked ? 'var(--border-color-hover)' : 'var(--border-color)',
                        opacity: isChecked ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1' }}>
                        {/* Checkbox */}
                        <div
                          onClick={() => toggleCheck(prod.name)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            border: `2px solid ${isChecked ? 'var(--primary)' : 'var(--border-color-hover)'}`,
                            backgroundColor: isChecked ? 'var(--primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" style={{ width: '14px', height: '14px' }}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>

                        <span style={{ fontSize: '24px' }}>{prod.emoji}</span>
                        
                        <div className="list-item-details">
                          <h4 style={{
                            textDecoration: isChecked ? 'line-through' : 'none',
                            color: isChecked ? 'var(--text-light)' : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {prod.name}
                            {isExpired && (
                              <span className="badge badge-expired" style={{ fontSize: '9px', padding: '2px 6px' }}>Replenish</span>
                            )}
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                            {prod.category} • {prod.tip}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddFromShopping(prod.name)}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          borderRadius: 'var(--border-radius-sm)',
                          visibility: isChecked ? 'hidden' : 'visible'
                        }}
                      >
                        + Log Purchase
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Smart Replenishment Guide */}
        <div className="widget-section">
          <div className="widget">
            <h3 className="widget-title" style={{ marginBottom: '16px' }}>Replenishment Tips</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid rgba(46, 125, 50, 0.1)'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>
                  Smart Ordering
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  FreshTrack AI monitors item depletion rates. Buying avocados firm and bananas green helps space out ripeness windows, preventing bulk spoiling.
                </p>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Food Waste Impact
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  A healthy score of 100 means you buy exactly what you eat. Try setting low initial quantities (e.g. 3 bananas instead of 6) to test kitchen burn rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
