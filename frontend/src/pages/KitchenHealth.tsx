import React from 'react';
import type { DashboardMetrics, InventoryItem } from '../types';

interface KitchenHealthProps {
  metrics: DashboardMetrics;
  items: InventoryItem[];
}

export const KitchenHealth: React.FC<KitchenHealthProps> = ({ metrics, items }) => {
  const score = metrics.kitchen_health_score;

  // Circle drawing calculations
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreGrade = (val: number) => {
    if (val >= 90) return { grade: 'A+', label: 'Excellent', color: 'var(--status-fresh)' };
    if (val >= 80) return { grade: 'A', label: 'Good', color: 'var(--status-fresh)' };
    if (val >= 60) return { grade: 'B', label: 'Fair', color: 'var(--status-expiring)' };
    if (val >= 40) return { grade: 'C', label: 'Needs Improvement', color: 'var(--status-expiring)' };
    return { grade: 'D-', label: 'Critical Waste Risk', color: 'var(--status-expired)' };
  };

  const gradeInfo = getScoreGrade(score);

  // Statistics
  const freshCount = items.filter(i => i.freshness_status === 'Fresh').length;
  const expiringCount = metrics.expiring_soon_count;
  const expiredCount = metrics.expired_count;
  
  const total = items.length;
  const freshPercent = total > 0 ? Math.round((freshCount / total) * 100) : 0;
  const expiringPercent = total > 0 ? Math.round((expiringCount / total) * 100) : 0;
  const expiredPercent = total > 0 ? Math.round((expiredCount / total) * 100) : 0;

  return (
    <div className="animated">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Health Analytics</h1>
          <p className="page-subtitle">Detailed breakdown of food fresh state, shelf waste metrics, and health scores</p>
        </div>
      </div>

      <div className="widgets-container">
        {/* Left Widget: Circular Score Card */}
        <div className="widget" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <h3 className="widget-title" style={{ marginBottom: '24px' }}>Kitchen Health Score</h3>
          
          <div className="circular-progress">
            <svg width="180" height="180" viewBox="0 0 160 160">
              <circle
                className="circular-progress-circle-bg"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={strokeWidth}
              />
              <circle
                className="circular-progress-circle-bar"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={strokeWidth}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  stroke: gradeInfo.color
                }}
              />
            </svg>
            <div className="circular-progress-value">
              <span>{score}</span>
              <span className="circular-progress-label">Health</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: gradeInfo.color }}>
              Grade: {gradeInfo.grade}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Status: <strong>{gradeInfo.label}</strong>
            </p>
          </div>
        </div>

        {/* Right Widget: Statistics & Breakdown */}
        <div className="widget-section">
          <div className="widget">
            <h3 className="widget-title" style={{ marginBottom: '20px' }}>Freshness Distribution</h3>
            
            {total === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No items in inventory to analyze.</p>
            ) : (
              <div>
                {/* Horizontal Progress Bar Ratio Chart */}
                <div style={{
                  display: 'flex',
                  height: '24px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '24px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  {freshCount > 0 && (
                    <div style={{ width: `${freshPercent}%`, backgroundColor: 'var(--status-fresh)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                      {freshPercent}%
                    </div>
                  )}
                  {expiringCount > 0 && (
                    <div style={{ width: `${expiringPercent}%`, backgroundColor: 'var(--status-expiring)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                      {expiringPercent}%
                    </div>
                  )}
                  {expiredCount > 0 && (
                    <div style={{ width: `${expiredPercent}%`, backgroundColor: 'var(--status-expired)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                      {expiredPercent}%
                    </div>
                  )}
                </div>

                {/* Breakdown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-fresh)' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Fresh Produce</span>
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{freshCount} items ({freshPercent}%)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-expiring)' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Expiring Soon</span>
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{expiringCount} items ({expiringPercent}%)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-expired)' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Expired / Spoiled</span>
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{expiredCount} items ({expiredPercent}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Waste Prevention Summary */}
          <div className="widget">
            <h3 className="widget-title" style={{ marginBottom: '12px' }}>Kitchen Health Action Report</h3>
            
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {score === 100 ? (
                <p>💡 <strong>Outstanding:</strong> Keep logging items as they are purchased to maintain optimal freshness cycles.</p>
              ) : expiredCount > 0 ? (
                <p>⚠️ <strong>Action Required:</strong> You have {expiredCount} expired items. Discarding or composting them and updating your active list will increase your score by <strong>{expiredCount * 15} points</strong> immediately.</p>
              ) : expiringCount > 0 ? (
                <p>🥑 <strong>Optimization Tip:</strong> Consuming your {expiringCount} expiring soon items in the next 24 hours will recover your score to <strong>100/100</strong>.</p>
              ) : (
                <p>💡 Add fresh fruits and vegetables via the <strong>Add Item</strong> panel to start kitchen diagnostic services.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
