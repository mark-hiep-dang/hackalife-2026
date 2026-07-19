import { useEffect, useState } from 'react';
import { getCohorts, getMockExamAnalytics, getQuestionAnalytics, getLearnersAtRisk } from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, Stat, RiskBadge } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'topics', label: 'Theo chủ đề' },
  { id: 'trend', label: 'Xu hướng' },
  { id: 'questions', label: 'Câu hỏi' },
  { id: 'learners', label: 'Học viên cần hỗ trợ' }
];

const TREND_LABEL = {
  high_stable: 'Ổn định ở mức cao', improving: 'Đang cải thiện', plateauing: 'Chững lại',
  declining: 'Đang giảm', inconsistent: 'Không ổn định', insufficient_data: 'Chưa đủ dữ liệu'
};

function OverviewTab({ overview, cohortTrend, insight }) {
  if (!overview) return <EmptyState>Chưa có dữ liệu thi thử cho nhóm học này.</EmptyState>;
  return (
    <div className="flex flex-col gap-4">
      <StudioLlamaBubble event="MOCK_EXAM_COMPLETED" />
      {insight && <Card className="bg-[#F5F6F8] !shadow-none border-0"><p className="text-sm text-[#101A24]">{insight}</p></Card>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Điểm trung bình" value={overview.averageScore} sub={overview.changeFromPrevious != null ? `${overview.changeFromPrevious > 0 ? '+' : ''}${overview.changeFromPrevious} so với vòng trước` : undefined} />
        <Stat label="Điểm trung vị" value={overview.medianScore} />
        <Stat label="Tỷ lệ đạt" value={`${overview.passRate}%`} />
        <Stat label="Xu hướng cả nhóm" value={TREND_LABEL[cohortTrend] || cohortTrend} />
        <Stat label="Cao nhất / Thấp nhất" value={`${overview.highestScore} / ${overview.lowestScore}`} />
        <Stat label="Thời gian làm bài TB" value={`${Math.round(overview.averageCompletionTime / 60)} phút`} />
        <Stat label="Summit Readiness TB" value={`${overview.averageSummitReadiness}%`} />
        <Stat label="Số học viên dự thi" value={overview.attemptedCount} />
      </div>
    </div>
  );
}

function TopicsTab({ topics }) {
  if (!topics?.length) return <EmptyState>Chưa có dữ liệu theo chủ đề.</EmptyState>;
  return (
    <div className="flex flex-col gap-2">
      {topics.map((t) => (
        <div key={t.topic} className="border border-[#101A24]/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-extrabold text-[#101A24]">{t.topic}</p>
            <p className="text-xs text-[#888] mt-1">{t.belowMasteryCount} học viên dưới ngưỡng mastery · lỗi phổ biến: {t.commonIssue}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#101A24]">{t.correctRate}% đúng</span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md ${t.risk === 'Cao' ? 'bg-[#F5C9DA]' : t.risk === 'Trung bình' ? 'bg-[#FBE3B0]' : 'bg-[#C7EFC4]'}`}>Rủi ro {t.risk}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendTab({ trend }) {
  if (!trend?.length) return <EmptyState>Chưa có đủ vòng thi thử để xem xu hướng.</EmptyState>;
  const max = Math.max(...trend.map((t) => t.averageScore || 0), 100);
  return (
    <div className="flex items-end gap-6 h-56 pt-6">
      {trend.map((t) => (
        <div key={t.round} className="flex flex-col items-center gap-2 flex-1">
          <span className="text-sm font-extrabold text-[#101A24]">{t.averageScore ?? '—'}</span>
          <div className="w-full bg-[#B9E7EF] rounded-t-xl" style={{ height: `${((t.averageScore || 0) / max) * 160}px` }} />
          <span className="text-xs font-bold text-[#888]">Vòng {t.round}</span>
        </div>
      ))}
    </div>
  );
}

function QuestionsTab({ examId }) {
  const [questions, setQuestions] = useState(null);
  useEffect(() => { if (examId) getQuestionAnalytics(examId).then(setQuestions); }, [examId]);
  if (!questions) return <Spinner />;
  if (!questions.length) return <EmptyState>Chưa có dữ liệu câu hỏi.</EmptyState>;
  return (
    <div className="flex flex-col gap-2">
      {questions.map((q, i) => (
        <div key={i} className="border border-[#101A24]/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="font-semibold text-[#101A24] text-sm flex-1">{q.questionText}</p>
            <span className="text-sm font-bold text-[#101A24] shrink-0">{q.correctRate}% đúng</span>
          </div>
          {q.flags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {q.flags.map((f) => <span key={f} className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md bg-[#FBE3B0]">{f}</span>)}
            </div>
          )}
          {q.flags?.includes('UNCLEAR_OR_MISLEADING') || q.correctRate < 20 ? (
            <StudioLlamaBubble event="QUESTION_QUALITY_WARNING" context={{ questionLabel: q.questionText.slice(0, 24) + '…' }} className="mt-2" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LearnersTab({ cohortId }) {
  const [learners, setLearners] = useState(null);
  useEffect(() => { if (cohortId) getLearnersAtRisk(cohortId).then(setLearners); }, [cohortId]);
  if (!learners) return <Spinner />;
  return (
    <div className="flex flex-col gap-2">
      {learners.map((l) => (
        <div key={l.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#101A24]/10">
          <span className="font-bold text-[#101A24]">{l.name}</span>
          <RiskBadge status={l.status} />
        </div>
      ))}
    </div>
  );
}

export default function MockExamAnalytics() {
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => { getCohorts().then((cs) => { setCohorts(cs); if (cs.length) setCohortId(cs[0].id); }); }, []);
  useEffect(() => { if (cohortId) getMockExamAnalytics(cohortId).then(setData); }, [cohortId]);

  if (!cohorts) return <Spinner />;
  if (cohorts.length === 0) return <EmptyState>Chưa có nhóm học nào.</EmptyState>;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle="Phân tích kết quả thi thử theo nhóm học.">Thi thử</SectionTitle>

      <select value={cohortId || ''} onChange={(e) => setCohortId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit">
        {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide border ${tab === t.id ? 'bg-[#E3D9F5] border-[#101A24]/10' : 'bg-white border-[#101A24]/10'}`}
          >{t.label}</button>
        ))}
      </div>

      <Card>
        {!data ? <Spinner /> : (
          <>
            {tab === 'overview' && <OverviewTab overview={data.overview} cohortTrend={data.cohortTrend} insight={data.insight} />}
            {tab === 'topics' && <TopicsTab topics={data.topics} />}
            {tab === 'trend' && <TrendTab trend={data.trend} />}
            {tab === 'questions' && <QuestionsTab examId={data.latestExamId} />}
            {tab === 'learners' && <LearnersTab cohortId={cohortId} />}
          </>
        )}
      </Card>
    </div>
  );
}
