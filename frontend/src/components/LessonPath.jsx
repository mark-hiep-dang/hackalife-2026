// Duolingo-style winding path — Llama climbs alongside you, one lesson per camp, up to the MOF summit.
import { useState } from 'react';
import { Lock, CheckCircle2, BookOpen, Shield, ScrollText, Scale, Mountain, Target } from 'lucide-react';

const VERTICAL_GAP = 132;
const NODE_SIZE = 84;
const PATH_WIDTH = 320;
const CENTER_X = PATH_WIDTH / 2;

const TOPIC_ICON = {
  fundamentals: BookOpen,
  products: Shield,
  contracts: ScrollText,
  regulations: Scale
};

function getOffsetX(index) {
  // Gentle S-curve winding, alternating left/right of center like a mountain trail.
  return Math.round(Math.sin(index * 1.15) * 90);
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
    <div className="card-pro relative overflow-hidden bg-gradient-to-b from-[#DCF0FF] via-[#EEF7E8] to-[#F3ECD8] p-8">
      <div className="flex items-center justify-center gap-2 text-3xl mb-2">🦙<Mountain size={32} strokeWidth={2.5} className="text-[#101A24]" />☀️</div>
      <p className="text-center text-sm font-extrabold uppercase tracking-widest text-[#101A24]/60 mb-6">
        Llama đồng hành cùng bạn tiến đến Đỉnh MOF — bấm vào từng trại để xem nội dung
      </p>

      <div className="relative mx-auto" style={{ width: `${PATH_WIDTH}px`, height: `${containerHeight}px` }}>
        <svg width={PATH_WIDTH} height={containerHeight} className="absolute top-0 left-0 pointer-events-none">
          <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
          <path d={pathD} fill="none" stroke="#101A24" strokeOpacity="0.15" strokeWidth="5" strokeDasharray="2 15" strokeLinecap="round" />
        </svg>

        {/* Llama, walking beside you on the current camp */}
        <div className="absolute text-4xl pointer-events-none" style={{ left: `${mascotX}px`, top: `${currentPoint.y - 10}px`, transform: 'translate(-50%,-50%)' }}>
          🦙
        </div>

        {/* Decorative reward chest */}
        {chestY !== undefined && (
          <div className="absolute text-3xl pointer-events-none" style={{ left: `${CENTER_X - 115}px`, top: `${chestY}px`, transform: 'translate(-50%,-50%)' }}>
            🎁
          </div>
        )}

        {points.map(({ origIdx, x, y }) => {
          const lesson = lessons[origIdx];
          const { label, altitude, isSummit } = getCampInfo(origIdx, total);
          const isLocked = !lesson.isUnlocked;
          const isCompleted = lesson.isCompleted;
          const isCurrent = origIdx === firstAvailableIdx;
          const TopicIcon = TOPIC_ICON[lesson.topic] || Target;

          let nodeCls = 'bg-[#F9FAFB] border-[#101A24]/10 text-[#888]';
          if (isCompleted) nodeCls = 'bg-[#2563EB] border-[#101A24]/10 text-white';
          else if (!isLocked) nodeCls = 'bg-[#9FE870] border-[#101A24]/10 text-[#101A24]';

          return (
            <div key={lesson.id} className="absolute text-center" style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}>
              {isCurrent && (
                <div className="absolute left-1/2 whitespace-nowrap bg-[#101A24] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm pointer-events-none" style={{ bottom: `${NODE_SIZE / 2 + 14}px`, transform: 'translateX(-50%)' }}>
                  Bắt đầu ở đây 👇
                </div>
              )}

              <button
                onClick={() => setPreview({ lesson, label, altitude, isLocked, isCompleted })}
                className={`rounded-full border shadow-sm flex items-center justify-center transition-transform hover:-translate-y-0.5 ${isLocked ? 'opacity-60' : ''} ${nodeCls} ${isCurrent ? 'animate-pulse' : ''}`}
                style={{ width: `${NODE_SIZE}px`, height: `${NODE_SIZE}px` }}
                title={label}
              >
                {isLocked ? <Lock size={28} strokeWidth={2.5} /> : isCompleted ? <CheckCircle2 size={34} strokeWidth={3} /> : isSummit ? <Mountain size={32} strokeWidth={2.5} /> : <TopicIcon size={32} strokeWidth={2.5} />}
              </button>

              <div className={`mt-2 text-xs font-extrabold ${isLocked ? 'text-[#888]' : 'text-[#101A24]'}`} style={{ maxWidth: '110px' }}>
                {label}
              </div>
              <div className="text-[10px] font-bold text-[#888]">
                {altitude.toLocaleString('en-US')}m
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)} className="fixed inset-0 bg-[#101A24]/50 flex items-center justify-center z-[1000] p-5">
          <div onClick={(e) => e.stopPropagation()} className="card-pro scale-in bg-white max-w-sm w-full p-8 text-center">
            <div className="flex justify-center mb-3">
              {preview.isLocked ? <Lock size={40} strokeWidth={2.5} className="text-[#888]" /> :
               preview.isCompleted ? <CheckCircle2 size={40} strokeWidth={2.5} className="text-[#2563EB]" /> :
               (() => { const Icon = TOPIC_ICON[preview.lesson.topic] || Target; return <Icon size={40} strokeWidth={2.5} className="text-[#101A24]" />; })()}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#888] mb-1">
              {preview.label} • {preview.altitude.toLocaleString('en-US')}m
            </p>
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-[#101A24] mb-1">
              {preview.lesson.title_vn}
            </h3>
            <p className="text-sm font-bold text-[#888] uppercase tracking-widest mb-6">
              {preview.lesson.topic} • {preview.lesson.difficulty}
            </p>

            {preview.isLocked ? (
              <p className="text-sm font-bold text-[#888] mb-6 leading-relaxed">
                🔒 Trại này đang khóa. Hoàn thành trại trước đó để mở đường lên đây nhé!
              </p>
            ) : (
              <div className="text-left bg-[#F9FAFB] rounded-2xl p-5 mb-6 border border-[#101A24]/10">
                <p className="text-xs font-extrabold text-[#888] uppercase tracking-widest mb-3">
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
              <button className="btn-pro-secondary flex-1 py-3" onClick={() => setPreview(null)}>
                Đóng
              </button>
              {!preview.isLocked && (
                <button
                  className="btn-pro-primary bg-[#9FE870] flex-[2] py-3"
                  onClick={() => { onSelectLesson(preview.lesson); setPreview(null); }}
                >
                  Bắt Đầu Học 🎯
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
