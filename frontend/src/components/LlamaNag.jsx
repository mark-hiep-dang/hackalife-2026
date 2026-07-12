import { getNagTier } from '../nagMessages';

export default function LlamaNag({ daysSince, language, onStudyNow }) {
  const tier = getNagTier(daysSince, language);
  if (!tier) return null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        flexWrap: 'wrap',
        borderColor: tier.color,
        borderWidth: '2px',
        borderLeftWidth: '8px',
        background: '#ffffff',
        animation: 'pulseGlow 2.5s infinite alternate'
      }}
    >
      <span style={{ fontSize: '2.6rem', flexShrink: 0, lineHeight: 1 }}>🦙{tier.icon}</span>
      <p style={{ flex: 1, minWidth: '200px', fontSize: '0.98rem', fontWeight: 700, color: tier.color, lineHeight: '1.4' }}>
        {tier.message}
      </p>
      <button
        onClick={onStudyNow}
        className="btn-primary"
        style={{ flexShrink: 0, padding: '10px 18px', whiteSpace: 'nowrap' }}
      >
        {language === 'vn' ? 'Học ngay! 🎯' : 'Study now! 🎯'}
      </button>
    </div>
  );
}
