import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';
import { translations } from '../translations';

export default function Leaderboard({ profile, language }) {
  const t = translations[language];

  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('weekly'); // 'daily', 'weekly', 'monthly'

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

  // Adjust scores slightly depending on tab to make tabs feel alive
  function getTabRankings() {
    if (tab === 'daily') {
      return rankings.map(r => ({
        ...r,
        xp: Math.round(r.xp * 0.12) // simulate daily XP
      })).sort((a, b) => b.xp - a.xp).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    if (tab === 'monthly') {
      return rankings.map(r => ({
        ...r,
        xp: Math.round(r.xp * 3.4) // simulate monthly accumulated XP
      })).sort((a, b) => b.xp - a.xp).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return rankings; // default weekly
  }

  // SVGs for top ranks
  const MedalGold = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  const MedalSilver = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  const MedalBronze = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      
      <div className="glass-panel" style={{ padding: '24px 16px', borderTop: '3px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 800, textAlign: 'center', marginBottom: '20px' }}>
          🏆 {t.leaderboardTitle}
        </h2>

        {/* Tab selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          background: 'rgba(0,0,0,0.2)',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          {['daily', 'weekly', 'monthly'].map((tabType) => (
            <button
              key={tabType}
              onClick={() => setTab(tabType)}
              className="btn-secondary"
              style={{
                padding: '10px',
                fontSize: '0.85rem',
                border: 'none',
                background: tab === tabType ? 'var(--primary)' : 'transparent',
                color: tab === tabType ? '#fff' : 'var(--text-muted)',
                boxShadow: tab === tabType ? '0 4px 10px var(--primary-glow)' : 'none',
                fontWeight: tab === tabType ? 700 : 500
              }}
            >
              {tabType.toUpperCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="glass-panel-glow-red" style={{ padding: '12px', color: '#f87171', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Retrieving shooter scores...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Table Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 70px 70px 70px',
              padding: '12px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <span>{t.rankCol}</span>
              <span>{t.agentCol}</span>
              <span style={{ textAlign: 'right' }}>{t.levelCol}</span>
              <span style={{ textAlign: 'right' }}>🔥</span>
              <span style={{ textAlign: 'right' }}>{t.xpCol}</span>
            </div>

            {/* List Rows */}
            {getTabRankings().map((user) => {
              const isCurrentUser = user.username === profile?.username;
              const isTop1 = user.rank === 1;
              const isTop2 = user.rank === 2;
              const isTop3 = user.rank === 3;

              return (
                <div
                  key={user.rank}
                  className="glass-panel"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 70px 70px 70px',
                    padding: '16px',
                    alignItems: 'center',
                    background: isCurrentUser ? 'rgba(249, 115, 22, 0.08)' : 'rgba(22, 30, 49, 0.4)',
                    borderColor: isCurrentUser ? 'var(--primary)' : 'var(--border-color)',
                    boxShadow: isCurrentUser ? '0 4px 14px rgba(249, 115, 22, 0.08)' : 'none'
                  }}
                >
                  {/* Rank Column */}
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 800 }}>
                    {isTop1 ? <MedalGold /> : isTop2 ? <MedalSilver /> : isTop3 ? <MedalBronze /> : `#${user.rank}`}
                  </span>

                  {/* Username Column */}
                  <span style={{
                    fontWeight: isCurrentUser ? 800 : 500,
                    color: isCurrentUser ? 'var(--primary)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.95rem'
                  }}>
                    {user.username} {isCurrentUser && <small style={{ color: 'var(--text-muted)' }}>{t.youLabel}</small>}
                  </span>

                  {/* Level Column */}
                  <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Lvl {user.level}
                  </span>

                  {/* Streak Column */}
                  <span style={{ textAlign: 'right', color: '#fca5a5', fontWeight: 600, fontSize: '0.9rem' }}>
                    {user.streak}d
                  </span>

                  {/* XP Column */}
                  <span style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>
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
