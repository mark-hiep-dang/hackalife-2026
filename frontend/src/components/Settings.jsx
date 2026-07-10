import { useState } from 'react';
import { translations } from '../translations';
import { logout } from '../utils/api';
import { getMuteState, setMuteState } from '../utils/sound';

export default function Settings({ profile, setSession, language, setLanguage, onMuteToggled }) {
  const t = translations[language];

  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434');
  const [muted, setMuted] = useState(getMuteState());
  const [message, setMessage] = useState('');

  function handleSaveSettings(e) {
    e.preventDefault();
    localStorage.setItem('pang_chiu_ollama_url', ollamaUrl);
    setMessage('Settings applied successfully! / Cấu hình đã được lưu!');
    setTimeout(() => setMessage(''), 3000);
  }

  function handleToggleMute() {
    const nextMute = !muted;
    setMuted(nextMute);
    setMuteState(nextMute);
    onMuteToggled(nextMute);
  }

  function handleLogout() {
    logout();
    setSession(null);
  }

  return (
    <div className="fade-in" style={{ maxWidth: '520px', margin: '0 auto' }}>
      
      <div className="glass-panel" style={{ padding: '32px 28px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textAlign: 'center', marginBottom: '24px', letterSpacing: '-0.03em', color: 'var(--text-dark)' }}>
          ⚙️ {t.navSettings}
        </h2>

        {message && (
          <div style={{
            background: 'var(--success-subtle)',
            border: '1px solid rgba(34,197,94,0.2)',
            padding: '10px 14px',
            color: 'var(--success-dark)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Language */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🌐 {language === 'vn' ? 'Ngôn Ngữ Học Tập:' : 'Study Language:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '12px' }}
              >
                English (EN)
              </button>
              <button
                onClick={() => setLanguage('vn')}
                className={language === 'vn' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '12px' }}
              >
                Tiếng Việt (VN)
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* Sound */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)', display: 'block' }}>
                🔊 {language === 'vn' ? 'Hiệu Ứng Âm Thanh' : 'Sound Effects'}
              </strong>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {language === 'vn' ? 'Tắt âm để tự học yên tĩnh' : 'Mute for silent study'}
              </span>
            </div>

            <button
              onClick={handleToggleMute}
              className={muted ? 'btn-secondary' : 'btn-success'}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {muted ? (language === 'vn' ? 'Tắt 🔇' : 'Muted 🔇') : (language === 'vn' ? 'Bật 🔊' : 'Active 🔊')}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* Llama Config */}
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                🦙 {t.connectionConfig}
              </label>
              <input
                type="text"
                className="glass-input"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
              {t.saveConfig}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'var(--primary-subtle)',
              color: 'var(--danger)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all var(--transition)'
            }}
          >
            🚪 {t.logout}
          </button>

        </div>
      </div>

    </div>
  );
}
