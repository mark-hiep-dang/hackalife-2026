import { translations } from '../translations';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate, language }) {
  const t = translations[language];

  if (!profile) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dossier...</div>;

  // Level progress calculations
  const xp = profile.xp || 0;
  const level = profile.level || 1;
  
  const prevLevelThreshold = Math.pow(level - 1, 2) * 100;
  const nextLevelThreshold = Math.pow(level, 2) * 100;
  
  const levelRange = nextLevelThreshold - prevLevelThreshold;
  const currentProgress = xp - prevLevelThreshold;
  const progressPercent = Math.min(Math.max((currentProgress / levelRange) * 100, 0), 100);

  // SVG Icons
  const PadlockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
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
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
      
      {/* SECTION 1: Stats Header & Level Progress */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.03em' }}>{t.statsTitle}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
              {t.welcomeUser}, <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{profile.username}</span>
            </p>
          </div>
          
          {/* Streak Badge */}
          <div className="streak-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ fontSize: '1.4rem' }}>🔥</span>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.streakLabel}</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{profile.streak || 0} {language === 'vn' ? 'ngày' : 'days'}</span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Level <span style={{ color: 'var(--info)', fontWeight: 700 }}>{level}</span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {xp} / {nextLevelThreshold} XP
            </span>
          </div>
          
          <div style={{
            height: '8px',
            background: 'var(--bg-subtle)',
            borderRadius: '99px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--success) 0%, #4ade80 100%)',
              borderRadius: '99px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {profile.streak > 0 ? t.streakActive : t.streakBroken}
          </p>
        </div>
      </div>

      {/* SECTION 2: Lessons Roadmap */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-dark)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📖</span> {t.lessonsProgress}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lessons.map((lesson) => {
            const isLocked = !lesson.isUnlocked;
            const isCompleted = lesson.isCompleted;

            return (
              <div key={lesson.id} className="glass-panel" style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isLocked ? 0.55 : 1,
                borderLeft: `3px solid ${isCompleted ? 'var(--success)' : isLocked ? 'var(--border-color)' : 'var(--primary)'}`,
                background: isLocked ? 'var(--bg-subtle)' : 'var(--bg-card)',
                transition: 'all var(--transition)'
              }}>
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: isCompleted ? 'var(--success-dark)' : isLocked ? 'var(--text-muted)' : 'var(--primary)'
                    }}>
                      {lesson.topic} · {lesson.difficulty}
                    </span>
                    {isCompleted && (
                      <span style={{
                        background: 'var(--success-subtle)',
                        color: 'var(--success-dark)',
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <CheckIcon /> {t.completedStatus}
                      </span>
                    )}
                  </div>
                  
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: isLocked ? 'var(--text-muted)' : 'var(--text-dark)', letterSpacing: '-0.01em' }}>
                    {language === 'vn' ? lesson.title_vn : lesson.title_en}
                  </h4>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {isLocked ? t.lockedLesson : `${JSON.parse(JSON.stringify(lesson.cards)).length} ${language === 'vn' ? 'thẻ học' : 'flashcards'}`}
                  </p>
                </div>

                <div>
                  {isLocked ? (
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
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
                      style={{ padding: '10px 20px', fontSize: '0.825rem' }}
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

      {/* SECTION 3: Badges */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-dark)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏆 {t.badgesTitle}
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px'
        }}>
          {badgeDefinitions.map((badge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);

            return (
              <div key={badge.id} className="glass-panel" style={{
                padding: '20px 14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: isUnlocked ? 'var(--bg-card)' : 'var(--bg-subtle)',
                borderColor: isUnlocked ? badge.color : 'var(--border-color)',
                filter: isUnlocked ? 'none' : 'grayscale(100%)',
                opacity: isUnlocked ? 1 : 0.5,
                transition: 'all var(--transition)'
              }}>
                <span style={{ fontSize: '2rem', display: 'block' }}>
                  {badge.icon}
                </span>
                
                <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: isUnlocked ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                  {badge.label}
                </h5>
                
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {badge.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
