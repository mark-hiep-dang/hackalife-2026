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
      // Complete lesson API
      const result = await completeLesson(lesson.id);
      
      // Play celebratory gunshot!
      playPang();
      
      // Notify parent to update stats and return to base
      onLessonFinished(result.xp, result.level, result.newBadges);
    } catch (err) {
      setError(err.message || 'Failed to record completion');
      setSubmitting(false);
    }
  }

  // Left & Right arrow icons for navigation
  const LeftArrow = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  const RightArrow = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 0' }}>
      
      {/* Top Header Card Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => onLessonFinished(null, null, [])} // exit without completing
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LeftArrow /> {language === 'vn' ? 'Thoát học' : 'Exit Lesson'}
        </button>

        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
          {t.cardIndex.replace('{current}', currentIndex + 1).replace('{total}', cards.length)}
        </span>
      </div>

      {/* Progressive study indicator */}
      <div style={{
        height: '6px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '99px',
        overflow: 'hidden',
        marginBottom: '28px'
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(to right, var(--primary) 0%, var(--success) 100%)',
          borderRadius: '99px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {error && (
        <div className="glass-panel-glow-red" style={{ padding: '12px', color: '#f87171', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Flashcard Container */}
      <div className="glass-panel" style={{
        padding: '36px 24px',
        marginBottom: '32px',
        minHeight: '340px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderTop: '3px solid var(--primary)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
      }}>
        
        {/* Flashcard Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card Headers */}
          <div>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--primary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '1px',
              display: 'block',
              marginBottom: '6px'
            }}>
              {lesson.topic} • {lesson.difficulty}
            </span>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', lineHeight: '1.2' }}>
              {language === 'vn' ? currentCard.title_vn : currentCard.title_en}
            </h2>
            {/* Show alternative language title smaller */}
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>
              {language === 'vn' ? currentCard.title_en : currentCard.title_vn}
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }} />

          {/* Bilingual Descriptions Stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: '1.5', fontWeight: 400 }}>
              {language === 'vn' ? currentCard.content_vn : currentCard.content_en}
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '12px' }}>
              {language === 'vn' ? currentCard.content_en : currentCard.content_vn}
            </p>
          </div>
        </div>

        {/* Tip / Key takeaway Box */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(249, 115, 22, 0.04)',
          border: '1px dashed rgba(249, 115, 22, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
            {t.keyTakeaway}
          </strong>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {language === 'vn' ? currentCard.tip_vn : currentCard.tip_en}
          </p>
        </div>

      </div>

      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <button
          onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
          className="btn-secondary"
          disabled={currentIndex === 0}
          style={{ flex: 1, padding: '16px' }}
        >
          <LeftArrow /> {t.btnBack}
        </button>

        {currentIndex < cards.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1))}
            className="btn-primary"
            style={{ flex: 1, padding: '16px' }}
          >
            {t.btnNext} <RightArrow />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="btn-success"
            disabled={submitting}
            style={{
              flex: 1,
              padding: '16px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.45)',
              animation: 'pulseGlow 2.5s infinite alternate'
            }}
          >
            {submitting ? 'Recording...' : t.btnFinish}
          </button>
        )}
      </div>

    </div>
  );
}
