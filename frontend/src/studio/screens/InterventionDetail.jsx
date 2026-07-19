import { useEffect, useState } from 'react';
import { getIntervention, approveIntervention, assignIntervention, getInterventionResults } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, Stat } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { useT } from '../../translations';

export default function InterventionDetail({ interventionId, onBack }) {
  const t = useT();
  const [iv, setIv] = useState(null);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState(null);

  async function load() {
    const data = await getIntervention(interventionId);
    setIv(data);
    if (data.status === 'assigned') setResults(await getInterventionResults(interventionId));
  }
  useEffect(() => { load(); }, [interventionId]);

  async function handleApprove() {
    setBusy(true);
    try { await approveIntervention(interventionId); await load(); } finally { setBusy(false); }
  }
  async function handleAssign() {
    setBusy(true);
    try {
      const r = await assignIntervention(interventionId);
      setReaction({ event: 'INTERVENTION_ASSIGNED', context: { count: r.assignedCount } });
      await load();
    } finally { setBusy(false); }
  }

  if (!iv) return <Spinner label={t.studioLoading} />;
  const content = iv.content || {};

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> {t.studioBack}</button>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#101A24]">{iv.title}</h2>
            <p className="text-sm text-[#666] mt-1">{t.studioMinutesLabel.replace('{n}', iv.duration_minutes)} · {iv.topic}</p>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#EEF0F3]">{iv.status}</span>
        </div>
      </Card>

      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} />}
      {iv.status === 'draft' && <StudioLlamaBubble event="INTERVENTION_CREATED" context={{ duration: iv.duration_minutes }} />}

      <Card>
        <SectionTitle subtitle={t.studioRescueContentSubtitle}>{t.studioRescueContentTitle}</SectionTitle>
        <div className="flex flex-col gap-4 text-sm text-[#101A24]">
          <p><strong>{t.studioTrainerSummaryLabel}</strong> {content.trainerSummary}</p>
          <p><strong>{t.studioLearnerIntroLabel}</strong> {content.learnerIntroduction}</p>
          {content.conceptComparison && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>{content.conceptComparison.left.name}</strong><p className="mt-1 text-xs">{content.conceptComparison.left.desc}</p></div>
              <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>{content.conceptComparison.right.name}</strong><p className="mt-1 text-xs">{content.conceptComparison.right.desc}</p></div>
            </div>
          )}
          {content.flashcard && <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>{t.studioFlashcardLabel}</strong> {content.flashcard.front} → {content.flashcard.back}</div>}
          {content.checkpoint && <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>{t.studioCheckpointLabel}</strong> {content.checkpoint.question}</div>}
          <p className="text-xs text-[#888]"><strong>{t.studioSuccessCriteriaLabel}</strong> {content.successCriteria}</p>
        </div>
      </Card>

      <div className="flex gap-3">
        {iv.status === 'draft' && <Button onClick={handleApprove} disabled={busy} className="flex items-center gap-2"><Check size={16} /> {t.studioApproveRescue}</Button>}
        {iv.status === 'approved' && <Button onClick={handleAssign} disabled={busy} className="flex items-center gap-2"><Send size={16} /> {t.studioAssignRescue}</Button>}
      </div>

      {results && (
        <Card>
          <SectionTitle>{t.studioEffectivenessTitle}</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label={t.studioAssignedCompleted} value={`${results.assignedCount} / ${results.completedCount}`} />
            <Stat label={t.studioMasteryBeforeAfter} value={`${results.averageMasteryBefore ?? '—'}% → ${results.averageMasteryAfter ?? '—'}%`} />
            <Stat label={t.studioImproved} value={results.improved ? t.studioYes : t.studioNotEnoughData} />
            <Stat label={t.studioStillNeedsSupport} value={results.stillNeedingSupportCount} />
          </div>
          {results.smallSample && <p className="text-xs text-[#888] mt-3">{t.studioSmallSampleNote}</p>}
          {results.improved && <StudioLlamaBubble event="INTERVENTION_IMPROVED_RESULTS" className="mt-3" />}
        </Card>
      )}
    </div>
  );
}
