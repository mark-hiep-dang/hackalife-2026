import { useState, useEffect } from 'react';
import { useT } from '../translations';
import { getSummitReadiness, getPreferences } from '../utils/api';
import { Mountain } from 'lucide-react';

function stripTopicIndex(topic) {
  return topic ? topic.replace(/^\d+\.\s*/, '') : '';
}

export default function SummitReadiness() {
  const t = useT();
  const [readiness, setReadiness] = useState(null);
  const [daysUntilExam, setDaysUntilExam] = useState(null);

  useEffect(() => {
    getSummitReadiness().then(setReadiness).catch(() => {});
    getPreferences()
      .then((p) => {
        if (p.exam_date) {
          const days = Math.max(0, Math.round((new Date(p.exam_date) - new Date()) / 86400000));
          setDaysUntilExam(days);
        }
      })
      .catch(() => {});
  }, []);

  if (!readiness) return null;

  return (
    <div className="card-pro bg-white p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mountain size={20} strokeWidth={3} className="text-[#4C6FC4]" />
          <span className="font-comic font-extrabold text-base text-[#101A24] uppercase tracking-wide">{t.summitReadinessTitle}</span>
        </div>
        {daysUntilExam !== null && (
          <span className="text-xs font-extrabold text-[#8A8A8A] bg-[#EEF0F3] px-3 py-1.5 rounded-full">
            {t.summitDaysUntilExam.replace('{n}', daysUntilExam)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-5 mb-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'conic-gradient(#4C6FC4 ' + readiness.score * 3.6 + 'deg, #EEF0F3 0deg)' }}
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center font-comic font-extrabold text-lg text-[#101A24]">
            {readiness.score}%
          </div>
        </div>
        <p className="font-comic font-extrabold text-base text-[#101A24] flex-1">{readiness.label}</p>
      </div>

      <div className="flex flex-col gap-2 text-sm font-bold text-[#101A24] mb-4">
        {readiness.strongestTopic && (
          <p><span className="text-[#4F9A5A] uppercase text-xs tracking-widest">{t.summitStrongestLabel}</span> {stripTopicIndex(readiness.strongestTopic)}</p>
        )}
        {readiness.highestRiskTopic && (
          <p><span className="text-[#D9695F] uppercase text-xs tracking-widest">{t.summitRiskLabel}</span> {stripTopicIndex(readiness.highestRiskTopic)}</p>
        )}
      </div>

      <p className="text-xs font-medium text-[#8A8A8A] italic">{t.summitDisclaimer}</p>
    </div>
  );
}
