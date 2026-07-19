import { useEffect, useState } from 'react';
import { getIntervention, approveIntervention, assignIntervention, getInterventionResults } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, Stat } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { ArrowLeft, Check, Send } from 'lucide-react';

export default function InterventionDetail({ interventionId, onBack }) {
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

  if (!iv) return <Spinner />;
  const content = iv.content || {};

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> Quay lại</button>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#101A24]">{iv.title}</h2>
            <p className="text-sm text-[#666] mt-1">{iv.duration_minutes} phút · {iv.topic}</p>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#EEF0F3]">{iv.status}</span>
        </div>
      </Card>

      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} />}
      {iv.status === 'draft' && <StudioLlamaBubble event="INTERVENTION_CREATED" context={{ duration: iv.duration_minutes }} />}

      <Card>
        <SectionTitle subtitle="Xem trước toàn bộ nội dung trước khi duyệt và giao cho học viên.">Nội dung chặng cứu hộ</SectionTitle>
        <div className="flex flex-col gap-4 text-sm text-[#101A24]">
          <p><strong>Tóm tắt cho trainer:</strong> {content.trainerSummary}</p>
          <p><strong>Giới thiệu cho học viên:</strong> {content.learnerIntroduction}</p>
          {content.conceptComparison && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>{content.conceptComparison.left.name}</strong><p className="mt-1 text-xs">{content.conceptComparison.left.desc}</p></div>
              <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>{content.conceptComparison.right.name}</strong><p className="mt-1 text-xs">{content.conceptComparison.right.desc}</p></div>
            </div>
          )}
          {content.flashcard && <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>Flashcard:</strong> {content.flashcard.front} → {content.flashcard.back}</div>}
          {content.checkpoint && <div className="bg-[#F5F6F8] rounded-xl p-3"><strong>Checkpoint:</strong> {content.checkpoint.question}</div>}
          <p className="text-xs text-[#888]"><strong>Tiêu chí thành công:</strong> {content.successCriteria}</p>
        </div>
      </Card>

      <div className="flex gap-3">
        {iv.status === 'draft' && <Button onClick={handleApprove} disabled={busy} className="flex items-center gap-2"><Check size={16} /> Duyệt chặng cứu hộ</Button>}
        {iv.status === 'approved' && <Button onClick={handleAssign} disabled={busy} className="flex items-center gap-2"><Send size={16} /> Giao cho học viên trong cụm</Button>}
      </div>

      {results && (
        <Card>
          <SectionTitle>Hiệu quả can thiệp</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Đã giao / Hoàn thành" value={`${results.assignedCount} / ${results.completedCount}`} />
            <Stat label="Mastery trước → sau" value={`${results.averageMasteryBefore ?? '—'}% → ${results.averageMasteryAfter ?? '—'}%`} />
            <Stat label="Cải thiện" value={results.improved ? 'Có' : 'Chưa đủ dữ liệu'} />
            <Stat label="Vẫn cần hỗ trợ" value={results.stillNeedingSupportCount} />
          </div>
          {results.smallSample && <p className="text-xs text-[#888] mt-3">Mẫu còn nhỏ — kết quả mang tính tham khảo, chưa đủ để kết luận chắc chắn.</p>}
          {results.improved && <StudioLlamaBubble event="INTERVENTION_IMPROVED_RESULTS" className="mt-3" />}
        </Card>
      )}
    </div>
  );
}
