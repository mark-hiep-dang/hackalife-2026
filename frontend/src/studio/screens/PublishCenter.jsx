import { useEffect, useState } from 'react';
import { getCourses, getCourse, getCohorts, runQualityCheck, getQuality, publishCourse } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, EmptyState } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { CheckCircle2, XCircle, UploadCloud } from 'lucide-react';

function ChecklistItem({ ok, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 size={18} className="text-[#2E7D32]" /> : <XCircle size={18} className="text-[#C2185B]" />}
      <span className={ok ? 'text-[#101A24]' : 'text-[#101A24] font-bold'}>{label}</span>
    </div>
  );
}

export default function PublishCenter() {
  const [courses, setCourses] = useState(null);
  const [cohorts, setCohorts] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [cohortId, setCohortId] = useState('');
  const [bundle, setBundle] = useState(null);
  const [quality, setQuality] = useState(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCourses().then((cs) => { setCourses(cs); if (cs.length) setCourseId(cs[0].id); });
    getCohorts().then(setCohorts);
  }, []);

  async function load() {
    if (!courseId) return;
    setBundle(await getCourse(courseId));
    setQuality(await getQuality(courseId));
    setPublished(false);
    setError(null);
  }
  useEffect(() => { load(); }, [courseId]);

  async function handleCheck() {
    setBusy(true);
    try { setQuality(await runQualityCheck(courseId)); } finally { setBusy(false); }
  }

  async function handlePublish() {
    setBusy(true); setError(null);
    try { await publishCourse(courseId, Number(cohortId)); setPublished(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (!courses || !cohorts) return <Spinner />;
  if (courses.length === 0) return <EmptyState>Chưa có khóa học nào để publish.</EmptyState>;

  const lessons = bundle?.lessons || [];
  const hasBlockers = quality?.issues?.some((i) => i.severity === 'BLOCKER');
  const hasLessons = lessons.length > 0;
  const hasSources = lessons.length > 0 && lessons.every((l) => (l.sourceChunkIds || []).length > 0);
  const hasCheckpoints = bundle?.contentItems?.some((c) => c.contentType === 'checkpoint');
  const unapprovedDrafts = bundle?.contentItems?.filter((c) => c.status === 'AI_DRAFT').length || 0;
  const cohortSelected = !!cohortId;
  const availableCohorts = cohorts.filter((c) => c.course_id === courseId || bundle?.course?.id === c.course_id);
  const canPublish = quality && !hasBlockers && hasLessons && cohortSelected;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle="Kiểm tra toàn bộ trước khi mở khóa học cho học viên.">Publish Center</SectionTitle>

      <select value={courseId || ''} onChange={(e) => setCourseId(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit">
        {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      {!bundle ? <Spinner /> : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Checklist trước khi publish</SectionTitle>
              <Button variant="secondary" onClick={handleCheck} disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Chạy Quality Check'}</Button>
            </div>
            <div className="flex flex-col gap-3">
              <ChecklistItem ok={hasLessons} label="Đã có chặng học trong giáo trình" />
              <ChecklistItem ok={hasSources} label="Mọi chặng học đều có nguồn tài liệu đã duyệt" />
              <ChecklistItem ok={hasCheckpoints} label="Có ít nhất một checkpoint kiểm tra" />
              <ChecklistItem ok={!!quality && !hasBlockers} label="Không còn vấn đề chặn publish (blocker)" />
              <ChecklistItem ok={unapprovedDrafts === 0} label={`Không còn nội dung AI Draft chưa duyệt (${unapprovedDrafts} còn lại)`} />
              <ChecklistItem ok={cohortSelected} label="Đã chọn nhóm học để publish" />
            </div>
          </Card>

          <Card>
            <SectionTitle>Chọn nhóm học và publish</SectionTitle>
            <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold w-fit mb-4">
              <option value="">— Chọn nhóm học —</option>
              {availableCohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div>
              <Button onClick={handlePublish} disabled={!canPublish || busy} className="flex items-center gap-2">
                <UploadCloud size={16} /> {busy ? 'Đang publish…' : 'Publish khóa học'}
              </Button>
            </div>
            {published && <StudioLlamaBubble event="COURSE_PUBLISHED" className="mt-4" />}
          </Card>
        </>
      )}
    </div>
  );
}
