import { useState, useEffect } from 'react';
import { getProfile, getLessons } from './utils/api';
import { translations } from './translations';
import { getMuteState, setMuteState } from './utils/sound';
import { markStudiedToday, ensureStudyTrackingInitialized } from './utils/streak';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Learn from './components/Learn';
import Quiz from './components/Quiz';
import Flashcards from './components/Flashcards';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import { Home, Target, Layers, Trophy, Settings as SettingsIcon, Volume2, VolumeX, BookOpen } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [activeLesson, setActiveLesson] = useState(null);
  const [muted, setMuted] = useState(getMuteState());
  const [effects, setEffects] = useState([]);

  useEffect(() => {
    if (localStorage.getItem('pang_chiu_token')) setSession({ username: 'Agent' });
  }, []);

  useEffect(() => {
    if (session) { ensureStudyTrackingInitialized(); fetchUserDossier(); }
    else { setProfile(null); setLessons([]); setActiveTab('home'); setActiveLesson(null); }
  }, [session]);

  useEffect(() => {
    function handleShootEffect(e) {
      const { type, x, y } = e.detail;
      const id = `${type}_${Date.now()}_${Math.random()}`;
      let ef = { id, type, x, y };
      if (type === 'pang') {
        ef.sparks = Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4, d = 40 + Math.random() * 50;
          return { dx: Math.cos(a) * d, dy: Math.sin(a) * d };
        });
      } else {
        ef.angle = `${-20 + Math.random() * 40}deg`;
        ef.dx = `${-30 + Math.random() * 60}px`;
        ef.dy = `${-20 - Math.random() * 30}px`;
      }
      setEffects(p => [...p, ef]);
      setTimeout(() => setEffects(p => p.filter(e => e.id !== id)), 800);
    }
    window.addEventListener('pang-chiu-effect', handleShootEffect);
    return () => window.removeEventListener('pang-chiu-effect', handleShootEffect);
  }, []);

  async function fetchUserDossier() {
    try { setProfile(await getProfile()); setLessons(await getLessons()); }
    catch { handleLogout(); }
  }
  function handleLogout() { localStorage.removeItem('pang_chiu_token'); setSession(null); }
  function handleLessonFinished(xp) { setActiveLesson(null); if (xp !== null) { markStudiedToday(); fetchUserDossier(); } }
  function handleQuizFinished() { markStudiedToday(); fetchUserDossier(); setActiveTab('home'); }

  const t = translations; // Now just a single dict

  const NAV = [
    { id: 'home',        icon: Home,        label: t.navHome },
    { id: 'quiz',        icon: Target,      label: t.navQuiz },
    { id: 'flashcards',  icon: Layers,      label: t.navFlashcards },
    { id: 'leaderboard', icon: Trophy,      label: t.navLeaderboard },
    { id: 'settings',    icon: SettingsIcon,label: t.navSettings },
  ];

  /* ── Auth ─────────────────────────────────────────────── */
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <header className="bg-white border-b-3 border-[#101A24]/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
            <span className="font-extrabold text-2xl tracking-tight flex items-center gap-3 text-[#101A24]">
              <span className="w-10 h-10 bg-[#9FE870] border border-[#101A24]/10 rounded-lg shadow-sm flex items-center justify-center">
                <Target size={18} strokeWidth={3} className="text-[#101A24]" />
              </span>
              Pằng Chíu Á!
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Auth setSession={setSession} />
        </div>
      </div>
    );
  }

  /* ── Main App (Sidebar / Bottom Tab layout) ───────────────── */
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
      
      {/* ── Sidebar (Desktop) ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r-3 border-[#101A24]/10 sticky top-0 h-screen shrink-0">
        <div className="p-6 border-b-3 border-[#101A24]/10">
          <button onClick={() => { setActiveLesson(null); setActiveTab('home'); }} className="flex items-center gap-3 font-extrabold text-2xl tracking-tight text-[#101A24]">
            <span className="w-10 h-10 bg-[#9FE870] border border-[#101A24]/10 rounded shadow-sm flex items-center justify-center">
              <Target size={20} strokeWidth={3} className="text-[#101A24]" />
            </span>
            <span>Pằng Chíu!</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-3">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id && !activeLesson;
            return (
              <button key={id} onClick={() => { setActiveLesson(null); setActiveTab(id); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-extrabold uppercase tracking-widest transition-all border ${
                  active
                    ? 'bg-[#101A24] border-[#101A24]/10 text-white shadow-sm -translate-y-1 -translate-x-1'
                    : 'bg-white border-transparent text-[#101A24] hover:border-[#101A24]/10 hover:shadow-sm'
                }`}
              >
                <Icon size={24} strokeWidth={active ? 3 : 2} /> {label}
              </button>
            );
          })}
        </nav>

        {profile && (
          <div className="p-6 border-t-3 border-[#101A24]/10 bg-[#F9FAFB] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{profile.username}</span>
                <span className="text-sm font-extrabold uppercase tracking-widest text-[#101A24]">LV. {profile.level}</span>
              </div>
              <span className="text-sm font-extrabold uppercase tracking-widest bg-[#00B4D8] text-[#101A24] px-3 py-1.5 rounded-lg border border-[#101A24]/10 shadow-sm -rotate-3">
                {profile.xp.toLocaleString()} XP
              </span>
            </div>
            
            <button onClick={() => { const n = !muted; setMuted(n); setMuteState(n); }}
              className="w-full py-2 rounded-lg border border-[#101A24]/10 bg-white shadow-sm flex items-center justify-center text-[#101A24] hover:bg-[#9FE870] transition-colors font-extrabold text-xs uppercase tracking-widest gap-2"
            >
              {muted ? <VolumeX size={16} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={3} />}
              {muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            </button>
          </div>
        )}
      </aside>

      {/* ── Top Bar (Mobile Only) ─────────────────────────────── */}
      <header className="md:hidden bg-white border-b-3 border-[#101A24]/10 sticky top-0 z-50 shadow-[0_4px_0_rgba(0,0,0,0.05)]">
        <div className="px-4 h-16 flex items-center justify-between">
          <button onClick={() => { setActiveLesson(null); setActiveTab('home'); }} className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-[#101A24]">
            <span className="w-8 h-8 bg-[#9FE870] border border-[#101A24]/10 rounded shadow-sm flex items-center justify-center">
              <Target size={16} strokeWidth={3} className="text-[#101A24]" />
            </span>
            Pằng Chíu!
          </button>
          
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#00B4D8] text-[#101A24] px-2 py-1 rounded border border-[#101A24]/10 shadow-sm">
                {profile.xp} XP
              </span>
              <button onClick={() => { const n = !muted; setMuted(n); setMuteState(n); }} className="w-8 h-8 rounded border border-[#101A24]/10 bg-white shadow-sm flex items-center justify-center text-[#101A24] active:translate-y-1 active:translate-x-1 active:shadow-none">
                {muted ? <VolumeX size={16} strokeWidth={2.5} /> : <Volume2 size={16} strokeWidth={2.5} />}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Content Area ──────────────────────────────────────── */}
      <main className="flex-1 w-full overflow-y-auto pb-24 md:pb-10 relative">
        <div className="max-w-5xl mx-auto px-4 md:px-12 py-8 md:py-16">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto">
              <Learn lesson={activeLesson} onLessonFinished={handleLessonFinished} />
            </div>
          ) : (
            <>
              {activeTab === 'home' && <Dashboard profile={profile} lessons={lessons} onSelectLesson={setActiveLesson} onNavigate={setActiveTab} />}
              {activeTab === 'quiz' && <div className="max-w-4xl mx-auto"><Quiz onQuizFinished={handleQuizFinished} /></div>}
              {activeTab === 'flashcards' && <div className="max-w-4xl mx-auto"><Flashcards /></div>}
              {activeTab === 'leaderboard' && <div className="max-w-3xl mx-auto"><Leaderboard profile={profile} /></div>}
              {activeTab === 'settings' && <div className="max-w-2xl mx-auto"><Settings profile={profile} setSession={setSession} onMuteToggled={setMuted} /></div>}
            </>
          )}
        </div>
      </main>

      {/* ── Bottom Tab Bar (Mobile Only) ──────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-3 border-[#101A24]/10 pb-safe shadow-[0_-4px_0_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id && !activeLesson;
            return (
              <button key={id} onClick={() => { setActiveLesson(null); setActiveTab(id); }}
                className={`flex flex-col items-center gap-1 w-16 transition-colors ${active ? 'text-[#101A24]' : 'text-[#888]'}`}
              >
                <div className={`flex items-center justify-center w-12 h-10 rounded-2xl border ${active ? 'bg-[#9FE870] border-[#101A24]/10 shadow-sm -translate-y-1' : 'bg-transparent border-transparent'}`}>
                  <Icon size={20} strokeWidth={active ? 3 : 2} />
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-0'} transition-opacity`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── FX ───────────────────────────────────────────── */}
      <div className="shoot-feedback-container">
        {effects.map(ef => ef.type === 'pang' ? (
          <div key={ef.id}>
            <div className="pang-ripple" style={{ left: ef.x, top: ef.y }} />
            <div className="pang-target" style={{ left: ef.x, top: ef.y }} />
            {ef.sparks.map((s, i) => <div key={i} className="pang-spark" style={{ left: ef.x, top: ef.y, '--x': `${s.dx}px`, '--y': `${s.dy}px` }} />)}
          </div>
        ) : (
          <div key={ef.id}>
            <div className="chiu-line" style={{ top: ef.y, '--angle': ef.angle }} />
            <div className="chiu-dust" style={{ left: ef.x, top: ef.y, '--dx': ef.dx, '--dy': ef.dy }} />
          </div>
        ))}
      </div>
    </div>
  );
}
