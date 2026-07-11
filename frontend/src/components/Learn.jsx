import { useState } from 'react';
import { completeLesson } from '../utils/api';
import { translations } from '../translations';
import { playPang } from '../utils/sound';

export default function Learn({ lesson, onLessonFinished, language }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = translations[language];
  const cards = lesson.cards;
  const currentCard = cards[currentIndex];

  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  async function handleFinish() {
    setSubmitting(true);
    setError('');
    try {
      const result = await completeLesson(lesson.id);
      playPang();
      onLessonFinished(result.xp, result.level, result.newBadges);
    } catch (err) {
      setError(err.message || 'Failed to record completion');
      setSubmitting(false);
    }
  }

  const ArrowLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  const ArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '8px 0' }}>
      
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button
          onClick={() => onLessonFinished(null, null, [])}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500
          }}
        >
          <ArrowLeft /> {language === 'vn' ? 'Thoát' : 'Exit'}
        </button>

        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t.cardIndex.replace('{current}', currentIndex + 1).replace('{total}', cards.length)}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '4px',
        background: 'var(--bg-subtle)',
        borderRadius: '99px',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--primary) 0%, #f97316 100%)',
          borderRadius: '99px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {error && (
        <div style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(239,68,68,0.15)', padding: '10px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Flashcard */}
      <div className="glass-panel" style={{
        padding: '32px 28px',
        marginBottom: '24px',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--primary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '8px'
            }}>
              {lesson.topic} · {lesson.difficulty}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: '1.3', letterSpacing: '-0.02em' }}>
              {language === 'vn' ? currentCard.title_vn : currentCard.title_en}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {language === 'vn' ? currentCard.title_en : currentCard.title_vn}
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)' }} />

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
              {language === 'vn' ? currentCard.content_vn : currentCard.content_en}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', fontStyle: 'italic', borderLeft: '2px solid var(--border-color)', paddingLeft: '12px' }}>
              {language === 'vn' ? currentCard.content_en : currentCard.content_vn}
            </p>
          </div>
        </div>

        {/* Tip Box */}
        <div style={{
          marginTop: '24px',
          background: 'var(--warning-subtle)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px'
        }}>
          <strong style={{ fontSize: '0.8rem', color: 'var(--warning-dark)', fontWeight: 700 }}>
            {t.keyTakeaway}
          </strong>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '4px' }}>
            {language === 'vn' ? currentCard.tip_vn : currentCard.tip_en}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button
          onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
          className="btn-secondary"
          disabled={currentIndex === 0}
          style={{ flex: 1, padding: '14px' }}
        >
          <ArrowLeft /> {t.btnBack}
        </button>

        {currentIndex < cards.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1))}
            className="btn-primary"
            style={{ flex: 1, padding: '14px' }}
          >
            {t.btnNext} <ArrowRight />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="btn-success"
            disabled={submitting}
            style={{ flex: 1, padding: '14px' }}
          >
            {submitting ? 'Recording...' : t.btnFinish}
          </button>
        )}
      </div>

    </div>
  );
}
