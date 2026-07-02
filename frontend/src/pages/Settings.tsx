import React, { useState } from 'react';

interface SettingsProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onSeedDemoData: () => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  apiKey,
  onSaveApiKey,
  onSeedDemoData,
  onResetDatabase
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [seedLoading, setSeedLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveKey = () => {
    onSaveApiKey(keyInput);
    setMsg({ type: 'success', text: 'Gemini API Key saved locally!' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSeed = async () => {
    if (window.confirm('This will insert demo items (fresh, expiring, expired) into your inventory. Continue?')) {
      setSeedLoading(true);
      setMsg(null);
      try {
        await onSeedDemoData();
        setMsg({ type: 'success', text: 'Successfully seeded demo produce items!' });
      } catch (err) {
        setMsg({ type: 'error', text: 'Failed to seed demo data.' });
      }
      setSeedLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to clear ALL inventory items? This cannot be undone.')) {
      setResetLoading(true);
      setMsg(null);
      try {
        await onResetDatabase();
        setMsg({ type: 'success', text: 'Database reset successfully!' });
      } catch (err) {
        setMsg({ type: 'error', text: 'Failed to reset database.' });
      }
      setResetLoading(false);
    }
  };

  return (
    <div className="animated" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure FreshTrack AI, API keys, and database controls</p>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: msg.type === 'success' ? 'var(--status-fresh-bg)' : 'var(--status-expired-bg)',
          color: msg.type === 'success' ? 'var(--status-fresh)' : 'var(--status-expired)',
          fontWeight: '600',
          fontSize: '14px',
          marginBottom: '20px',
          border: `1px solid ${msg.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`
        }}>
          {msg.text}
        </div>
      )}

      {/* API Key Panel */}
      <div className="settings-section">
        <h3 className="settings-section-title">Gemini AI Configuration</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
          By default, FreshTrack AI uses a local rules-based engine for recipe recommendations. Enter a Google Gemini API Key to enable real generative responses. The key is stored safely in your browser.
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="apiKey">Gemini API Key</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              id="apiKey"
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="form-control"
              style={{ flex: 1 }}
            />
            <button onClick={handleSaveKey} className="btn btn-primary">Save Key</button>
          </div>
        </div>
      </div>

      {/* Database Controls */}
      <div className="settings-section">
        <h3 className="settings-section-title">System & Database Controls</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Admin operations to seed, test, or clear database state.
        </p>

        <div className="settings-row">
          <div className="settings-info">
            <h4>Seed Demo Produce</h4>
            <p>Populate the database with items of varying freshness (Banana, Tomato, Coriander, Lemon) for instant preview.</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seedLoading || resetLoading}
            className="btn btn-secondary"
            style={{ minWidth: '130px' }}
          >
            {seedLoading ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-info">
            <h4>Reset Database</h4>
            <p>Delete all kitchen items in SQLite database. This clears active inventory and resets health score to 100.</p>
          </div>
          <button
            onClick={handleReset}
            disabled={seedLoading || resetLoading}
            className="btn btn-danger"
            style={{ minWidth: '130px' }}
          >
            {resetLoading ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="settings-section" style={{ backgroundColor: 'transparent', borderStyle: 'dashed' }}>
        <h3 className="settings-section-title" style={{ border: 'none' }}>About FreshTrack AI</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          FreshTrack AI version 1.0.0 (Beta)<br />
          Developed for pair programming with Antigravity AI.<br />
          Built using Python (FastAPI), SQLite, React, and TypeScript.
        </p>
      </div>
    </div>
  );
};
