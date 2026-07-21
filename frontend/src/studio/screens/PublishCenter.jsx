import { useEffect, useState } from 'react';
import { getCohorts, publishCourse } from '../../utils/studioApi';
import { Card, Button, Spinner } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { UploadCloud } from 'lucide-react';
import { useT } from '../../translations';

function ChecklistItem({ ok, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px] shrink-0"
        style={{ background: ok ? '#C7EFC4' : '#FBE3B0' }}
      >
        {ok ? '✓' : '!'}
      </span>
      <span className="text-[13px] font-bold text-[#101A24]">{label}</span>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 items-start">
      <Card className="!rounded-[28px] !p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-comic font-extrabold text-[15px] text-[#101A24]">✅ {t.studioChecklistTitle}</h3>
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

      <div className="rounded-[28px] p-6 flex flex-col gap-4" style={{ background: 'linear-gradient(135deg,#9FE870,#6BAE2E)', boxShadow: '0 6px 0 #4B9A1E' }}>
        <h3 className="font-comic font-extrabold text-[15px] text-[#101A24]">☁️ {t.studioChooseCohortTitle}</h3>
        {availableCohorts.length === 0 ? (
          <p className="text-sm font-bold text-[#101A24]/70">{t.studioChooseCohortPlaceholder}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {availableCohorts.map((c) => (
              <button key={c.id} onClick={() => setCohortId(String(c.id))}
                className={`text-left px-4 py-3 rounded-2xl font-comic font-bold text-[13px] transition-all ${
                  String(cohortId) === String(c.id) ? 'bg-[#101A24] text-white' : 'bg-white text-[#101A24] hover:-translate-y-0.5'
                }`}
              >{c.name}</button>
            ))}
          </div>
        )}
        {error && <p className="text-sm font-bold text-[#8A2F55] bg-white/70 rounded-lg p-2">{error}</p>}
        <button onClick={handlePublish} disabled={!canPublish || busy}
          className="mt-auto flex items-center justify-center gap-2 font-comic font-extrabold text-sm text-white px-5 py-4 rounded-2xl bg-[#101A24] disabled:opacity-40"
          style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.3)' }}
        >
          <UploadCloud size={16} /> {busy ? t.studioPublishing : t.studioPublishCourseBtn}
        </button>
        {published && <StudioLlamaBubble event="COURSE_PUBLISHED" />}
      </div>
    </div>
  );
}
