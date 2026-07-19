import { useState, useEffect } from 'react';
import { useT } from '../translations';
import { getDailyExpedition, completeDailyExpedition } from '../utils/api';
import { Compass, Sparkles } from 'lucide-react';

const ACTIVITY_ICON = { warmup: '🔥', practice: '🎯', flashcard: '🗂️', rescue: '🧗', checkpoint: '🏁' };

function stripTopicIndex(topic) {
  return topic ? topic.replace(/^\d+\.\s*/, '') : '';
}

export default function DailyExpedition({ onNavigate, onStartRescue }) {
  const t = useT();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyExpedition().then(setPlan).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || !plan) return null;

  async function handleStart() {
    const rescueActivity = plan.activities.find((a) => a.type === 'rescue');
    if (rescueActivity && onStartRescue) {
      onStartRescue({ topic: rescueActivity.topic, mistakeType: rescueActivity.mistakeType });
      return;
    }
    onNavigate?.('quiz');
  }

  async function handleMarkDone() {
    try {
      await completeDailyExpedition();
      setPlan((p) => ({ ...p, completed: true }));
    } catch (err) {
      console.error(err);
    }
  }

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

      {plan.focusTopic && (
        <p className="text-sm font-bold text-[#101A24] mb-4">
          <span className="uppercase tracking-widest text-xs text-[#6B4FA8]">{t.expeditionGoalLabel}</span>{' '}
          {stripTopicIndex(plan.focusTopic)}
        </p>
      )}

      <div className="flex flex-col gap-2 mb-5">
        {plan.activities.map((a, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-2.5">
            <span className="text-lg shrink-0">{ACTIVITY_ICON[a.type] || '📌'}</span>
            <span className="flex-1 text-sm font-bold text-[#101A24]">{a.type === 'rescue' ? t.activity_rescue : a.label}</span>
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

      {plan.completed ? (
        <div className="w-full text-center bg-white/70 rounded-2xl py-4 font-comic font-extrabold text-[#4F9A5A]">
          {t.expeditionDoneBtn}
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={handleStart} className="flex-1 btn-pro bg-[#101A24] text-white hover:bg-[#0A1119] py-4 text-lg">
            {t.expeditionStartBtn}
          </button>
          <button onClick={handleMarkDone} className="btn-pro bg-white/70 text-[#101A24] py-4 px-5 text-sm">
            ✓
          </button>
        </div>
      )}
    </div>
  );
}
