import React, { useState } from 'react';
import type { InventoryItem } from '../types';

interface AddItemProps {
  onSave: (item: { item_name: string; quantity: number; unit: string; purchase_date: string }) => Promise<boolean>;
  existingItem?: InventoryItem | null;
  onCancelEdit?: () => void;
}

const PREDEFINED_PRODUCE = [
  { name: 'Banana', emoji: '🍌', shelfLife: 5 },
  { name: 'Tomato', emoji: '🍅', shelfLife: 7 },
  { name: 'Coriander', emoji: '🌿', shelfLife: 3 },
  { name: 'Mango', emoji: '🥭', shelfLife: 6 },
  { name: 'Strawberry', emoji: '🍓', shelfLife: 4 },
  { name: 'Avocado', emoji: '🥑', shelfLife: 5 },
  { name: 'Grapes', emoji: '🍇', shelfLife: 7 },
  { name: 'Cucumber', emoji: '🥒', shelfLife: 7 },
  { name: 'Green Chilli', emoji: '🌶️', shelfLife: 10 },
  { name: 'Lemon', emoji: '🍋', shelfLife: 14 }
];

const UNITS = ['pcs', 'kg', 'g', 'bunch', 'bag'];

export const AddItem: React.FC<AddItemProps> = ({ onSave, existingItem, onCancelEdit }) => {
  const [itemName, setItemName] = useState(existingItem?.item_name || PREDEFINED_PRODUCE[0].name);
  const [quantity, setQuantity] = useState(existingItem?.quantity || 1);
  const [unit, setUnit] = useState(existingItem?.unit || 'pcs');
  
  // Default purchase date is today
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [purchaseDate, setPurchaseDate] = useState(existingItem?.purchase_date || getTodayString());
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedProduce = PREDEFINED_PRODUCE.find(p => p.name === itemName) || PREDEFINED_PRODUCE[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setStatusMsg({ type: 'error', text: 'Quantity must be greater than zero.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const success = await onSave({
      item_name: itemName,
      quantity,
      unit,
      purchase_date: purchaseDate
    });

    setLoading(false);

    if (success) {
      setStatusMsg({
        type: 'success',
        text: existingItem ? 'Item updated successfully!' : `Added ${quantity} ${unit} of ${itemName}!`
      });
      
      if (!existingItem) {
        // Reset form for new additions
        setQuantity(1);
        setPurchaseDate(getTodayString());
      }
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Failed to save item. Please check your connection.'
      });
    }
  };

  return (
    <div className="animated" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{existingItem ? 'Edit Produce Item' : 'Add Kitchen Produce'}</h1>
          <p className="page-subtitle">
            {existingItem ? 'Modify details of your stored item' : 'Log fresh fruits and vegetables to start tracking'}
          </p>
        </div>
        {existingItem && onCancelEdit && (
          <button onClick={onCancelEdit} className="btn btn-secondary">Cancel</button>
        )}
      </div>

      <div className="card">
        {statusMsg && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: statusMsg.type === 'success' ? 'var(--status-fresh-bg)' : 'var(--status-expired-bg)',
            color: statusMsg.type === 'success' ? 'var(--status-fresh)' : 'var(--status-expired)',
            fontWeight: '600',
            fontSize: '14px',
            marginBottom: '20px',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`
          }}>
            {statusMsg.text}
          </div>
        )}

        {/* Selected Item Preview Panel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '20px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '48px', lineHeight: '1' }}>{selectedProduce.emoji}</span>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>{selectedProduce.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Standard Shelf Life: <strong>{selectedProduce.shelfLife} days</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Predefined Produce Selection */}
          <div className="form-group">
            <label className="form-label">Select Produce</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '10px',
              marginBottom: '15px'
            }}>
              {PREDEFINED_PRODUCE.map((prod) => (
                <div
                  key={prod.name}
                  onClick={() => setItemName(prod.name)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 8px',
                    borderRadius: 'var(--border-radius-md)',
                    border: `1.5px solid ${itemName === prod.name ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: itemName === prod.name ? '#ffffff' : '#fafdfa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: itemName === prod.name ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '28px', marginBottom: '4px' }}>{prod.emoji}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: itemName === prod.name ? 'var(--primary)' : 'var(--text-main)' }}>
                    {prod.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity and Unit Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    padding: '10px 14px',
                    border: '1.5px solid var(--border-color)',
                    borderRight: 'none',
                    borderRadius: 'var(--border-radius-md) 0 0 var(--border-radius-md)',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >-</button>
                <input
                  id="quantity"
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="form-control"
                  style={{
                    textAlign: 'center',
                    borderRadius: '0',
                    borderLeft: '1.5px solid var(--border-color)',
                    borderRight: '1.5px solid var(--border-color)'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  style={{
                    padding: '10px 14px',
                    border: '1.5px solid var(--border-color)',
                    borderLeft: 'none',
                    borderRadius: '0 var(--border-radius-md) var(--border-radius-md) 0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >+</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="unit">Unit</label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="form-control"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="purchaseDate">Purchase Date</label>
            <input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '12px' }}
          >
            {loading ? 'Saving Item...' : existingItem ? 'Update Item' : 'Save Kitchen Item'}
          </button>
        </form>
      </div>
    </div>
  );
};
