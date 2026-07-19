import { useEffect, useState } from 'react';
import { getLearnerProfile } from '../../utils/studioApi';
import { Card, Spinner, Stat } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../../translations';

export default function LearnerProfile({ learnerId, onBack }) {
  const t = useT();
  const TREND_LABEL = {
    high_stable: t.studioTrendHighStable, improving: t.studioTrendImproving, plateauing: t.studioTrendPlateauing,
    declining: t.studioTrendDeclining, inconsistent: t.studioTrendInconsistent, insufficient_data: t.studioTrendInsufficientData
  };
  const [data, setData] = useState(null);
  useEffect(() => { getLearnerProfile(learnerId).then(setData); }, [learnerId]);
  if (!data) return <Spinner label={t.studioLoading} />;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> {t.studioBack}</button>
      <Card>
        <h2 className="text-xl font-extrabold text-[#101A24]">{data.learner.username}</h2>
        <p className="text-sm text-[#666] mt-1">{data.insight}</p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label={t.studioLatestScore} value={data.latestScore ?? '—'} />
        <Stat label={t.studioTrendLabel} value={TREND_LABEL[data.scoreTrend] || data.scoreTrend} />
        <Stat label={t.studioCommonMistake} value={data.commonMistakeType || '—'} />
        <Stat label={t.studioExamHistory} value={data.mockExamHistory.join(' → ') || '—'} />
      </div>

      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-3">{t.studioTopicPerformance}</h3>
        <div className="flex flex-col gap-2">
          {data.topicPerformance.map((topic) => (
            <div key={topic.topic} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#101A24]/10 text-sm">
              <span className="font-bold text-[#101A24]">{topic.topic}</span>
              <span className="text-[#888]">{t.studioCorrectRateShort.replace('{n}', topic.correctRate)}</span>
            </div>
          ))}
        </div>
      </Card>

      {data.interventions.length > 0 && (
        <Card>
          <h3 className="font-extrabold text-[#101A24] mb-3">{t.studioAssignedInterventions}</h3>
          <div className="flex flex-col gap-2">
            {data.interventions.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#101A24]/10 text-sm">
                <span className="font-bold text-[#101A24]">{iv.title}</span>
                <span className="text-[#888]">{iv.completed_at ? t.studioCompleted : t.studioInProgress}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
