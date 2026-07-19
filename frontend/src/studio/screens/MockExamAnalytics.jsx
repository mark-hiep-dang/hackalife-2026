import { useEffect, useState } from 'react';
import { getCohorts, getMockExamAnalytics, getQuestionAnalytics, getLearnersAtRisk } from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, Stat, RiskBadge } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { useT } from '../../translations';

function OverviewTab({ overview, cohortTrend, insight, t }) {
  const TREND_LABEL = {
    high_stable: t.studioTrendHighStable, improving: t.studioTrendImproving, plateauing: t.studioTrendPlateauing,
    declining: t.studioTrendDeclining, inconsistent: t.studioTrendInconsistent, insufficient_data: t.studioTrendInsufficientData
  };
  if (!overview) return <EmptyState>{t.studioNoMockExamData}</EmptyState>;
  return (
    <div className="flex flex-col gap-4">
      <StudioLlamaBubble event="MOCK_EXAM_COMPLETED" />
      {insight && <Card className="bg-[#F5F6F8] !shadow-none border-0"><p className="text-sm text-[#101A24]">{insight}</p></Card>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label={t.studioAvgScore} value={overview.averageScore} sub={overview.changeFromPrevious != null ? t.studioChangeFromPrevious.replace('{sign}', overview.changeFromPrevious > 0 ? '+' : '').replace('{change}', overview.changeFromPrevious) : undefined} />
        <Stat label={t.studioMedianScore} value={overview.medianScore} />
        <Stat label={t.studioPassRate} value={`${overview.passRate}%`} />
        <Stat label={t.studioCohortTrend} value={TREND_LABEL[cohortTrend] || cohortTrend} />
        <Stat label={t.studioHighestLowest} value={`${overview.highestScore} / ${overview.lowestScore}`} />
        <Stat label={t.studioAvgCompletionTime} value={t.studioMinutesShort.replace('{n}', Math.round(overview.averageCompletionTime / 60))} />
        <Stat label={t.studioAvgSummitReadiness} value={`${overview.averageSummitReadiness}%`} />
        <Stat label={t.studioAttemptedCount} value={overview.attemptedCount} />
      </div>
    </div>
  );
}

function TopicsTab({ topics, t }) {
  if (!topics?.length) return <EmptyState>{t.studioNoTopicData}</EmptyState>;
  return (
    <div className="flex flex-col gap-2">
      {topics.map((topic) => (
        <div key={topic.topic} className="border border-[#101A24]/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-extrabold text-[#101A24]">{topic.topic}</p>
            <p className="text-xs text-[#888] mt-1">{t.studioBelowMasteryLabel.replace('{n}', topic.belowMasteryCount).replace('{issue}', topic.commonIssue)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#101A24]">{t.studioCorrectRateShort.replace('{n}', topic.correctRate)}</span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md ${topic.risk === 'Cao' ? 'bg-[#F5C9DA]' : topic.risk === 'Trung bình' ? 'bg-[#FBE3B0]' : 'bg-[#C7EFC4]'}`}>{t.studioRiskLabel.replace('{risk}', topic.risk)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendTab({ trend, t }) {
  if (!trend?.length) return <EmptyState>{t.studioNoTrendData}</EmptyState>;
  const max = Math.max(...trend.map((r) => r.averageScore || 0), 100);
  return (
    <div className="flex items-end gap-6 h-56 pt-6">
      {trend.map((round) => (
        <div key={round.round} className="flex flex-col items-center gap-2 flex-1">
          <span className="text-sm font-extrabold text-[#101A24]">{round.averageScore ?? '—'}</span>
          <div className="w-full bg-[#B9E7EF] rounded-t-xl" style={{ height: `${((round.averageScore || 0) / max) * 160}px` }} />
          <span className="text-xs font-bold text-[#888]">{t.studioRoundLabel.replace('{n}', round.round)}</span>
        </div>
      ))}
    </div>
  );
}

function QuestionsTab({ examId, t }) {
  const [questions, setQuestions] = useState(null);
  useEffect(() => { if (examId) getQuestionAnalytics(examId).then(setQuestions); }, [examId]);
  if (!questions) return <Spinner label={t.studioLoading} />;
  if (!questions.length) return <EmptyState>{t.studioNoQuestionData}</EmptyState>;
  return (
    <div className="flex flex-col gap-2">
      {questions.map((q, i) => (
        <div key={i} className="border border-[#101A24]/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="font-semibold text-[#101A24] text-sm flex-1">{q.questionText}</p>
            <span className="text-sm font-bold text-[#101A24] shrink-0">{t.studioCorrectRateShort.replace('{n}', q.correctRate)}</span>
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

function LearnersTab({ cohortId, t }) {
  const [learners, setLearners] = useState(null);
  useEffect(() => { if (cohortId) getLearnersAtRisk(cohortId).then(setLearners); }, [cohortId]);
  if (!learners) return <Spinner label={t.studioLoading} />;
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
  const t = useT();
  const TABS = [
    { id: 'overview', label: t.studioTabOverview },
    { id: 'topics', label: t.studioTabByTopic },
    { id: 'trend', label: t.studioTabTrend },
    { id: 'questions', label: t.studioTabQuestions },
    { id: 'learners', label: t.studioTabLearnersSupport }
  ];
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => { getCohorts().then((cs) => { setCohorts(cs); if (cs.length) setCohortId(cs[0].id); }); }, []);
  useEffect(() => { if (cohortId) getMockExamAnalytics(cohortId).then(setData); }, [cohortId]);

  if (!cohorts) return <Spinner label={t.studioLoading} />;
  if (cohorts.length === 0) return <EmptyState>{t.studioNoCohorts}</EmptyState>;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle={t.studioExamsSubtitle}>{t.studioExamsTitle}</SectionTitle>

      <select value={cohortId || ''} onChange={(e) => setCohortId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit">
        {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((tabItem) => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide border ${tab === tabItem.id ? 'bg-[#E3D9F5] border-[#101A24]/10' : 'bg-white border-[#101A24]/10'}`}
          >{tabItem.label}</button>
        ))}
      </div>

      <Card>
        {!data ? <Spinner label={t.studioLoading} /> : (
          <>
            {tab === 'overview' && <OverviewTab overview={data.overview} cohortTrend={data.cohortTrend} insight={data.insight} t={t} />}
            {tab === 'topics' && <TopicsTab topics={data.topics} t={t} />}
            {tab === 'trend' && <TrendTab trend={data.trend} t={t} />}
            {tab === 'questions' && <QuestionsTab examId={data.latestExamId} t={t} />}
            {tab === 'learners' && <LearnersTab cohortId={cohortId} t={t} />}
          </>
        )}
      </Card>
    </div>
  );
}
