import { useEffect, useState } from 'react';
import { getCohorts, getMisconceptionClusters, detectClusters, getClusterDetail, generateInterventionForCluster } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, EmptyState } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import InterventionDetail from './InterventionDetail';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { useT } from '../../translations';

function ClusterDetail({ clusterId, onBack }) {
  const t = useT();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [interventionId, setInterventionId] = useState(null);

  async function load() { setData(await getClusterDetail(clusterId)); }
  useEffect(() => { load(); }, [clusterId]);

  async function handleGenerate() {
    setBusy(true);
    try {
      const iv = await generateInterventionForCluster(clusterId, 10);
      setInterventionId(iv.id);
    } finally { setBusy(false); }
  }

  if (interventionId) return <InterventionDetail interventionId={interventionId} onBack={() => setInterventionId(null)} />;
  if (!data) return <Spinner label={t.studioLoading} />;
  const { cluster, learners } = data;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> {t.studioBackToClusters}</button>

      <StudioLlamaBubble event="MISCONCEPTION_CLUSTER_FOUND" context={{ count: cluster.learner_count }} />

      <Card>
        <h2 className="text-xl font-extrabold text-[#101A24]">{cluster.title}</h2>
        <p className="text-sm text-[#666] mt-1">{cluster.topic} · {t.studioMistakeTypeLabel.replace('{type}', cluster.mistake_type)}</p>
        <div className="flex gap-4 mt-4 text-sm">
          <span><strong>{cluster.learner_count}</strong> {t.studioLearnersWithMistake}</span>
          <span><strong>{cluster.high_confidence_count}</strong> {t.studioHighConfidenceWrong}</span>
          <span>{t.studioAverageMastery} <strong>{cluster.average_mastery}%</strong></span>
        </div>
        <Button onClick={handleGenerate} disabled={busy} className="mt-5 flex items-center gap-2">
          <Zap size={16} /> {busy ? t.studioCreatingIntervention : t.studioCreateRescueExpedition}
        </Button>
      </Card>

      <Card>
        <h3 className="font-extrabold text-[#101A24] mb-3">{t.studioLearnersInCluster}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {learners.map((l) => <div key={l.id} className="px-3 py-2 rounded-lg bg-[#F5F6F8] text-sm font-bold text-[#101A24]">{l.username}</div>)}
        </div>
      </Card>
    </div>
  );
}

export default function Insights() {
  const t = useT();
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getCohorts().then((cs) => { setCohorts(cs); if (cs.length) setCohortId(cs[0].id); }); }, []);

  async function loadClusters() { if (cohortId) setClusters(await getMisconceptionClusters(cohortId)); }
  useEffect(() => { loadClusters(); }, [cohortId]);

  async function handleDetect() {
    setBusy(true);
    try { await detectClusters(cohortId); await loadClusters(); } finally { setBusy(false); }
  }

  if (selected) return <ClusterDetail clusterId={selected} onBack={() => { setSelected(null); loadClusters(); }} />;
  if (!cohorts) return <Spinner label={t.studioLoading} />;
  if (cohorts.length === 0) return <EmptyState>{t.studioNoCohorts}</EmptyState>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle subtitle={t.studioInsightsSubtitle}>{t.studioInsightsTitle}</SectionTitle>
        <Button onClick={handleDetect} disabled={busy} className="flex items-center gap-2"><Sparkles size={16} /> {busy ? t.studioDetecting : t.studioDetectClusters}</Button>
      </div>

      <select value={cohortId || ''} onChange={(e) => setCohortId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit">
        {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {!clusters ? <Spinner label={t.studioLoading} /> : clusters.length === 0 ? (
        <EmptyState>{t.studioNoClustersYet}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <button onClick={() => setSelected(c.id)} className="text-left w-full">
                <h3 className="font-extrabold text-[#101A24]">{c.title}</h3>
                <p className="text-sm text-[#666] mt-1">{c.topic}</p>
                <p className="text-xs text-[#888] mt-2">{c.learner_count} · {c.high_confidence_count} {t.studioHighConfidenceWrong}</p>
                <span className="inline-block mt-2 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-[#EEF0F3]">{c.status}</span>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
