import { useEffect, useState } from 'react';
import { getCohorts, getLearnersAtRisk } from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, RiskBadge } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import LearnerProfile from './LearnerProfile';

export default function LearnersAtRisk() {
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState(null);
  const [learners, setLearners] = useState(null);
  const [selectedLearner, setSelectedLearner] = useState(null);

  useEffect(() => { getCohorts().then((cs) => { setCohorts(cs); if (cs.length) setCohortId(cs[0].id); }); }, []);
  useEffect(() => { if (cohortId) getLearnersAtRisk(cohortId).then(setLearners); }, [cohortId]);

  if (selectedLearner) return <LearnerProfile learnerId={selectedLearner} onBack={() => setSelectedLearner(null)} />;
  if (!cohorts) return <Spinner />;
  if (cohorts.length === 0) return <EmptyState>Chưa có nhóm học nào.</EmptyState>;

  const needsHelp = learners?.filter((l) => l.status === 'Cần hỗ trợ ngay').length || 0;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle="Danh sách hỗ trợ học viên — không phán xét, chỉ gợi ý hành động tiếp theo.">Học viên</SectionTitle>

      <select value={cohortId || ''} onChange={(e) => setCohortId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit">
        {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {needsHelp > 0 && <StudioLlamaBubble event="LEARNER_RISK_FOUND" context={{ count: needsHelp }} />}

      {!learners ? <Spinner /> : (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-[#101A24]/10">
            {learners.map((l) => (
              <button key={l.id} onClick={() => setSelectedLearner(l.id)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-[#F5F6F8] gap-4 flex-wrap">
                <div>
                  <span className="font-extrabold text-[#101A24]">{l.name}</span>
                  <p className="text-xs text-[#888] mt-0.5">{l.reasons.join(' · ') || 'Chưa có ghi chú'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#101A24]">{l.latestScore ?? '—'} điểm</span>
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
