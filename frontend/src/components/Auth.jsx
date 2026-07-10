import { useState } from 'react';
import { login, register } from '../utils/api';
import { translations } from '../translations';
import { playPang } from '../utils/sound';

export default function Auth({ setSession, language }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let user;
      if (isRegister) {
        user = await register(username, password);
      } else {
        user = await login(username, password);
      }
      playPang(); // Play gunshot on successful login/signup!
      setSession(user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '70vh',
      padding: '16px'
    }}>
      <div className="glass-panel fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '36px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)', letterSpacing: '-0.03em' }}>
            {isRegister ? t.registerTitle : t.loginTitle}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {t.tagline}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--primary-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.usernameLabel}
            </label>
            <input
              type="text"
              className="glass-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. agent_sniper"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.passwordLabel}
            </label>
            <input
              type="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '14px' }}>
            {loading ? 'Processing...' : (isRegister ? t.registerBtn : t.loginBtn)}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegister ? t.hasAccount : t.noAccount}{' '}
          </span>
          <button
            onClick={() => {
              setError('');
              setIsRegister(!isRegister);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            {isRegister ? t.switchLogin : t.switchRegister}
          </button>
        </div>
      </div>
    </div>
  );
}
