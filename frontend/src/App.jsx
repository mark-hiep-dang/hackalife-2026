import { useState, useEffect } from 'react';
import { getProfile, getLessons } from './utils/api';
import { translations } from './translations';
import { getMuteState, setMuteState } from './utils/sound';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Learn from './components/Learn';
import Quiz from './components/Quiz';
import Chat from './components/Chat';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('home');
  const [activeLesson, setActiveLesson] = useState(null);
  
  // Settings
  const [language, setLanguage] = useState('vn'); // 'vn' by default
  const [muted, setMuted] = useState(getMuteState());

  // Gunshot Visual Effects State
  const [effects, setEffects] = useState([]);

  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem('pang_chiu_token');
    if (token) {
      // Just set a temporary session object, the profile fetch will validate it
      setSession({ username: 'Agent' });
    }
  }, []);

  // Fetch data whenever user session changes
  useEffect(() => {
    if (session) {
      fetchUserDossier();
    } else {
      setProfile(null);
      setLessons([]);
      setActiveTab('home');
      setActiveLesson(null);
    }
  }, [session]);

  // Listener for dynamic gunshot effects
  useEffect(() => {
    function handleShootEffect(e) {
      const { type, x, y } = e.detail;
      const effectId = `${type}_${Date.now()}_${Math.random()}`;

      let newEffect = { id: effectId, type, x, y };

      if (type === 'pang') {
        // Generate coordinates for 8 sparks exploding outward
        const sparks = Array.from({ length: 8 }).map((_, idx) => {
          const angle = (idx * Math.PI) / 4;
          const distance = 40 + Math.random() * 50;
          return {
            dx: Math.cos(angle) * distance,
            dy: Math.sin(angle) * distance
          };
        });
        newEffect.sparks = sparks;
      } else if (type === 'chiu') {
        // Generate random angle and dust dispersion for miss
        newEffect.angle = `${-20 + Math.random() * 40}deg`;
        newEffect.dx = `${-30 + Math.random() * 60}px`;
        newEffect.dy = `${-20 - Math.random() * 30}px`;
      }

      setEffects((prev) => [...prev, newEffect]);

      // Cleanup effect after animation completes (800ms)
      setTimeout(() => {
        setEffects((prev) => prev.filter((eff) => eff.id !== effectId));
      }, 800);
    }

    window.addEventListener('pang-chiu-effect', handleShootEffect);
    return () => window.removeEventListener('pang-chiu-effect', handleShootEffect);
  }, []);

  async function fetchUserDossier() {
    try {
      const prof = await getProfile();
      const les = await getLessons();
      setProfile(prof);
      setLessons(les);
    } catch (err) {
      console.error('Failed to load user profile, logging out:', err);
      handleLogout();
    }
  }

  function handleLogout() {
    localStorage.removeItem('pang_chiu_token');
    setSession(null);
  }

  // Completing a lesson finishes & updates
  function handleLessonFinished(xp, level, newBadges) {
    setActiveLesson(null);
    if (xp !== null) {
      fetchUserDossier();
    }
  }

  // Completing a quiz triggers review
  function handleQuizFinished(xpEarned, finalLevel, newBadges) {
    fetchUserDossier();
    setActiveTab('home');
  }

  const t = translations[language];

  // If not logged in, render Auth card
  if (!session) {
    return (
      <div style={{ paddingBottom: '40px' }}>
        <header className="app-header" style={{ marginBottom: '40px' }}>
          <div className="header-container">
            <h1 className="brand">Pằng Chíu Á! 🎯</h1>
            <button
              onClick={() => setLanguage(language === 'vn' ? 'en' : 'vn')}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              🌐 {language === 'vn' ? 'English' : 'Tiếng Việt'}
            </button>
          </div>
        </header>
        <Auth setSession={setSession} language={language} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. APP NAVIGATION HEADER */}
      <header className="app-header glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="header-container">
          <div className="brand" onClick={() => { setActiveLesson(null); setActiveTab('home'); }}>
            Pằng Chíu Á! 🎯
          </div>

          <nav className="nav-links">
            <button
              onClick={() => { setActiveLesson(null); setActiveTab('home'); }}
              className={`nav-link ${activeTab === 'home' && !activeLesson ? 'active' : ''}`}
            >
              {t.navHome}
            </button>
            <button
              onClick={() => { setActiveLesson(null); setActiveTab('quiz'); }}
              className={`nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
            >
              {t.navQuiz}
            </button>
            <button
              onClick={() => { setActiveLesson(null); setActiveTab('chat'); }}
              className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
            >
              {t.navChat}
            </button>
            <button
              onClick={() => { setActiveLesson(null); setActiveTab('leaderboard'); }}
              className={`nav-link ${activeTab === 'leaderboard' ? 'active' : ''}`}
            >
              {t.navLeaderboard}
            </button>
            <button
              onClick={() => { setActiveLesson(null); setActiveTab('settings'); }}
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            >
              {t.navSettings}
            </button>
          </nav>

          {/* Quick Stats & Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {profile && (
              <div style={{
                background: '#ffffff',
                border: '2px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}>
                ⭐ <strong style={{ color: 'var(--success-dark)' }}>{profile.xp} XP</strong> | Lvl <strong style={{ color: 'var(--info-dark)' }}>{profile.level}</strong>
              </div>
            )}

            {/* Quick Mute Toggle */}
            <button
              onClick={() => {
                const nextMuted = !muted;
                setMuted(nextMuted);
                setMuteState(nextMuted);
              }}
              style={{
                background: '#ffffff',
                border: '2px solid var(--border-color)',
                borderBottom: '4px solid var(--border-color)',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: 'var(--text-main)',
                transition: 'all 0.05s ease'
              }}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? '🔇' : '🔊'}
            </button>

            {/* Quick Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'vn' ? 'en' : 'vn')}
              style={{
                background: '#ffffff',
                border: '2px solid var(--border-color)',
                borderBottom: '4px solid var(--border-color)',
                padding: '6px 12px',
                height: '38px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                transition: 'all 0.05s ease'
              }}
            >
              {language === 'vn' ? 'EN' : 'VN'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="app-container" style={{ flex: 1, paddingBottom: '60px' }}>
        {activeLesson ? (
          <Learn
            lesson={activeLesson}
            onLessonFinished={handleLessonFinished}
            language={language}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <Dashboard
                profile={profile}
                lessons={lessons}
                onSelectLesson={setActiveLesson}
                onNavigate={setActiveTab}
                language={language}
              />
            )}
            {activeTab === 'quiz' && (
              <Quiz
                onQuizFinished={handleQuizFinished}
                language={language}
              />
            )}
            {activeTab === 'chat' && (
              <Chat
                language={language}
              />
            )}
            {activeTab === 'leaderboard' && (
              <Leaderboard
                profile={profile}
                language={language}
              />
            )}
            {activeTab === 'settings' && (
              <Settings
                profile={profile}
                setSession={setSession}
                language={language}
                setLanguage={setLanguage}
                onMuteToggled={setMuted}
              />
            )}
          </>
        )}
      </main>

      {/* 3. DYNAMIC GUNSHOT AUDIO-VISUAL EMITTER */}
      <div className="shoot-feedback-container">
        {effects.map((eff) => {
          if (eff.type === 'pang') {
            return (
              <div key={eff.id}>
                {/* Ripple Circle */}
                <div
                  className="pang-ripple"
                  style={{ left: `${eff.x}px`, top: `${eff.y}px` }}
                />
                {/* Target Flash */}
                <div
                  className="pang-target"
                  style={{ left: `${eff.x}px`, top: `${eff.y}px` }}
                />
                {/* Spark Particles */}
                {eff.sparks.map((spark, sIdx) => (
                  <div
                    key={sIdx}
                    className="pang-spark"
                    style={{
                      left: `${eff.x}px`,
                      top: `${eff.y}px`,
                      '--x': `${spark.dx}px`,
                      '--y': `${spark.dy}px`
                    }}
                  />
                ))}
              </div>
            );
          } else if (eff.type === 'chiu') {
            return (
              <div key={eff.id}>
                {/* Bullet Whizzing */}
                <div
                  className="chiu-line"
                  style={{
                    top: `${eff.y}px`,
                    '--angle': eff.angle
                  }}
                />
                {/* Smoke Puff */}
                <div
                  className="chiu-dust"
                  style={{
                    left: `${eff.x}px`,
                    top: `${eff.y}px`,
                    '--dx': eff.dx,
                    '--dy': eff.dy
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

    </div>
  );
}
