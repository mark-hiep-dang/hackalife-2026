// Duolingo-style winding path — Llama climbs alongside you, one lesson per camp, up to the MOF summit.
import { useState } from 'react';

const VERTICAL_GAP = 132;
const NODE_SIZE = 88;
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
  return Math.round(Math.sin(index * 1.15) * 80);
}

function getCampInfo(index, total) {
  const isBase = index === 0;
  const isSummit = index === total - 1;

  let label;
  if (isBase) label = 'Trại Nền';
  else if (isSummit) label = 'Đỉnh MOF';
  else label = `Trại ${index}`;

  const baseAlt = 5364;
  const summitAlt = 8849;
  const altitude = Math.round(baseAlt + (summitAlt - baseAlt) * (total > 1 ? index / (total - 1) : 1));

  return { label, altitude, isBase, isSummit };
}

export default function LessonPath({ lessons, onSelectLesson }) {
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

  const firstAvailableIdx = lessons.findIndex((l) => l.isUnlocked && !l.isCompleted);

  // Llama bobs beside wherever you currently are on the trail (falls back to the top camp if all done).
  const currentPoint = points.find((p) => p.origIdx === firstAvailableIdx) || points[0];
  const mascotSide = getOffsetX(currentPoint.origIdx) >= 0 ? -1 : 1;
  const mascotX = currentPoint.x + mascotSide * (NODE_SIZE / 2 + 46);
  const giftY = points[Math.floor(points.length / 2)]?.y - VERTICAL_GAP / 2;

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] p-8"
      style={{
        background: 'linear-gradient(180deg, #DCF0FF 0%, #EEF7E8 55%, #F3ECD8 100%)',
        boxShadow: '0 8px 0 rgba(16,26,36,0.08), 0 14px 30px -10px rgba(16,26,36,0.12)'
      }}
    >
      {/* Floating clouds */}
      <div className="absolute top-6 left-14 w-[70px] h-7 bg-white rounded-full opacity-85 pointer-events-none" style={{ animation: 'floatCloud 7s ease-in-out infinite' }} />
      <div className="absolute top-14 right-20 w-12 h-[22px] bg-white rounded-full opacity-70 pointer-events-none" style={{ animation: 'floatCloud 9s ease-in-out infinite 1s' }} />

      <div className="relative mx-auto" style={{ width: `${PATH_WIDTH}px`, height: `${containerHeight}px` }}>
        {/* Straight dashed trail down the center */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: '20px', bottom: '20px', width: '5px', transform: 'translateX(-50%)',
            background: 'repeating-linear-gradient(#fff 0 10px, transparent 10px 18px)',
            borderRadius: '4px', opacity: 0.9
          }}
        />

        {/* Llama, bobbing beside you on the current camp */}
        <div className="absolute text-4xl pointer-events-none" style={{ left: `${mascotX}px`, top: `${currentPoint.y - 10}px`, transform: 'translate(-50%,-50%)', animation: 'bob 2.6s ease-in-out infinite' }}>
          🦙
        </div>

        {/* Sparkly reward chest */}
        {giftY !== undefined && (
          <div className="absolute text-3xl pointer-events-none" style={{ left: `${CENTER_X - 115}px`, top: `${giftY}px`, transform: 'translate(-50%,-50%)', animation: 'sparkle 3.5s ease-in-out infinite 0.4s' }}>
            🎁
          </div>
        )}

        {points.map(({ origIdx, x, y }) => {
          const lesson = lessons[origIdx];
          const { label, altitude, isSummit } = getCampInfo(origIdx, total);
          const isLocked = !lesson.isUnlocked;
          const isCompleted = lesson.isCompleted;
          const isCurrent = origIdx === firstAvailableIdx;
          const icon = isSummit ? '⛰️' : (TOPIC_ICON[lesson.topic] || '🏕️');

          let bg = '#F9FAFB', shadowColor = 'rgba(16,26,36,0.15)', opacity = 1;
          if (isCompleted) { bg = '#2563EB'; shadowColor = '#17408F'; }
          else if (isCurrent) { bg = '#9FE870'; shadowColor = '#6BAE2E'; }
          else if (isLocked) { opacity = 0.55; }

          return (
            <div key={lesson.id} className="absolute text-center" style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}>
              {isCurrent && (
                <div className="absolute left-1/2 whitespace-nowrap bg-[#101A24] text-white font-comic text-xs font-bold px-3.5 py-1.5 rounded-full pointer-events-none" style={{ bottom: `${NODE_SIZE / 2 + 22}px`, transform: 'translateX(-50%)', boxShadow: '0 3px 0 rgba(0,0,0,0.2)' }}>
                  Bắt đầu ở đây 👇
                </div>
              )}

              <button
                onClick={() => setPreview({ lesson, label, altitude, isLocked, isCompleted, icon })}
                className="rounded-full border-none flex items-center justify-center text-4xl transition-transform hover:-translate-y-1"
                style={{
                  width: `${NODE_SIZE}px`, height: `${NODE_SIZE}px`,
                  background: bg, opacity,
                  boxShadow: `0 6px 0 ${shadowColor}`,
                  animation: isCurrent ? 'pulseGlow 1.8s ease-in-out infinite' : 'none'
                }}
                title={label}
              >
                {isLocked ? '🔒' : isCompleted ? '✅' : icon}
              </button>

              <div className="mt-2.5 font-comic font-bold text-sm text-[#101A24]" style={{ maxWidth: '110px' }}>
                {label}
              </div>
              <div className="text-[11px] font-bold text-[#8A8A8A]">
                {altitude.toLocaleString('en-US')}m
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)} className="fixed inset-0 bg-[#101A24]/55 flex items-center justify-center z-[1000] p-5">
          <div onClick={(e) => e.stopPropagation()} className="bounce-in bg-white rounded-[1.75rem] max-w-sm w-full p-8 text-center" style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}>
            <div className="text-5xl mb-2.5">
              {preview.isLocked ? '🔒' : preview.isCompleted ? '✅' : preview.icon}
            </div>
            <p className="font-comic font-extrabold text-xl text-[#101A24] uppercase">
              {preview.label}
            </p>
            <p className="text-sm font-bold text-[#8A8A8A] mb-4">
              {preview.altitude.toLocaleString('en-US')}m • {preview.lesson.topic} • {preview.lesson.difficulty}
            </p>

            {preview.isLocked ? (
              <p className="text-sm font-bold text-[#3A3A3A] bg-[#F9FAFB] rounded-2xl p-4 mb-5 leading-relaxed">
                🔒 Trại này đang khóa. Hoàn thành trại trước đó để mở đường lên đây nhé!
              </p>
            ) : (
              <div className="text-left bg-[#F9FAFB] rounded-2xl p-4 mb-5">
                <p className="text-xs font-extrabold text-[#8A8A8A] uppercase tracking-wide mb-3">
                  Trong trại này ({preview.lesson.cards.length} thẻ):
                </p>
                <ul className="flex flex-col gap-2 list-disc pl-4">
                  {preview.lesson.cards.map((card) => (
                    <li key={card.id} className="text-sm font-bold text-[#101A24]">
                      {card.title_vn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 border-none cursor-pointer bg-[#F9FAFB] rounded-2xl py-3.5 font-comic font-bold text-[#101A24]"
                style={{ boxShadow: '0 4px 0 rgba(16,26,36,0.1)' }}
                onClick={() => setPreview(null)}
              >
                Đóng
              </button>
              {!preview.isLocked && (
                <button
                  className="flex-[2] border-none cursor-pointer bg-[#9FE870] rounded-2xl py-3.5 font-comic font-bold text-[#101A24]"
                  style={{ boxShadow: '0 4px 0 #6BAE2E' }}
                  onClick={() => { onSelectLesson(preview.lesson); setPreview(null); }}
                >
                  Bắt đầu 🎯
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
