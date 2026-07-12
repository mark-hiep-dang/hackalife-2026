// Duolingo-style winding path — Llama climbs alongside you, one lesson per camp, up to the MOF summit.
import { useState } from 'react';

const VERTICAL_GAP = 132;
const NODE_SIZE = 84;
const PATH_WIDTH = 320;
const CENTER_X = PATH_WIDTH / 2;

const TOPIC_ICON = {
  fundamentals: '📖',
  products: '🛡️',
  contracts: '📜',
  regulations: '⚖️'
};

function getOffsetX(index) {
  // Gentle S-curve winding, alternating left/right of center like a mountain trail.
  return Math.round(Math.sin(index * 1.15) * 90);
}

function getCampInfo(index, total, language) {
  const isBase = index === 0;
  const isSummit = index === total - 1;

  let label;
  if (isBase) label = language === 'vn' ? 'Trại Nền' : 'Base Camp';
  else if (isSummit) label = language === 'vn' ? 'Đỉnh MOF' : 'MOF Summit';
  else label = language === 'vn' ? `Trại ${index}` : `Camp ${index}`;

  const baseAlt = 5364;
  const summitAlt = 8849;
  const altitude = Math.round(baseAlt + (summitAlt - baseAlt) * (total > 1 ? index / (total - 1) : 1));

  return { label, altitude, isBase, isSummit };
}

const CheckIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const PadlockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default function LessonPath({ lessons, onSelectLesson, language }) {
  const [preview, setPreview] = useState(null);
  const total = lessons.length;
  if (total === 0) return null;

  // Render order climbs bottom (base camp, index 0) to top (summit, last index).
  const renderOrder = [...lessons.map((_, i) => i)].reverse();
  const containerHeight = total * VERTICAL_GAP + NODE_SIZE + 40;

  const points = renderOrder.map((origIdx, renderPos) => ({
    origIdx,
    x: CENTER_X + getOffsetX(origIdx),
    y: renderPos * VERTICAL_GAP + NODE_SIZE / 2 + 30
  }));

  let pathD = '';
  points.forEach((p, i) => {
    if (i === 0) {
      pathD += `M ${p.x} ${p.y}`;
    } else {
      const prev = points[i - 1];
      const midY = (prev.y + p.y) / 2;
      pathD += ` C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    }
  });

  const firstAvailableIdx = lessons.findIndex((l) => l.isUnlocked && !l.isCompleted);

  // Llama walks beside wherever you currently are on the trail (falls back to the top camp if all done).
  const currentPoint = points.find((p) => p.origIdx === firstAvailableIdx) || points[0];
  const mascotSide = getOffsetX(currentPoint.origIdx) >= 0 ? -1 : 1;
  const mascotX = currentPoint.x + mascotSide * (NODE_SIZE / 2 + 46);
  const chestY = points[Math.floor(points.length / 2)]?.y - VERTICAL_GAP / 2;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '30px 0 20px',
        background: 'linear-gradient(to bottom, #bfe3ff 0%, #dcf0ff 20%, #eef7e8 55%, #f3ecd8 100%)',
        border: '2px solid var(--border-color)',
        overflow: 'hidden'
      }}
    >
      <div style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '4px' }}>🦙🏔️☀️</div>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>
        {language === 'vn' ? 'Llama đồng hành cùng bạn tiến đến Đỉnh MOF — leo từng trại một! Bấm vào từng trại để xem nội dung.' : 'Llama climbs alongside you to the MOF Summit — one camp at a time! Tap a camp to preview it.'}
      </p>

      <div style={{ position: 'relative', width: `${PATH_WIDTH}px`, height: `${containerHeight}px`, margin: '0 auto' }}>
        <svg
          width={PATH_WIDTH}
          height={containerHeight}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
          <path d={pathD} fill="none" stroke="#bcd6c0" strokeWidth="5" strokeDasharray="2 15" strokeLinecap="round" />
        </svg>

        {/* Llama, walking beside you on the current camp */}
        <div style={{ position: 'absolute', left: `${mascotX}px`, top: `${currentPoint.y - 10}px`, transform: 'translate(-50%,-50%)', fontSize: '2.6rem', pointerEvents: 'none' }}>
          🦙
        </div>

        {/* Decorative reward chest */}
        {chestY !== undefined && (
          <div style={{ position: 'absolute', left: `${CENTER_X - 115}px`, top: `${chestY}px`, transform: 'translate(-50%,-50%)', fontSize: '2.2rem', pointerEvents: 'none' }}>
            🎁
          </div>
        )}

        {points.map(({ origIdx, x, y }) => {
          const lesson = lessons[origIdx];
          const { label, altitude, isSummit } = getCampInfo(origIdx, total, language);
          const isLocked = !lesson.isUnlocked;
          const isCompleted = lesson.isCompleted;
          const isCurrent = origIdx === firstAvailableIdx;
          const topicIcon = TOPIC_ICON[lesson.topic] || '🎯';

          let nodeStyle = {
            background: 'radial-gradient(circle at 35% 30%, #f4f4f4, #d8dadd 70%)',
            border: '3px solid #b9bec4',
            borderBottom: '9px solid #9aa0a6',
            color: '#8b9096'
          };
          if (isCompleted) {
            nodeStyle = {
              background: 'radial-gradient(circle at 35% 30%, #8fe142, var(--success) 70%)',
              border: '3px solid var(--success-dark)',
              borderBottom: '9px solid var(--success-dark)',
              color: '#fff'
            };
          } else if (!isLocked) {
            nodeStyle = {
              background: 'radial-gradient(circle at 35% 30%, #fff, #ffe3e3 70%)',
              border: '3px solid var(--primary)',
              borderBottom: '9px solid var(--primary-dark)',
              color: 'var(--primary)'
            };
          }

          return (
            <div key={lesson.id} style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  bottom: `${NODE_SIZE / 2 + 14}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '99px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  pointerEvents: 'none'
                }}>
                  {language === 'vn' ? 'BẮT ĐẦU Ở ĐÂY 👇' : 'START HERE 👇'}
                </div>
              )}

              <button
                onClick={() => setPreview({ lesson, label, altitude, isLocked, isCompleted })}
                style={{
                  width: `${NODE_SIZE}px`,
                  height: `${NODE_SIZE}px`,
                  borderRadius: '50%',
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: isLocked ? 0.65 : 1,
                  animation: isCurrent ? 'pulseGlow 1.8s infinite' : 'none',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.12)',
                  ...nodeStyle
                }}
                title={label}
              >
                {isLocked ? <PadlockIcon /> : isCompleted ? <CheckIcon /> : isSummit ? '🏔️' : topicIcon}
              </button>

              <div style={{ marginTop: '6px', fontSize: '0.72rem', fontWeight: 800, color: isLocked ? 'var(--text-muted)' : 'var(--text-dark)', maxWidth: '110px' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {altitude.toLocaleString('en-US')}m
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ background: '#fff', maxWidth: '380px', width: '100%', padding: '28px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>
              {preview.isLocked ? '🔒' : preview.isCompleted ? '✅' : (TOPIC_ICON[preview.lesson.topic] || '🎯')}
            </div>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              {preview.label} • {preview.altitude.toLocaleString('en-US')}m
            </p>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)', margin: '6px 0 4px' }}>
              {language === 'vn' ? preview.lesson.title_vn : preview.lesson.title_en}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 500 }}>
              {preview.lesson.topic} • {preview.lesson.difficulty}
            </p>

            {preview.isLocked ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '20px', lineHeight: '1.4' }}>
                {language === 'vn'
                  ? '🔒 Trại này đang khóa. Hoàn thành trại trước đó để mở đường lên đây nhé!'
                  : '🔒 This camp is locked. Finish the previous camp to unlock the trail up here!'}
              </p>
            ) : (
              <div style={{ textAlign: 'left', background: '#f7f9fa', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {language === 'vn' ? `Trong trại này (${preview.lesson.cards.length} thẻ):` : `In this camp (${preview.lesson.cards.length} cards):`}
                </p>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {preview.lesson.cards.map((card) => (
                    <li key={card.id} style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {language === 'vn' ? card.title_vn : card.title_en}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPreview(null)}>
                {language === 'vn' ? 'Đóng' : 'Close'}
              </button>
              {!preview.isLocked && (
                <button
                  className="btn-primary"
                  style={{ flex: 2 }}
                  onClick={() => { onSelectLesson(preview.lesson); setPreview(null); }}
                >
                  {language === 'vn' ? 'Bắt Đầu Học 🎯' : 'Start Camp 🎯'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
