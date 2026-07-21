import { Mountain } from 'lucide-react';
import { CAMP_COLORS } from './ui';
import { useT } from '../../translations';

// Hardcoded to mirror the exact 5 literal Vietnamese strings from
// backend/studio/engines/outlierPatterns.js's OUTLIER_PATTERN enum — not
// imported across the backend/frontend boundary (no shared-package setup in
// this repo), same precedent as ui.jsx's RiskBadge hardcoding its own copy of
// learnerRisk.js's RISK_STATUS strings.
const PATTERN_ORDER = [
  'Chăm nhưng chưa lên',
  'Lên xuống thất thường',
  'Nghi đoán may rủi',
  'Học rồi nghỉ, nghỉ rồi học lại',
  'Im lặng, ít tương tác hỗ trợ'
];

export default function OutlierPatternMountain({ learners, onSelectLearner }) {
  const t = useT();
  const buckets = PATTERN_ORDER.map((type) => ({
    type, matched: learners.filter((l) => (l.outlierPatterns || []).some((p) => p.type === type))
  }));
  const stable = learners.filter((l) => !(l.outlierPatterns || []).length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[#101A24] font-extrabold"><Mountain size={20} /> {t.studioOutlierMountainTitle}</div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {buckets.map((b, i) => (
          <div key={b.type} className={`min-w-[240px] rounded-2xl border border-[#101A24]/10 p-4 ${CAMP_COLORS[i % CAMP_COLORS.length]}`}>
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#101A24]/70 mb-2">{b.type}</div>
            {b.matched.length === 0 ? (
              <p className="text-xs text-[#101A24]/50">{t.studioOutlierPatternEmpty}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {b.matched.map((l) => (
                  <button key={l.id} onClick={() => onSelectLearner(l.id)}
                    className="px-2.5 py-1 rounded-full bg-white/70 text-xs font-bold text-[#101A24] hover:bg-white">{l.name}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="min-w-[160px] rounded-2xl border border-[#101A24]/10 p-4 bg-[#101A24] text-white flex flex-col items-center justify-center gap-2">
          <span className="font-extrabold text-center">🏔️ {t.studioOutlierSummitLabel}</span>
          {stable.length === 0 ? (
            <span className="text-xs text-white/70 text-center">{t.studioOutlierSummitEmpty}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {stable.map((l) => <span key={l.id} className="px-2 py-0.5 rounded-full bg-white/15 text-[11px]">{l.name}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
