import { useState, useEffect } from 'react';
import { useT } from '../translations';
import { getDailyExpedition } from '../utils/api';
import { getCampInfo } from './LessonPath';
import { ACTIVITY_ICON } from '../expeditionCopy';
import { Compass, Sparkles } from 'lucide-react';

function stripTopicIndex(topic) {
  return topic ? topic.replace(/^\d+\.\s*/, '') : '';
}

export default function DailyExpedition({ lessons, onOpenExpedition }) {
  const t = useT();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyExpedition().then(setPlan).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || !plan) return null;

  const doneCount = plan.activities.filter((a) => a.status === 'COMPLETED').length;
  const focusIdx = lessons?.findIndex((l) => l.id === plan.focusLessonId) ?? -1;
  const campInfo = focusIdx >= 0 ? getCampInfo(focusIdx, lessons.length, t) : null;
  const focusLesson = focusIdx >= 0 ? lessons[focusIdx] : null;

  return (
    <div
      className="rounded-[2rem] p-6 md:p-8 pop-in"
      style={{ background: 'linear-gradient(135deg, #E3D9F5 0%, #FCE7A8 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Compass size={22} strokeWidth={3} className="text-[#6B4FA8]" />
        <span className="font-comic font-extrabold text-lg text-[#101A24] uppercase tracking-wide">
          {t.expeditionCardTitle} · {t.expeditionMinutesShort.replace('{n}', plan.totalMinutes)}
        </span>
      </div>

      {(campInfo || plan.focusTopic) && (
        <p className="text-sm font-bold text-[#101A24] mb-4">
          <span className="uppercase tracking-widest text-xs text-[#6B4FA8]">{t.expeditionGoalLabel}</span>{' '}
          {campInfo ? `${campInfo.label} · ${focusLesson?.title_vn || ''}` : stripTopicIndex(plan.focusTopic)}
        </p>
      )}

      <div className="flex flex-col gap-2 mb-5">
        {plan.activities.map((a) => (
          <div key={a.activityId} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${a.status === 'COMPLETED' ? 'bg-white/40' : 'bg-white/70'}`}>
            <span className="text-lg shrink-0">{a.status === 'COMPLETED' ? '✅' : (ACTIVITY_ICON[a.type] || '📌')}</span>
            <span className={`flex-1 text-sm font-bold ${a.status === 'COMPLETED' ? 'text-[#8A8A8A] line-through' : 'text-[#101A24]'}`}>{a.label}</span>
            <span className="text-xs font-extrabold text-[#8A6D1F] shrink-0">{t.expeditionMinutesShort.replace('{n}', a.minutes)}</span>
          </div>
        ))}
      </div>

      <div className="bg-white/60 rounded-2xl p-4 mb-5 flex items-start gap-2.5">
        <Sparkles size={18} strokeWidth={3} className="text-[#6B4FA8] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold text-[#6B4FA8] uppercase tracking-widest mb-1">{t.expeditionWhyLabel}</p>
          <p className="text-sm font-bold text-[#101A24] leading-relaxed">{plan.explanation}</p>
        </div>
      </div>

      <button onClick={onOpenExpedition} className="w-full btn-pro bg-[#101A24] text-white hover:bg-[#0A1119] py-4 text-lg">
        {plan.completed
          ? t.expeditionViewResultsBtn
          : doneCount === 0
            ? t.expeditionStartBtn
            : t.expeditionResumeProgress.replace('{done}', doneCount).replace('{total}', plan.activities.length)}
      </button>
    </div>
  );
}
