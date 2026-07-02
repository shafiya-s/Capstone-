import React, { useMemo } from 'react';
import type { DashboardMetrics, InventoryItem } from '../types';

interface KitchenHealthProps {
  metrics: DashboardMetrics;
  items: InventoryItem[];
}

export const KitchenHealth: React.FC<KitchenHealthProps> = ({ metrics, items }) => {
  // ── Score calculated live from real items ──────────────────────────────────
  const score = useMemo(() => {
    if (items.length === 0) return 100;
    let s = 100;
    for (const item of items) {
      if (item.freshness_status === 'Expired')       s -= 15;
      else if (item.freshness_status === 'Expiring Soon') s -= 5;
    }
    return Math.max(0, s);
  }, [items]);

  // ── Freshness counts direct from items array ───────────────────────────────
  const freshCount    = items.filter(i => i.freshness_status === 'Fresh').length;
  const expiringCount = items.filter(i => i.freshness_status === 'Expiring Soon').length;
  const expiredCount  = items.filter(i => i.freshness_status === 'Expired').length;
  const total         = items.length;

  const freshPct    = total > 0 ? Math.round((freshCount    / total) * 100) : 0;
  const expiringPct = total > 0 ? Math.round((expiringCount / total) * 100) : 0;
  const expiredPct  = total > 0 ? Math.round((expiredCount  / total) * 100) : 0;

  // Named item lists for action report
  const expiringNames = items.filter(i => i.freshness_status === 'Expiring Soon').map(i => i.item_name);
  const expiredNames  = items.filter(i => i.freshness_status === 'Expired').map(i => i.item_name);

  // ── SVG circular progress ──────────────────────────────────────────────────
  const radius       = 70;
  const strokeWidth  = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // ── Grade & colour ─────────────────────────────────────────────────────────
  const getGrade = (val: number) => {
    if (val >= 90) return { grade: 'A+', label: 'Excellent',          color: 'var(--fresh)',    bg: 'var(--fresh-bg)' };
    if (val >= 75) return { grade: 'A',  label: 'Good',               color: 'var(--fresh)',    bg: 'var(--fresh-bg)' };
    if (val >= 60) return { grade: 'B',  label: 'Fair',               color: 'var(--expiring)', bg: 'var(--expiring-bg)' };
    if (val >= 40) return { grade: 'C',  label: 'Needs Improvement',  color: 'var(--expiring)', bg: 'var(--expiring-bg)' };
    return          { grade: 'D',  label: 'Critical Waste Risk',  color: 'var(--expired)',  bg: 'var(--expired-bg)' };
  };
  const grade = getGrade(score);

  // ── Tip cards ──────────────────────────────────────────────────────────────
  const tips = [
    { emoji: '🧊', title: 'Chill Correctly',   body: 'Store leafy greens (Coriander) in a damp paper towel inside a sealed bag — extends life by 3–5 days.' },
    { emoji: '🍌', title: 'Ethylene Awareness', body: 'Keep Bananas, Tomatoes & Avocados away from Grapes & Strawberries — ethylene gas accelerates ripening.' },
    { emoji: '🥑', title: 'Avocado Hack',       body: 'Store a cut avocado with the pit and a squeeze of lemon juice to slow browning by up to 24 hours.' },
    { emoji: '🍓', title: 'Berry Storage',      body: 'Never wash strawberries before storage — moisture causes mould. Wash only right before eating.' },
  ];

  return (
    <div className="animated">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Health Analytics</h1>
          <p className="page-subtitle">Live freshness breakdown, health score, and waste prevention tips</p>
        </div>
      </div>

      <div className="widgets-container">
        {/* ── Left: Circular Score ── */}
        <div className="widget" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 24px' }}>
          <h3 className="widget-title" style={{ marginBottom: 28 }}>Kitchen Health Score</h3>

          <div className="circular-progress">
            <svg width="180" height="180" viewBox="0 0 160 160">
              <circle
                className="circular-progress-circle-bg"
                cx="80" cy="80" r={radius}
                strokeWidth={strokeWidth}
              />
              <circle
                className="circular-progress-circle-bar"
                cx="80" cy="80" r={radius}
                strokeWidth={strokeWidth}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  stroke: grade.color,
                  transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            </svg>
            <div className="circular-progress-value">
              <span style={{ color: grade.color }}>{score}</span>
              <span className="circular-progress-label">/ 100</span>
            </div>
          </div>

          {/* Grade badge */}
          <div style={{
            marginTop: 24,
            padding: '10px 28px',
            borderRadius: 'var(--radius-full)',
            background: grade.bg,
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: grade.color, letterSpacing: -1 }}>
              {grade.grade}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: grade.color }}>
              {grade.label}
            </span>
          </div>

          {/* Score breakdown legend */}
          <div style={{ marginTop: 28, width: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>−15 pts per expired item</span>
              <span style={{ color: 'var(--expired)', fontWeight: 700 }}>×{expiredCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>−5 pts per expiring item</span>
              <span style={{ color: 'var(--expiring)', fontWeight: 700 }}>×{expiringCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontWeight: 600 }}>Current Score</span>
              <span style={{ fontWeight: 800, color: grade.color }}>{score}/100</span>
            </div>
          </div>
        </div>

        {/* ── Right: Stats + Action Report ── */}
        <div className="widget-section">

          {/* Freshness Distribution */}
          <div className="widget">
            <h3 className="widget-title" style={{ marginBottom: 20 }}>Freshness Distribution</h3>

            {total === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <span className="empty-state-icon" style={{ fontSize: 32 }}>📊</span>
                <p style={{ margin: 0 }}>Add items to your inventory to see the freshness breakdown.</p>
              </div>
            ) : (
              <div>
                {/* Stacked bar */}
                <div style={{
                  display: 'flex', height: 28, borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', marginBottom: 24,
                  border: '1px solid var(--border-color)',
                }}>
                  {freshCount > 0 && (
                    <div style={{ width: `${freshPct}%`, background: 'var(--fresh)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                      {freshPct}%
                    </div>
                  )}
                  {expiringCount > 0 && (
                    <div style={{ width: `${expiringPct}%`, background: 'var(--expiring)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                      {expiringPct}%
                    </div>
                  )}
                  {expiredCount > 0 && (
                    <div style={{ width: `${expiredPct}%`, background: 'var(--expired)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                      {expiredPct}%
                    </div>
                  )}
                  {total > 0 && freshCount === 0 && expiringCount === 0 && expiredCount === 0 && (
                    <div style={{ width: '100%', background: 'var(--border-color)' }} />
                  )}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Fresh',         count: freshCount,    pct: freshPct,    color: 'var(--fresh)',    bg: 'var(--fresh-bg)' },
                    { label: 'Expiring Soon', count: expiringCount, pct: expiringPct, color: 'var(--expiring)', bg: 'var(--expiring-bg)' },
                    { label: 'Expired',       count: expiredCount,  pct: expiredPct,  color: 'var(--expired)',  bg: 'var(--expired-bg)' },
                  ].map(({ label, count, pct, color, bg }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '2px 10px',
                        borderRadius: 'var(--radius-full)', background: bg, color,
                      }}>
                        {count} item{count !== 1 ? 's' : ''} · {pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Report */}
          <div className="widget">
            <h3 className="widget-title" style={{ marginBottom: 16 }}>Action Report</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {total === 0 ? (
                <p>💡 Add fresh produce via <strong>Add Item</strong> to start kitchen diagnostics.</p>
              ) : score === 100 ? (
                <div style={{ padding: '14px 16px', background: 'var(--fresh-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--fresh-border)' }}>
                  <p>✅ <strong style={{ color: 'var(--fresh)' }}>Perfect Score!</strong> All your produce is fresh and well-managed. Keep logging items as you purchase them.</p>
                </div>
              ) : (
                <>
                  {expiredCount > 0 && (
                    <div style={{ padding: '14px 16px', background: 'var(--expired-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--expired-border)' }}>
                      <p>🗑️ <strong style={{ color: 'var(--expired)' }}>Remove Expired Items:</strong> {expiredNames.join(', ')} — removing them will recover <strong>{expiredCount * 15} points</strong> immediately.</p>
                    </div>
                  )}
                  {expiringCount > 0 && (
                    <div style={{ padding: '14px 16px', background: 'var(--expiring-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--expiring-border)' }}>
                      <p>⏰ <strong style={{ color: 'var(--expiring)' }}>Use Today:</strong> {expiringNames.join(', ')} — consuming them will recover <strong>{expiringCount * 5} points</strong>.</p>
                    </div>
                  )}
                  <p style={{ fontSize: 13 }}>
                    Potential max score if all items consumed: <strong style={{ color: 'var(--primary)' }}>100/100</strong>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Storage Tips ── */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 16 }}>Storage Tips to Extend Shelf Life</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {tips.map(tip => (
            <div key={tip.title} className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{tip.emoji}</div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{tip.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
