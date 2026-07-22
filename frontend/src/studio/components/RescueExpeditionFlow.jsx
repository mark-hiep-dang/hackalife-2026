import { useEffect, useState } from 'react';
import { detectClusters, generateInterventionForCluster } from '../../utils/studioApi';
import { Spinner, Button } from './ui';
import InterventionDetail from '../screens/InterventionDetail';

// Shared by Cohort Overview and Learner Detail — both offer a "Create Rescue
// Expedition for weakest topic" CTA against the same cohort-wide cluster data.
export default function RescueExpeditionFlow({ cohortId, topic, onClose, t }) {
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
