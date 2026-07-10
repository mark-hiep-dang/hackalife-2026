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
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      
      <div className="glass-panel" style={{ padding: '32px', borderTop: '3px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.7rem', fontWeight: 800, textAlign: 'center', marginBottom: '24px' }}>
          ⚙️ {t.navSettings}
        </h2>

        {message && (
          <div className="glass-panel-glow-green" style={{
            background: 'rgba(16, 185, 129, 0.05)',
            padding: '12px',
            color: 'var(--success)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Language selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              🌐 {language === 'vn' ? 'Ngôn Ngữ Học Tập:' : 'Bilingual Study Language:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

          {/* Sound Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#fff', display: 'block' }}>
                🔊 {language === 'vn' ? 'Hiệu Ứng Âm Thanh Pằng/Chíu:' : 'Gunshot Sound Effects:'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {language === 'vn' ? 'Tắt âm để tự học trong yên tĩnh' : 'Mute to study silently in public'}
              </span>
            </div>

            <button
              onClick={handleToggleMute}
              className={muted ? 'btn-secondary' : 'btn-success'}
              style={{
                padding: '10px 20px',
                background: muted ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 700
              }}
            >
              {muted ? (language === 'vn' ? 'Đã Tắt 🔇' : 'Muted 🔇') : (language === 'vn' ? 'Bật 🔊' : 'Active 🔊')}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* Llama configuration settings */}
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
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

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px' }} />

          {/* Exit account buttons */}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '14px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.03)'
            }}
          >
            🚪 {t.logout}
          </button>

        </div>
      </div>

    </div>
  );
}
