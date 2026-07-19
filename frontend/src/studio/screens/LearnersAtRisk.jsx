import { useEffect, useState } from 'react';
import { getLearners } from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, RiskBadge } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import LearnerProfile from './LearnerProfile';
import { useT } from '../../translations';

export default function LearnersAtRisk() {
  const t = useT();
  const [learners, setLearners] = useState(null);
  const [selectedLearner, setSelectedLearner] = useState(null);

  useEffect(() => { getLearners().then(setLearners); }, []);

  if (selectedLearner) return <LearnerProfile learnerId={selectedLearner} onBack={() => setSelectedLearner(null)} />;
  if (!learners) return <Spinner label={t.studioLoading} />;

  const needsHelp = learners.filter((l) => l.status === 'Cần hỗ trợ ngay').length;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle={t.studioLearnersScreenSubtitle}>{t.studioLearnersScreenTitle}</SectionTitle>

      {needsHelp > 0 && <StudioLlamaBubble event="LEARNER_RISK_FOUND" context={{ count: needsHelp }} />}

      {learners.length === 0 ? (
        <EmptyState>{t.studioNoRealLearners}</EmptyState>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-[#101A24]/10">
            {learners.map((l) => (
              <button key={l.id} onClick={() => setSelectedLearner(l.id)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-[#F5F6F8] gap-4 flex-wrap">
                <div>
                  <span className="font-extrabold text-[#101A24]">{l.name}</span>
                  <p className="text-xs text-[#888] mt-0.5">{l.reasons.join(' · ') || t.studioNoNotes}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#101A24]">{t.studioScoreLabel.replace('{n}', l.latestScore ?? '—')}</span>
                  <RiskBadge status={l.status} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
