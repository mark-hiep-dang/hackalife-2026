import { useEffect, useState } from 'react';
import { getLearners } from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, RiskBadge, PatternBadge, Button } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import OutlierPatternMountain from '../components/OutlierPatternMountain';
import LearnerProfile from './LearnerProfile';
import { useT } from '../../translations';

export default function LearnersAtRisk() {
  const t = useT();
  const [learners, setLearners] = useState(null);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [view, setView] = useState('list');

  useEffect(() => { getLearners().then(setLearners); }, []);

  if (selectedLearner) return <LearnerProfile learnerId={selectedLearner} onBack={() => setSelectedLearner(null)} />;
  if (!learners) return <Spinner label={t.studioLoading} />;

  const needsHelp = learners.filter((l) => l.status === 'Cần hỗ trợ ngay').length;
  const outlierCount = learners.filter((l) => (l.outlierPatterns || []).length > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle={t.studioLearnersScreenSubtitle}>{t.studioLearnersScreenTitle}</SectionTitle>

      {needsHelp > 0 && <StudioLlamaBubble event="LEARNER_RISK_FOUND" context={{ count: needsHelp }} />}
      {outlierCount > 0 && <StudioLlamaBubble event="OUTLIER_PATTERN_FOUND" context={{ count: outlierCount }} />}

      {learners.length === 0 ? (
        <EmptyState>{t.studioNoRealLearners}</EmptyState>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')}>{t.studioOutlierTabList}</Button>
            <Button variant={view === 'mountain' ? 'primary' : 'secondary'} onClick={() => setView('mountain')}>{t.studioOutlierTabMountain}</Button>
          </div>

          {view === 'mountain' ? (
            <OutlierPatternMountain learners={learners} onSelectLearner={setSelectedLearner} />
          ) : (
            <Card className="!p-0 overflow-hidden">
              <div className="divide-y divide-[#101A24]/10">
                {learners.map((l) => (
                  <button key={l.id} onClick={() => setSelectedLearner(l.id)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-[#F5F6F8] gap-4 flex-wrap">
                    <div>
                      <span className="font-extrabold text-[#101A24]">{l.name}</span>
                      <p className="text-xs text-[#888] mt-0.5">{l.reasons.join(' · ') || t.studioNoNotes}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="text-sm font-bold text-[#101A24]">{t.studioScoreLabel.replace('{n}', l.latestScore ?? '—')}</span>
                      <RiskBadge status={l.status} />
                      {(l.outlierPatterns || []).map((p) => <PatternBadge key={p.type} type={p.type} title={p.reason} />)}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
