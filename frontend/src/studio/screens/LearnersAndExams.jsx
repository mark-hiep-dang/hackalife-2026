import { useEffect, useState } from 'react';
import {
  getCohorts, createCohort, getCourses, getMockExamAnalytics, getLearnersAtRisk, getMisconceptionClusters, detectClusters,
  getCohortRoster, addLearnerToCohort, removeLearnerFromCohort, getAllLearnerAccounts
} from '../../utils/studioApi';
import { Card, SectionTitle, Spinner, EmptyState, RiskBadge, PatternBadge, SeverityBadge, Sparkline, Button, CAMP_COLORS, TopicBarList } from '../components/ui';
import { CircularGauge, RoundScoreChart } from '../components/charts';
import RescueExpeditionFlow from '../components/RescueExpeditionFlow';
import LearnerProfile from './LearnerProfile';
import { X, Settings, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useT } from '../../translations';

const NEEDS_ATTENTION_STATUSES = ['Cần hỗ trợ ngay', 'Cần theo dõi'];
const KPI_STYLE = [
  { bg: 'bg-brand-green', shadow: '#8FCB82', ink: 'text-brand-green-ink' },
  { bg: 'bg-brand-cyan', shadow: '#7FBFC9', ink: 'text-brand-cyan-ink' },
  { bg: 'bg-brand-gold', shadow: '#D9BE78', ink: 'text-brand-gold-ink' },
  { bg: 'bg-brand-coral', shadow: '#D398AF', ink: 'text-brand-coral-ink' }
];

// affectedCount is always >= MIN_CLUSTER_SIZE (3) by construction (see
// engines/misconceptionCluster.js), so this only ever spans WARNING/BLOCKER.
function severityForCluster(affectedCount) {
  if (affectedCount >= 5) return 'BLOCKER';
  if (affectedCount >= 4) return 'WARNING';
  return 'SUGGESTION';
}

function initials(name) {
  return (name || '').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';
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
// creating one means picking which course it's for first. Full-page flow
// (not a modal) so a trainer can build the roster in the same place they
// name the group, instead of creating an empty cohort and managing its
// roster as a separate later step.
function CreateStudyGroupPage({ onBack, onCreated, t }) {
  const [courses, setCourses] = useState(null);
  const [allLearners, setAllLearners] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { getCourses().then(setCourses); getAllLearnerAccounts().then(setAllLearners); }, []);

  if (!courses || !allLearners) return <Spinner label={t.studioLoading} />;

  const withMeta = allLearners.map((l) => ({ id: l.id, name: l.username, initials: initials(l.username) }));
  const q = search.trim().toLowerCase();
  const availableLearners = withMeta.filter((l) => !selectedIds.includes(l.id) && l.name.toLowerCase().includes(q));
  const selectedLearners = withMeta.filter((l) => selectedIds.includes(l.id));
  const createDisabled = !groupName.trim() || !courseId || saving;
  const trimmedName = groupName.trim();
  const summary = trimmedName
    ? t.studioSelectedSummaryWithName.replace('{n}', selectedLearners.length).replace('{name}', trimmedName)
    : t.studioSelectedSummaryNoName.replace('{n}', selectedLearners.length);

  async function handleCreate() {
    setSaving(true); setError(null);
    try {
      const { id } = await createCohort({ courseId: Number(courseId), name: trimmedName });
      for (const learnerId of selectedIds) await addLearnerToCohort(id, learnerId);
      onCreated(id);
    } catch (err) { setError(err.message); setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-5 pb-28">
      <button onClick={onBack} className="flex items-center gap-2 font-comic font-extrabold text-sm text-[#101A24] w-fit">
        <ArrowLeft size={16} /> {t.studioCreateCohortBackBtn}
      </button>

      <div>
        <h2 className="font-comic font-extrabold text-2xl text-[#101A24] mb-1">➕ {t.studioCreateCohortTitle}</h2>
        <p className="text-sm font-bold text-[#888]">{t.studioCreateCohortSubtitle}</p>
      </div>

      <Card>
        <h3 className="font-comic font-extrabold text-base text-[#101A24] mb-4">{t.studioGroupDetailsTitle}</h3>
        <div className="flex gap-4 flex-wrap">
          <label className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            <span className="text-xs font-extrabold text-[#101A24]">{t.studioCohortCourseLabel}</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
              className="px-3.5 py-3 rounded-xl border border-[#101A24]/15 bg-white text-sm font-bold text-[#101A24]"
            >
              <option value="">{t.studioChooseCoursePlaceholder}</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            <span className="text-xs font-extrabold text-[#101A24]">{t.studioCohortNameLabel}</span>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t.studioCohortNamePlaceholder}
              className="px-3.5 py-3 rounded-xl border border-[#101A24]/15 bg-white text-sm font-bold text-[#101A24]"
            />
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="flex flex-col min-h-0">
          <h3 className="font-comic font-extrabold text-base text-[#101A24] mb-1">{t.studioAvailableLearnersTitle}</h3>
          <p className="text-xs font-bold text-[#888] mb-3.5">{t.studioAvailableLearnersCount.replace('{n}', availableLearners.length)}</p>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.studioSearchLearnersPlaceholder}
            className="px-3.5 py-2.5 rounded-xl border border-[#101A24]/15 bg-[#F9FAFB] text-sm font-bold text-[#101A24] mb-3.5"
          />
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
            {availableLearners.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[#F9FAFB]">
                <div className="w-9 h-9 rounded-full bg-[#E3D9F5] flex items-center justify-center font-comic font-extrabold text-xs text-[#101A24] shrink-0">{l.initials}</div>
                <span className="flex-1 text-sm font-comic font-extrabold text-[#101A24] truncate">{l.name}</span>
                <button onClick={() => setSelectedIds((ids) => [...ids, l.id])}
                  className="w-7 h-7 rounded-full bg-[#C7EFC4] text-[#2F5C37] font-extrabold text-base leading-none shrink-0"
                >+</button>
              </div>
            ))}
            {availableLearners.length === 0 && (
              <p className="text-center text-xs font-bold text-[#888] py-5">
                {q ? t.studioNoLearnersMatchSearch.replace('{query}', search) : t.studioRosterNoneAvailable}
              </p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col min-h-0">
          <h3 className="font-comic font-extrabold text-base text-[#101A24] mb-1">{t.studioSelectedMembersTitle}</h3>
          <p className="text-xs font-bold text-[#888] mb-3.5">{t.studioSelectedMembersCount.replace('{n}', selectedLearners.length)}</p>
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
            {selectedLearners.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[#F0EEF7]">
                <div className="w-9 h-9 rounded-full bg-[#E3D9F5] flex items-center justify-center font-comic font-extrabold text-xs text-[#101A24] shrink-0">{l.initials}</div>
                <span className="flex-1 text-sm font-comic font-extrabold text-[#101A24] truncate">{l.name}</span>
                <button onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== l.id))}
                  className="w-7 h-7 rounded-full bg-[#F5C9DA] text-[#8A2F55] font-extrabold text-base leading-none shrink-0"
                >−</button>
              </div>
            ))}
            {selectedLearners.length === 0 && (
              <p className="text-center text-xs font-bold text-[#888] py-5">{t.studioNoSelectedMembers}</p>
            )}
          </div>
        </Card>
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 md:left-64 lg:left-72 bg-[#F4F1FB]/95 backdrop-blur-sm border-t-3 border-[#101A24]/10 px-6 md:px-10 md:pr-28 py-4 flex items-center gap-3 z-40">
        <span className="flex-1 text-xs font-bold text-[#888] truncate">{summary}</span>
        <Button variant="secondary" onClick={onBack}>{t.studioCancel}</Button>
        <Button disabled={createDisabled} onClick={handleCreate}>{saving ? t.studioSaving : `✓ ${t.studioCreateCohortBtn}`}</Button>
      </div>
    </div>
  );
}

export default function LearnersAndExams({ initialCohortId } = {}) {
  const t = useT();
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState(initialCohortId ?? null);
  const [analytics, setAnalytics] = useState(null);
  const [learners, setLearners] = useState(null);
  const [roster, setRoster] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [detecting, setDetecting] = useState(false);
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
    getMisconceptionClusters(cohortId).then(setClusters);
  }
  useEffect(() => {
    if (!cohortId) return;
    setAnalytics(null); setLearners(null); setRoster(null); setClusters(null); setShowAllLearners(false);
    loadCohortData();
  }, [cohortId]);

  async function handleDetectMisconceptions() {
    setDetecting(true);
    try { await detectClusters(cohortId); setClusters(await getMisconceptionClusters(cohortId)); } finally { setDetecting(false); }
  }

  async function handleCohortCreated(newCohortId) {
    setShowCreateCohort(false);
    await refreshCohorts(newCohortId);
  }

  if (selectedLearnerId) return <LearnerProfile learnerId={selectedLearnerId} cohortId={cohortId} onBack={() => setSelectedLearnerId(null)} />;
  if (showCreateCohort) return <CreateStudyGroupPage t={t} onBack={() => setShowCreateCohort(false)} onCreated={handleCohortCreated} />;
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
  const targetScore = analytics?.targetScore ?? 70;
  const scoredRounds = (analytics?.trend || []).filter((r) => r.averageScore != null).map((r) => ({ round: r.round, score: r.averageScore }));

  const secondaryKpis = overview ? [
    { label: t.studioAvgScore, value: `${overview.averageScore}%` },
    { label: t.studioMedianScore, value: `${overview.medianScore}%` },
    { label: t.studioCohortTrend, value: t[TREND_LABEL_KEYS[analytics.cohortTrend]] || analytics.cohortTrend },
    { label: t.studioAttemptedCount, value: t.studioAttemptedOutOf.replace('{attempted}', overview.attemptedCount).replace('{roster}', overview.rosterSize ?? '—') }
  ] : [];

  const findings = (clusters || []).map((c) => ({
    ...c, severity: severityForCluster(c.learner_count), affectedCount: c.learner_count
  })).sort((a, b) => b.affectedCount - a.affectedCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionTitle subtitle={t.studioCohortOverviewSubtitle}>👥 {t.studioLearnersExamsTitle}</SectionTitle>
        <div className="flex gap-2 flex-wrap items-center shrink-0">
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

      {cohorts.length === 0 ? <EmptyState>{t.studioNoCohorts}</EmptyState> : (
        <div className="flex gap-2 flex-wrap items-center">
          {cohorts.map((c) => (
            <button key={c.id} onClick={() => setCohortId(c.id)}
              className={`font-comic font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all ${cohortId === c.id ? 'bg-[#101A24] text-white' : 'bg-white text-[#101A24] border border-[#101A24]/10 hover:shadow-sm'}`}
              style={cohortId === c.id ? { boxShadow: '0 3px 0 #000' } : undefined}
            >{c.name}</button>
          ))}
        </div>
      )}

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
          {/* Hero KPI row */}
          <div className="flex gap-4 flex-wrap">
            <div className="bg-white rounded-[26px] border-3 border-[#101A24]/10 shadow-sm px-6 py-5 flex flex-col items-center justify-center shrink-0 w-full sm:w-[220px]">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#888] mb-2 self-start">🎯 {t.studioPassRate}</span>
              <CircularGauge value={overview.passRate} label="" dark={false} size={120} />
              <span className="text-[11px] font-bold text-[#888] mt-2 text-center">
                {t.studioPassCountCaption.replace('{passCount}', overview.aboveThreshold).replace('{total}', overview.attemptedCount)}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-4 min-w-[260px]">
              {secondaryKpis.map((k, i) => (
                <div key={k.label} className={`rounded-[22px] p-4 ${KPI_STYLE[i].bg} flex flex-col justify-center min-h-24`} style={{ boxShadow: `0 5px 0 ${KPI_STYLE[i].shadow}` }}>
                  <div className={`text-[10px] font-extrabold uppercase tracking-wide mb-1.5 leading-tight ${KPI_STYLE[i].ink}`}>{k.label}</div>
                  <div className="font-comic font-extrabold text-[15px] text-[#101A24]">{k.value}</div>
                </div>
              ))}
            </div>
          </div>

          <Card>
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
              <h3 className="font-comic font-extrabold text-[#101A24]">📈 {t.studioScoreByRoundTitle}</h3>
              <span className="text-xs font-bold text-[#888]">{t.studioPassMarkCaption.replace('{score}', targetScore)}</span>
            </div>
            <RoundScoreChart rounds={scoredRounds} targetScore={targetScore} emptyMessage={t.studioNoTrendData} />
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

      {!!overview && (
        <>
          <Card>
            <h3 className="font-comic font-extrabold text-[#101A24] mb-1">{t.studioCohortTopicsTitle}</h3>
            <p className="text-xs font-bold text-[#888] mb-4">{t.studioCohortTopicsSubtitle}</p>
            {!analytics.topics?.length ? <EmptyState>{t.studioNoWeakTopics}</EmptyState> : (
              <TopicBarList
                topics={analytics.topics}
                bandLabels={{ weak: t.studioTopicBandWeak, fair: t.studioTopicBandFair, good: t.studioTopicBandGood }}
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h3 className="font-comic font-extrabold text-[#101A24]">{t.studioTopMistakesTitle}</h3>
              <button onClick={handleDetectMisconceptions} disabled={detecting}
                className="font-comic font-extrabold text-xs px-3.5 py-2 rounded-xl bg-[#F9FAFB] text-[#101A24] hover:shadow-sm disabled:opacity-50"
              >{detecting ? t.studioDetecting : t.studioDetectMisconceptionsBtn}</button>
            </div>
            <p className="text-xs font-bold text-[#888] mb-4">{t.studioTopMistakesSubtitle}</p>
            {clusters === null ? <Spinner label={t.studioLoading} /> : findings.length === 0 ? (
              <EmptyState>{t.studioNoMisconceptionsYet}</EmptyState>
            ) : (
              <div className="flex flex-col gap-2.5">
                {findings.map((f) => (
                  <div key={f.id} className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F9FAFB]">
                    <span className="shrink-0"><SeverityBadge severity={f.severity} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="font-comic font-bold text-[13.5px] text-[#101A24]">{f.topic?.replace(/^\d+\.\s*/, '')}</div>
                      <p className="text-[12.5px] font-bold text-[#666] leading-snug mt-0.5">{f.title}</p>
                    </div>
                    <span className="shrink-0 font-comic font-extrabold text-sm text-[#101A24] whitespace-nowrap">
                      {t.studioAffectedLearnersLabel.replace('{n}', f.affectedCount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {weakestTopic && (
        <button onClick={() => setRescueTopic(weakestTopic)}
          className="self-start flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#E3D9F5] text-[#101A24] font-comic font-extrabold text-sm hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: '0 4px 0 #B7A3DE' }}
        >
          {t.studioCreateRescueForWeakest}
        </button>
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

    </div>
  );
}
