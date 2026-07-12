import { translations } from '../translations';
import { getDaysSinceLastStudy } from '../utils/streak';
import LlamaNag from './LlamaNag';
import LessonPath from './LessonPath';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate, language }) {
  const t = translations[language];

  if (!profile) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dossier...</div>;

  function handleStudyNow() {
    const nextLesson = lessons.find((l) => l.isUnlocked && !l.isCompleted);
    if (nextLesson) {
      onSelectLesson(nextLesson);
    } else {
      onNavigate('quiz');
    }
  }

  // Level progress calculations
  const xp = profile.xp || 0;
  const level = profile.level || 1;
  
  const prevLevelThreshold = Math.pow(level - 1, 2) * 100;
  const nextLevelThreshold = Math.pow(level, 2) * 100;
  
  const levelRange = nextLevelThreshold - prevLevelThreshold;
  const currentProgress = xp - prevLevelThreshold;
  const progressPercent = Math.min(Math.max((currentProgress / levelRange) * 100, 0), 100);

  // SVG icons
  const FireIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>
  );

  const TrophyIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#eab308' }}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path>
      <path d="M12 2a7 7 0 0 0-7 7v4.66a7 7 0 0 0 14 0V9a7 7 0 0 0-7-7z"></path>
    </svg>
  );

  // Badge definitions
  const badgeDefinitions = [
    { id: 'first_lesson', label: t.badge_first_lesson, desc: t.desc_badge_first_lesson, color: 'var(--primary)', icon: '🔫' },
    { id: 'streak_3', label: t.badge_streak_3, desc: t.desc_badge_streak_3, color: 'var(--warning)', icon: '🎯' },
    { id: 'streak_7', label: t.badge_streak_7, desc: t.desc_badge_streak_7, color: '#ef4444', icon: '🔥' },
    { id: 'pang_sniper', label: t.badge_pang_sniper, desc: t.desc_badge_pang_sniper, color: 'var(--success)', icon: '💥' },
    { id: 'topic_master', label: t.badge_topic_master, desc: t.desc_badge_topic_master, color: '#8b5cf6', icon: '🎖' },
    { id: 'xp_1000', label: t.badge_xp_1000, desc: t.desc_badge_xp_1000, color: '#ec4899', icon: '👑' }
  ];

  const unlockedBadgeIds = (profile.badges || []).map(b => b.badge_id);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>

      <LlamaNag
        daysSince={getDaysSinceLastStudy()}
        language={language}
        onStudyNow={handleStudyNow}
      />

      {/* SECTION 1: Stats Header & Level Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t.statsTitle}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{t.welcomeUser}, <strong style={{ color: 'var(--text-main)' }}>{profile.username}</strong></p>
            </div>
            
            {/* Streak Indicator (Duolingo style yellow tactile badge) */}
            <div className="streak-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              borderRadius: '14px'
            }}>
              <FireIcon />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#fffdf0', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>{t.streakLabel}</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>{profile.streak || 0} {language === 'vn' ? 'ngày' : 'days'}</span>
              </div>
            </div>
          </div>

          {/* XP & Level progress bar */}
          <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                {t.levelLabel}: <strong style={{ color: 'var(--info)' }}>Lvl {level}</strong>
              </span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
                {xp} / {nextLevelThreshold} XP
              </span>
            </div>
            
            {/* Custom progress bar */}
            <div style={{
              height: '16px',
              background: '#e5e5e5',
              borderRadius: '99px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--success)',
                borderRadius: '99px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
              {profile.streak > 0 ? t.streakActive : t.streakBroken}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Roadmaps & Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Topic Roadmap — Everest climb path */}
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '18px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏔️</span> {t.lessonsProgress}
          </h3>

          <LessonPath lessons={lessons} onSelectLesson={onSelectLesson} language={language} />
        </div>

        {/* Badges Cabinet */}
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '18px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyIcon /> {t.badgesTitle}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '16px'
          }}>
            {badgeDefinitions.map((badge) => {
              const isUnlocked = unlockedBadgeIds.includes(badge.id);

              return (
                <div key={badge.id} className="glass-panel" style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: isUnlocked ? '#ffffff' : '#f1f3f5',
                  borderColor: isUnlocked ? badge.color : 'var(--border-color)',
                  borderBottomWidth: isUnlocked ? '6px' : '2px',
                  filter: isUnlocked ? 'none' : 'grayscale(100%)',
                  opacity: isUnlocked ? 1 : 0.6
                }}>
                  <span style={{
                    fontSize: '2.4rem',
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    {badge.icon}
                  </span>
                  
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: isUnlocked ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                    {badge.label}
                  </h5>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3', fontWeight: 500 }}>
                    {badge.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
