import { useEffect, useState } from 'react';
import { getCohorts, publishCourse } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { CheckCircle2, XCircle, UploadCloud } from 'lucide-react';
import { useT } from '../../translations';

function ChecklistItem({ ok, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 size={18} className="text-[#2E7D32]" /> : <XCircle size={18} className="text-[#C2185B]" />}
      <span className={ok ? 'text-[#101A24]' : 'text-[#101A24] font-bold'}>{label}</span>
    </div>
  );
}

// Rendered as a tab inside CourseDetail (Courses.jsx) — `bundle`/`quality` are
// owned by the parent (same computation the Quality tab already runs, not
// duplicated here) and `onRunQualityCheck`/`busy` reuse its handler.
export default function PublishCenter({ courseId, bundle, quality, onRunQualityCheck, busy }) {
  const t = useT();
  const [cohorts, setCohorts] = useState(null);
  const [cohortId, setCohortId] = useState('');
  const [published, setPublished] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { getCohorts().then(setCohorts); }, []);

  async function handlePublish() {
    setError(null);
    try { await publishCourse(courseId, Number(cohortId)); setPublished(true); }
    catch (err) { setError(err.message); }
  }

  if (!bundle || !cohorts) return <Spinner label={t.studioLoading} />;

  const lessons = bundle.lessons || [];
  const hasBlockers = quality?.issues?.some((i) => i.severity === 'BLOCKER');
  const hasLessons = lessons.length > 0;
  const hasSources = lessons.length > 0 && lessons.every((l) => (l.sourceChunkIds || []).length > 0);
  const hasCheckpoints = bundle.contentItems?.some((c) => c.contentType === 'checkpoint');
  const unapprovedDrafts = bundle.contentItems?.filter((c) => c.status === 'AI_DRAFT').length || 0;
  const cohortSelected = !!cohortId;
  const availableCohorts = cohorts.filter((c) => c.course_id === courseId);
  const canPublish = quality && !hasBlockers && hasLessons && cohortSelected;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>{t.studioChecklistTitle}</SectionTitle>
          <Button variant="secondary" onClick={onRunQualityCheck} disabled={busy}>{busy ? t.studioChecking : t.studioRunQualityCheck}</Button>
        </div>
        <div className="flex flex-col gap-3">
          <ChecklistItem ok={hasLessons} label={t.studioChecklistHasLessons} />
          <ChecklistItem ok={hasSources} label={t.studioChecklistHasSources} />
          <ChecklistItem ok={hasCheckpoints} label={t.studioChecklistHasCheckpoints} />
          <ChecklistItem ok={!!quality && !hasBlockers} label={t.studioChecklistNoBlockers} />
          <ChecklistItem ok={unapprovedDrafts === 0} label={t.studioChecklistNoDrafts.replace('{n}', unapprovedDrafts)} />
          <ChecklistItem ok={cohortSelected} label={t.studioChecklistCohortSelected} />
        </div>
      </Card>

      <Card>
        <SectionTitle>{t.studioChooseCohortTitle}</SectionTitle>
        <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit mb-4">
          <option value="">{t.studioChooseCohortPlaceholder}</option>
          {availableCohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div>
          <Button onClick={handlePublish} disabled={!canPublish || busy} className="flex items-center gap-2">
            <UploadCloud size={16} /> {busy ? t.studioPublishing : t.studioPublishCourseBtn}
          </Button>
        </div>
        {published && <StudioLlamaBubble event="COURSE_PUBLISHED" className="mt-4" />}
      </Card>
    </div>
  );
}
