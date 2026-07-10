import { translations } from '../translations';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate, language }) {
  const t = translations[language];

  if (!profile) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading dossier...</div>;

  // Level progress calculations
  const xp = profile.xp || 0;
  const level = profile.level || 1;
  
  const prevLevelThreshold = Math.pow(level - 1, 2) * 100;
  const nextLevelThreshold = Math.pow(level, 2) * 100;
  
  const levelRange = nextLevelThreshold - prevLevelThreshold;
  const currentProgress = xp - prevLevelThreshold;
  const progressPercent = Math.min(Math.max((currentProgress / levelRange) * 100, 0), 100);

  // SVG padlocks and checkmarks
  const PadlockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const FireIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
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

  // Badge list data mapping
  const badgeDefinitions = [
    { id: 'first_lesson', label: t.badge_first_lesson, desc: t.desc_badge_first_lesson, color: '#f97316', icon: '🔫' },
    { id: 'streak_3', label: t.badge_streak_3, desc: t.desc_badge_streak_3, color: '#fbbf24', icon: '🎯' },
    { id: 'streak_7', label: t.badge_streak_7, desc: t.desc_badge_streak_7, color: '#ef4444', icon: '🔥' },
    { id: 'pang_sniper', label: t.badge_pang_sniper, desc: t.desc_badge_pang_sniper, color: '#10b981', icon: '💥' },
    { id: 'topic_master', label: t.badge_topic_master, desc: t.desc_badge_topic_master, color: '#8b5cf6', icon: '🎖' },
    { id: 'xp_1000', label: t.badge_xp_1000, desc: t.desc_badge_xp_1000, color: '#ec4899', icon: '👑' }
  ];

  const unlockedBadgeIds = (profile.badges || []).map(b => b.badge_id);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
      
      {/* SECTION 1: Stats Header & Level Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t.statsTitle}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{t.welcomeUser}, <strong style={{ color: 'var(--text-main)' }}>{profile.username}</strong></p>
            </div>
            
            {/* Streak Indicator */}
            <div className="streak-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)'
            }}>
              <FireIcon />
              <div>
                <span style={{ fontSize: '0.8rem', color: '#fca5a5', display: 'block', fontWeight: 500 }}>{t.streakLabel}</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{profile.streak || 0} {language === 'vn' ? 'ngày' : 'days'}</span>
              </div>
            </div>
          </div>

          {/* XP & Level progress bar */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {t.levelLabel}: <strong style={{ color: 'var(--primary)' }}>Lvl {level}</strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {xp} / {nextLevelThreshold} XP
              </span>
            </div>
            
            {/* Custom progress bar */}
            <div style={{
              height: '16px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '99px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(to right, var(--primary) 0%, #facc15 100%)',
                boxShadow: '0 0 10px var(--primary-glow)',
                borderRadius: '99px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {profile.streak > 0 ? t.streakActive : t.streakBroken}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Split Roadmaps & Badges Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Topic Roadmap */}
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '18px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📖</span> {t.lessonsProgress}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {lessons.map((lesson) => {
              const isLocked = !lesson.isUnlocked;
              const isCompleted = lesson.isCompleted;

              return (
                <div key={lesson.id} className="glass-panel" style={{
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: isLocked ? 0.6 : 1,
                  borderLeft: isCompleted 
                    ? '4px solid var(--success)' 
                    : isLocked 
                      ? '4px solid #64748b' 
                      : '4px solid var(--primary)',
                  background: isLocked ? 'rgba(15, 23, 42, 0.4)' : 'var(--bg-card)'
                }}>
                  <div style={{ flex: 1, paddingRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: isCompleted ? 'var(--success)' : isLocked ? '#94a3b8' : 'var(--primary)'
                      }}>
                        {lesson.topic} • {lesson.difficulty}
                      </span>
                      {isCompleted && (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--success)',
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckIcon /> {t.completedStatus}
                        </span>
                      )}
                    </div>
                    
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: isLocked ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      {language === 'vn' ? lesson.title_vn : lesson.title_en}
                    </h4>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {isLocked ? t.lockedLesson : `${JSON.parse(JSON.stringify(lesson.cards)).length} ${language === 'vn' ? 'thẻ ôn tập' : 'flashcards'}`}
                    </p>
                  </div>

                  <div>
                    {isLocked ? (
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        <PadlockIcon />
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectLesson(lesson)}
                        className="btn-primary"
                        style={{ padding: '10px 18px', fontSize: '0.9rem' }}
                      >
                        {t.startLessonBtn}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges Cabinet */}
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '18px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  padding: '16px 12px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: isUnlocked ? 'rgba(22, 30, 49, 0.85)' : 'rgba(15, 23, 42, 0.4)',
                  borderColor: isUnlocked ? badge.color : 'rgba(255,255,255,0.04)',
                  filter: isUnlocked ? 'none' : 'grayscale(100%)',
                  boxShadow: isUnlocked ? `0 4px 18px -4px ${badge.color}60` : 'none'
                }}>
                  <span style={{
                    fontSize: '2.2rem',
                    marginBottom: '4px',
                    display: 'block',
                    animation: isUnlocked ? 'pulseGlow 2s infinite alternate' : 'none',
                    borderRadius: '50%'
                  }}>
                    {badge.icon}
                  </span>
                  
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: isUnlocked ? '#fff' : 'var(--text-muted)' }}>
                    {badge.label}
                  </h5>
                  
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
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
