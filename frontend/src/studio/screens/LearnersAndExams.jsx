import { useEffect, useState } from 'react';
import {
  getCohorts, createCohort, getCourses, getMockExamAnalytics, getLearnersAtRisk, detectClusters, generateInterventionForCluster,
  getCohortRoster, addLearnerToCohort, removeLearnerFromCohort, getAllLearnerAccounts
} from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, RiskBadge, PatternBadge, Sparkline, Button, CAMP_COLORS } from '../components/ui';
import InterventionDetail from './InterventionDetail';
import LearnerProfile from './LearnerProfile';
import { Rocket, X, Settings, Plus, Trash2 } from 'lucide-react';
import { useT } from '../../translations';

const RISK_TIER_STYLE = { Cao: 'bg-[#F5C9DA] text-[#8A2F55]', 'Trung bình': 'bg-[#FBE3B0] text-[#8A6414]', Thấp: 'bg-[#C7EFC4] text-[#3D7A2E]' };
const NEEDS_ATTENTION_STATUSES = ['Cần hỗ trợ ngay', 'Cần theo dõi'];
const KPI_STYLE = [
  { bg: 'bg-brand-green', shadow: '#8FCB82', ink: 'text-brand-green-ink' },
  { bg: 'bg-brand-cyan', shadow: '#7FBFC9', ink: 'text-brand-cyan-ink' },
  { bg: 'bg-brand-lavender', shadow: '#B7A3DE', ink: 'text-brand-lavender-ink' },
  { bg: 'bg-brand-gold', shadow: '#D9BE78', ink: 'text-brand-gold-ink' },
  { bg: 'bg-brand-coral', shadow: '#D398AF', ink: 'text-brand-coral-ink' }
];

function initials(name) {
  return (name || '').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';
}

function TrendBars({ trend, t }) {
  if (!trend?.length) return <EmptyState>{t.studioNoTrendData}</EmptyState>;
  const max = Math.max(...trend.map((r) => r.averageScore || 0), 10);
  return (
    <div className="flex items-end gap-6 h-40 px-3">
      {trend.map((round) => (
        <div key={round.round} className="flex flex-col items-center gap-2 flex-1">
          <span className="font-comic font-extrabold text-sm text-[#101A24]">{round.averageScore ?? '—'}</span>
          <div
            className="w-full max-w-16 rounded-t-xl rounded-b-sm"
            style={{ height: `${((round.averageScore || 0) / max) * 140}px`, background: 'linear-gradient(180deg,#8FD1DC,#2178C4)' }}
          />
          <span className="text-[11px] font-extrabold text-[#8A8A8A]">{t.studioRoundLabel.replace('{n}', round.round)}</span>
        </div>
      ))}
    </div>
  );
}

function RescueExpeditionFlow({ cohortId, topic, onClose, t }) {
  const [clusters, setClusters] = useState(null);
  const [interventionId, setInterventionId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    detectClusters(cohortId).then((res) => {
      setClusters((res.clusters || []).filter((c) => c.topic === topic.topic));
    });
  }, [cohortId, topic.topic]);

  if (interventionId) return <InterventionDetail interventionId={interventionId} onBack={onClose} />;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-comic font-extrabold text-lg text-[#101A24]">🚀 {t.studioCreateRescueExpedition}</h3>
      <p className="text-sm font-bold text-[#8A8A8A]">{topic.topic.replace(/^\d+\.\s*/, '')}</p>
      {clusters === null ? <Spinner label={t.studioLoading} /> : clusters.length === 0 ? (
        <p className="text-sm text-[#888]">{t.studioNoClusterForTopic}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {clusters.map((c) => (
            <Button key={c.id} variant="secondary" className="!px-4 !py-2.5 text-sm text-left" disabled={busy} onClick={async () => {
              setBusy(true);
              try { const iv = await generateInterventionForCluster(c.id, 10); setInterventionId(iv.id); } finally { setBusy(false); }
            }}>{busy ? t.studioCreatingIntervention : c.title}</Button>
          ))}
        </div>
      )}
      <Button variant="secondary" className="w-fit" onClick={onClose}>{t.studioCancel}</Button>
    </div>
  );
}

function WeakTopicCard({ topic, onCreateRescue, t }) {
  return (
    <div className="p-4 rounded-2xl bg-[#F9FAFB] flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-comic font-bold text-sm text-[#101A24]">{topic.topic.replace(/^\d+\.\s*/, '')}</span>
        <span className={`font-comic font-extrabold text-[10px] px-3 py-1 rounded-xl shrink-0 whitespace-nowrap ${RISK_TIER_STYLE[topic.risk] || RISK_TIER_STYLE['Trung bình']}`}>
          {t.studioRiskLabel.replace('{risk}', topic.risk)}
        </span>
      </div>
      <p className="text-xs font-bold text-[#8A8A8A] leading-snug">
        {t.studioBelowMasteryLabel.replace('{n}', topic.belowMasteryCount).replace('{issue}', topic.commonIssue || '—')}
      </p>
      <Button variant="secondary" className="!px-3 !py-2 text-xs w-fit flex items-center gap-1.5" onClick={() => onCreateRescue(topic)}>
        <Rocket size={13} /> {t.studioCreateRescueExpedition}
      </Button>
    </div>
  );
}

const TREND_LABEL_KEYS = {
  high_stable: 'studioTrendHighStable', improving: 'studioTrendImproving', plateauing: 'studioTrendPlateauing',
  declining: 'studioTrendDeclining', inconsistent: 'studioTrendInconsistent', insufficient_data: 'studioTrendInsufficientData'
};

// The pool to add from is every real learner account (studioApi's
// getAllLearnerAccounts) — the same accounts the rest of Studio's learner
// features read from — regardless of whether they've attempted anything yet.
function CohortRosterModal({ cohortId, onClose, onChanged, t }) {
  const [roster, setRoster] = useState(null);
  const [allLearners, setAllLearners] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setRoster(await getCohortRoster(cohortId));
    setAllLearners(await getAllLearnerAccounts());
  }
  useEffect(() => { load(); }, [cohortId]);

  async function handleAdd(learnerId) {
    setBusyId(learnerId);
    try { await addLearnerToCohort(cohortId, learnerId); await load(); onChanged(); } finally { setBusyId(null); }
  }
  async function handleRemove(learnerId) {
    setBusyId(learnerId);
    try { await removeLearnerFromCohort(cohortId, learnerId); await load(); onChanged(); } finally { setBusyId(null); }
  }

  if (!roster || !allLearners) return <Spinner label={t.studioLoading} />;
  const rosterIds = new Set(roster.map((l) => l.id));
  const available = allLearners.filter((l) => !rosterIds.has(l.id));

  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-comic font-extrabold text-lg text-[#101A24]">⚙️ {t.studioManageRosterTitle}</h3>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#8A8A8A] mb-2">{t.studioRosterCurrentMembers.replace('{n}', roster.length)}</p>
        {roster.length === 0 ? (
          <p className="text-sm text-[#888]">{t.studioRosterNoMembers}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {roster.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#F9FAFB]">
                <span className="font-comic font-bold text-sm text-[#101A24] truncate">{l.username}</span>
                <button onClick={() => handleRemove(l.id)} disabled={busyId === l.id}
                  className="text-[#101A24]/50 hover:text-red-600 disabled:opacity-30 shrink-0"
                ><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#8A8A8A] mb-2">{t.studioRosterAddMember}</p>
        {available.length === 0 ? (
          <p className="text-sm text-[#888]">{t.studioRosterNoneAvailable}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {available.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#F9FAFB]">
                <span className="font-comic font-bold text-sm text-[#101A24] truncate">{l.username}</span>
                <button onClick={() => handleAdd(l.id)} disabled={busyId === l.id}
                  className="text-[#101A24]/50 hover:text-[#3D7A2E] disabled:opacity-30 shrink-0"
                ><Plus size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="secondary" className="w-fit" onClick={onClose}>{t.studioCancel}</Button>
    </div>
  );
}

// Each cohort belongs to exactly one course (studio_cohorts.course_id), so
// creating one means picking which course it's for first.
function CreateCohortModal({ onClose, onCreated, t }) {
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { getCourses().then(setCourses); }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const { id } = await createCohort({ courseId: Number(courseId), name });
      onCreated(id);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  if (!courses) return <Spinner label={t.studioLoading} />;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h3 className="font-comic font-extrabold text-lg text-[#101A24]">➕ {t.studioCreateCohortTitle}</h3>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#101A24]">{t.studioCohortCourseLabel}</span>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white">
          <option value="">{t.studioChooseCoursePlaceholder}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#101A24]">{t.studioCohortNameLabel}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !courseId}>{saving ? t.studioSaving : t.studioCreateCohortBtn}</Button>
        <Button type="button" variant="secondary" onClick={onClose}>{t.studioCancel}</Button>
      </div>
    </form>
  );
}

export default function LearnersAndExams() {
  const t = useT();
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [learners, setLearners] = useState(null);
  const [roster, setRoster] = useState(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const [rescueTopic, setRescueTopic] = useState(null);
  const [showAllLearners, setShowAllLearners] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showCreateCohort, setShowCreateCohort] = useState(false);

  function refreshCohorts(selectId) {
    return getCohorts().then((cs) => { setCohorts(cs); if (selectId) setCohortId(selectId); else if (cs.length && !cohortId) setCohortId(cs[0].id); return cs; });
  }
  useEffect(() => { refreshCohorts(); }, []);

  function loadCohortData() {
    if (!cohortId) return;
    getMockExamAnalytics(cohortId).then(setAnalytics);
    getLearnersAtRisk(cohortId).then(setLearners);
    getCohortRoster(cohortId).then(setRoster);
  }
  useEffect(() => {
    if (!cohortId) return;
    setAnalytics(null); setLearners(null); setRoster(null); setShowAllLearners(false);
    loadCohortData();
  }, [cohortId]);

  async function handleCohortCreated(newCohortId) {
    setShowCreateCohort(false);
    await refreshCohorts(newCohortId);
  }

  if (selectedLearnerId) return <LearnerProfile learnerId={selectedLearnerId} onBack={() => setSelectedLearnerId(null)} />;
  if (!cohorts) return <Spinner label={t.studioLoading} />;

  const needsAttentionLearners = (learners || []).filter((l) => NEEDS_ATTENTION_STATUSES.includes(l.status) || (l.outlierPatterns || []).length > 0);
  const needsHelpCount = (learners || []).filter((l) => l.status === 'Cần hỗ trợ ngay').length;
  // "View all" means every roster member, including those with zero quiz
  // activity yet (getLearnersAtRisk silently excludes them) — merge in a
  // placeholder row for those rather than hiding them.
  const allRosterLearners = (roster || []).map((r) => {
    const withRisk = (learners || []).find((l) => l.id === r.id);
    if (withRisk) return withRisk;
    return { id: r.id, name: r.username, latestScore: null, scoreHistory: [], status: 'Chưa đủ dữ liệu', reasons: [t.studioNoActivityYet], outlierPatterns: [] };
  });
  const visibleLearners = showAllLearners ? allRosterLearners : needsAttentionLearners;
  const weakestTopic = analytics?.topics?.[0];
  const overview = analytics?.overview;

  const kpis = overview ? [
    { label: t.studioAvgScore, value: overview.averageScore },
    { label: t.studioMedianScore, value: overview.medianScore },
    { label: t.studioPassRate, value: `${overview.passRate}%` },
    { label: t.studioCohortTrend, value: t[TREND_LABEL_KEYS[analytics.cohortTrend]] || analytics.cohortTrend },
    { label: t.studioAttemptedCount, value: t.studioAttemptedOutOf.replace('{attempted}', overview.attemptedCount).replace('{roster}', overview.rosterSize ?? '—') }
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionTitle subtitle={t.studioLearnersExamsSubtitle}>👥 {t.studioLearnersExamsTitle}</SectionTitle>
        <div className="flex gap-2 flex-wrap items-center">
          {cohorts.map((c) => (
            <button key={c.id} onClick={() => setCohortId(c.id)}
              className={`font-comic font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all ${cohortId === c.id ? 'bg-[#101A24] text-white shadow-sm' : 'bg-white text-[#101A24] border border-[#101A24]/10 hover:shadow-sm'}`}
            >{c.name}</button>
          ))}
          <button onClick={() => setShowRosterModal(true)} disabled={!cohortId}
            className="flex items-center gap-1.5 font-comic font-extrabold text-xs px-4 py-2.5 rounded-2xl bg-white text-[#101A24] border border-[#101A24]/10 hover:shadow-sm disabled:opacity-40"
          >
            <Settings size={14} /> {t.studioManageRosterBtn}
          </button>
          <button onClick={() => setShowCreateCohort(true)}
            className="flex items-center gap-1.5 font-comic font-extrabold text-xs px-4 py-2.5 rounded-2xl bg-[#E3D9F5] text-[#101A24] hover:shadow-sm"
          >
            <Plus size={14} /> {t.studioNewCohortBtn}
          </button>
        </div>
      </div>

      {cohorts.length === 0 && <EmptyState>{t.studioNoCohorts}</EmptyState>}

      {learners && (
        <div className="flex items-center gap-3.5 bg-[#E3D9F5] rounded-3xl px-5 py-4 shadow-sm">
          <span className="text-2xl shrink-0">🦙</span>
          <p className="text-sm font-comic font-bold text-[#4A2E7A] leading-snug">
            {needsHelpCount > 0 && weakestTopic
              ? t.studioInsightNeedsHelpAndTopic.replace('{count}', needsHelpCount).replace('{topic}', weakestTopic.topic.replace(/^\d+\.\s*/, ''))
              : t.studioInsightAllGood}
          </p>
        </div>
      )}

      {!analytics ? <Spinner label={t.studioLoading} /> : !overview ? <EmptyState>{t.studioNoMockExamData}</EmptyState> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {kpis.map((k, i) => (
              <div key={k.label} className={`rounded-[22px] p-4 ${KPI_STYLE[i].bg} flex flex-col justify-center min-h-24`} style={{ boxShadow: `0 5px 0 ${KPI_STYLE[i].shadow}` }}>
                <div className={`text-[10px] font-extrabold uppercase tracking-wide mb-1.5 leading-tight ${KPI_STYLE[i].ink}`}>{k.label}</div>
                <div className="font-comic font-extrabold text-[15px] text-[#101A24]">{k.value}</div>
              </div>
            ))}
          </div>

          <Card>
            <h3 className="font-comic font-extrabold text-[#101A24] mb-4">📈 {t.studioScoreByRoundTitle}</h3>
            <TrendBars trend={analytics.trend} t={t} />
          </Card>

          <Card>
            <h3 className="font-comic font-extrabold text-[#101A24] mb-4">🧩 {t.studioWeakTopicsTitle}</h3>
            {!analytics.topics?.length ? <EmptyState>{t.studioNoWeakTopics}</EmptyState> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {analytics.topics.slice(0, 3).map((tp) => <WeakTopicCard key={tp.topic} topic={tp} onCreateRescue={setRescueTopic} t={t} />)}
              </div>
            )}
          </Card>
        </>
      )}

      {cohortId && (
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-comic font-extrabold text-[#101A24]">🙋 {showAllLearners ? t.studioLearnerListTitle : t.studioLearnerListNeedsAttentionTitle}</h3>
          {roster && roster.length > 0 && (
            <button onClick={() => setShowAllLearners((v) => !v)} className="font-comic font-extrabold text-xs px-3.5 py-2 rounded-xl bg-[#F9FAFB] text-[#101A24] hover:shadow-sm">
              {showAllLearners ? t.studioShowNeedsAttentionOnly : t.studioViewAllLearners}
            </button>
          )}
        </div>
        {!learners || !roster ? <Spinner label={t.studioLoading} /> : roster.length === 0 ? (
          <EmptyState>{t.studioNoLearnersInCohort}</EmptyState>
        ) : visibleLearners.length === 0 ? (
          <EmptyState>{t.studioNoLearnersNeedAttention}</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleLearners.map((l, i) => (
              <button key={l.id} onClick={() => setSelectedLearnerId(l.id)}
                className="text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#F9FAFB] hover:translate-x-0.5 transition-transform"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-comic font-extrabold text-sm text-[#101A24] shrink-0 ${CAMP_COLORS[i % CAMP_COLORS.length]}`}>
                  {initials(l.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-comic font-extrabold text-sm text-[#101A24] truncate">{l.name}</div>
                  <div className="text-xs font-bold text-[#8A8A8A] mt-0.5 truncate">{l.reasons?.join(' · ') || t.studioNoNotes}</div>
                </div>
                <Sparkline points={l.scoreHistory || []} width={80} height={24} className="shrink-0 hidden sm:block" />
                <span className="font-comic font-extrabold text-sm text-[#101A24] w-10 text-right shrink-0">{l.latestScore ?? '—'}</span>
                <RiskBadge status={l.status} />
                <div className="hidden lg:flex gap-1.5 shrink-0">
                  {(l.outlierPatterns || []).map((p) => <PatternBadge key={p.type} type={p.type} title={p.reason} />)}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
      )}

      {rescueTopic && (
        <div className="fixed inset-0 z-50 bg-[#101A24]/40 flex items-center justify-center p-4" onClick={() => setRescueTopic(null)}>
          <div className="bg-[#F4F1FB] rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setRescueTopic(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <X size={16} />
            </button>
            <RescueExpeditionFlow cohortId={cohortId} topic={rescueTopic} t={t} onClose={() => setRescueTopic(null)} />
          </div>
        </div>
      )}

      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-[#101A24]/40 flex items-center justify-center p-4" onClick={() => setShowRosterModal(false)}>
          <div className="bg-[#F4F1FB] rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowRosterModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <X size={16} />
            </button>
            <CohortRosterModal cohortId={cohortId} t={t} onClose={() => setShowRosterModal(false)} onChanged={loadCohortData} />
          </div>
        </div>
      )}

      {showCreateCohort && (
        <div className="fixed inset-0 z-50 bg-[#101A24]/40 flex items-center justify-center p-4" onClick={() => setShowCreateCohort(false)}>
          <div className="bg-[#F4F1FB] rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCreateCohort(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <X size={16} />
            </button>
            <CreateCohortModal t={t} onClose={() => setShowCreateCohort(false)} onCreated={handleCohortCreated} />
          </div>
        </div>
      )}
    </div>
  );
}
