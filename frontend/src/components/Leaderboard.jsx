import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';
import { translations } from '../translations';

export default function Leaderboard({ profile, language }) {
  const t = translations[language];

  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('weekly');

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard();
      setRankings(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }

  function getTabRankings() {
    if (tab === 'daily') {
      return rankings.map(r => ({ ...r, xp: Math.round(r.xp * 0.12) })).sort((a, b) => b.xp - a.xp).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    if (tab === 'monthly') {
      return rankings.map(r => ({ ...r, xp: Math.round(r.xp * 3.4) })).sort((a, b) => b.xp - a.xp).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return rankings;
  }

  const medalEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      <div className="glass-panel" style={{ padding: '28px 24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textAlign: 'center', marginBottom: '20px', letterSpacing: '-0.03em', color: 'var(--text-dark)' }}>
          🏆 {t.leaderboardTitle}
        </h2>

        {/* Tab Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '4px',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          {['daily', 'weekly', 'monthly'].map((tabType) => (
            <button
              key={tabType}
              onClick={() => setTab(tabType)}
              style={{
                padding: '8px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: tab === tabType ? 'var(--bg-card)' : 'transparent',
                color: tab === tabType ? 'var(--text-dark)' : 'var(--text-muted)',
                boxShadow: tab === tabType ? 'var(--shadow-sm)' : 'none',
                fontWeight: tab === tabType ? 700 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}
            >
              {tabType}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(239,68,68,0.15)', padding: '10px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Loading rankings...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '42px 1fr 60px 52px 70px',
              padding: '10px 16px',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <span>{t.rankCol}</span>
              <span>{t.agentCol}</span>
              <span style={{ textAlign: 'right' }}>{t.levelCol}</span>
              <span style={{ textAlign: 'right' }}>🔥</span>
              <span style={{ textAlign: 'right' }}>{t.xpCol}</span>
            </div>

            {/* Rows */}
            {getTabRankings().map((user) => {
              const isCurrentUser = user.username === profile?.username;

              return (
                <div
                  key={user.rank}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr 60px 52px 70px',
                    padding: '12px 16px',
                    alignItems: 'center',
                    background: isCurrentUser ? 'var(--primary-subtle)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background var(--transition)'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {medalEmojis[user.rank] || `#${user.rank}`}
                  </span>

                  <span style={{
                    fontWeight: isCurrentUser ? 700 : 500,
                    color: isCurrentUser ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {user.username}
                    {isCurrentUser && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.youLabel}</span>}
                  </span>

                  <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    Lvl {user.level}
                  </span>

                  <span style={{ textAlign: 'right', color: 'var(--warning-dark)', fontWeight: 600, fontSize: '0.825rem' }}>
                    {user.streak}d
                  </span>

                  <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success-dark)', fontSize: '0.875rem' }}>
                    {user.xp}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
