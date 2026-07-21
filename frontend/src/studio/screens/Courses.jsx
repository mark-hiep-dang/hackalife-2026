import { useEffect, useState } from 'react';
import { getCourses, createCourse, getCourse, generateCourseCurriculum, runQualityCheck, getQuality, suggestQualityFix, ignoreQualityIssue, getCourseKnowledge, uploadCourseKnowledge, approveCourseKnowledge, generateContentFromDocument } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, EmptyState, SeverityBadge, Stat } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { Plus, ArrowLeft, Mountain, Sparkles, Upload, Check } from 'lucide-react';
import { useT } from '../../translations';

const CAMP_COLORS = ['bg-[#C7EFC4]', 'bg-[#B9E7EF]', 'bg-[#E3D9F5]', 'bg-[#FBE3B0]', 'bg-[#F5C9DA]'];

function CreateCourseForm({ onCreated, onCancel }) {
  const t = useT();
  const [form, setForm] = useState({ title: '', description: '', targetGroup: '', durationWeeks: 4, examDate: '', learningGoal: '', targetScore: 70, preferredCamps: 4 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const { id } = await createCourse(form);
      onCreated(id);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  const field = (key, label, type = 'text') => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-[#101A24]">{label}</span>
      <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="px-3 py-2 rounded-lg border border-[#101A24]/15 focus:outline-none focus:ring-2 focus:ring-[#B9E7EF]" required={key === 'title'} />
    </label>
  );

  return (
    <Card>
      <SectionTitle>{t.studioCreateCourseTitle}</SectionTitle>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('title', t.studioFieldCourseTitle)}
        {field('targetGroup', t.studioFieldTargetGroup)}
        {field('description', t.studioFieldDescription)}
        {field('learningGoal', t.studioFieldLearningGoal)}
        {field('durationWeeks', t.studioFieldDurationWeeks, 'number')}
        {field('targetScore', t.studioFieldTargetScore, 'number')}
        {field('examDate', t.studioFieldExamDate, 'date')}
        {field('preferredCamps', t.studioFieldPreferredCamps, 'number')}
        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
        <div className="md:col-span-2 flex gap-3 mt-2">
          <Button type="submit" disabled={saving}>{saving ? t.studioSaving : t.studioCreateCourseBtn}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>{t.studioCancel}</Button>
        </div>
      </form>
    </Card>
  );
}

function MountainVisual({ camps, lessons, t }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[#101A24] font-extrabold"><Mountain size={20} /> {t.studioMountainTitle}</div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {camps.map((camp, i) => (
          <div key={camp.id} className={`min-w-[220px] rounded-2xl border border-[#101A24]/10 p-4 ${CAMP_COLORS[i % CAMP_COLORS.length]}`}>
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#101A24]/70 mb-2">{t.studioCampLabel.replace('{n}', i + 1)}</div>
            <div className="font-extrabold text-[#101A24] mb-3">{camp.title}</div>
            <div className="flex flex-col gap-2">
              {lessons.filter((l) => l.campId === camp.id).map((l) => (
                <div key={l.id} className="bg-white/80 rounded-lg px-3 py-2 text-xs font-bold text-[#101A24] flex items-center justify-between">
                  <span>{l.title}</span>
                  <span className="opacity-60">{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="min-w-[140px] rounded-2xl border border-[#101A24]/10 p-4 bg-[#101A24] text-white flex items-center justify-center font-extrabold">
          🏔️ {t.studioSummitLabel}
        </div>
      </div>
    </div>
  );
}

function CourseDetail({ courseId, onBack }) {
  const t = useT();
  const [bundle, setBundle] = useState(null);
  const [quality, setQuality] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [tab, setTab] = useState('architect');

  async function load() {
    const b = await getCourse(courseId);
    setBundle(b);
    const q = await getQuality(courseId);
    setQuality(q);
  }
  useEffect(() => { load(); }, [courseId]);

  async function handleGenerate() {
    setBusy(true);
    try {
      const result = await generateCourseCurriculum(courseId);
      setReaction({ event: 'CURRICULUM_CREATED', context: result });
      await load();
    } finally { setBusy(false); }
  }

  async function handleQualityCheck() {
    setBusy(true);
    try {
      const result = await runQualityCheck(courseId);
      setQuality(result);
      setReaction({ event: 'QUALITY_CHECK_COMPLETE', context: { healthScore: result.healthScore } });
    } finally { setBusy(false); }
  }

  if (!bundle) return <Spinner label={t.studioLoading} />;
  const { course, camps, lessons } = bundle;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> {t.studioBackToCourses}</button>
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#101A24]">{course.title}</h2>
            <p className="text-sm text-[#666]">{course.target_group} · {t.studioWeeksShort.replace('{n}', course.duration_weeks)} · {t.studioFieldTargetScore} {course.target_score}</p>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#EEF0F3]">{course.status}</span>
        </div>
      </Card>

      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} />}

      <div className="flex gap-2">
        <Button variant={tab === 'architect' ? 'primary' : 'secondary'} onClick={() => setTab('architect')}>{t.studioCourseArchitectTab}</Button>
        <Button variant={tab === 'sources' ? 'primary' : 'secondary'} onClick={() => setTab('sources')}>{t.studioSourcesTab}</Button>
        <Button variant={tab === 'quality' ? 'primary' : 'secondary'} onClick={() => setTab('quality')}>{t.studioCourseQualityTab}</Button>
      </div>

      {tab === 'architect' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle subtitle={t.studioCurriculumSubtitle}>{t.studioCurriculumTitle}</SectionTitle>
            <Button onClick={handleGenerate} disabled={busy} className="flex items-center gap-2">
              <Sparkles size={16} /> {camps.length ? t.studioRegenerateCurriculum : t.studioGenerateCurriculum}
            </Button>
          </div>
          {camps.length === 0 ? <EmptyState>{t.studioNoCurriculum}</EmptyState> : <MountainVisual camps={camps} lessons={lessons} t={t} />}
        </Card>
      )}

      {tab === 'sources' && <SourcesTab courseId={courseId} lessons={lessons} t={t} />}

      {tab === 'quality' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>{t.studioQualityCheckTitle}</SectionTitle>
            <Button onClick={handleQualityCheck} disabled={busy}>{busy ? t.studioChecking : t.studioRunCheck}</Button>
          </div>
          {quality ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Stat label={t.studioHealthScoreLabel} value={`${quality.healthScore}/100`} />
                <Stat label={t.studioCanPublishLabel} value={quality.canPublish ? t.studioYes : t.studioNo} />
              </div>
              <div className="flex flex-col gap-2">
                {quality.issues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onChanged={handleQualityCheck} />
                ))}
                {quality.issues.length === 0 && <EmptyState>{t.studioNoIssues}</EmptyState>}
              </div>
            </div>
          ) : <EmptyState>{t.studioNoQualityCheckYet}</EmptyState>}
        </Card>
      )}
    </div>
  );
}

function SourcesTab({ courseId, lessons, t }) {
  const [docs, setDocs] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [genLessonId, setGenLessonId] = useState('');
  const [genDocId, setGenDocId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reaction, setReaction] = useState(null);

  async function load() { setDocs(await getCourseKnowledge(courseId)); }
  useEffect(() => { load(); }, [courseId]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try { await uploadCourseKnowledge(courseId, file, title); setTitle(''); await load(); }
    catch (err) { setError(err.message); } finally { setUploading(false); e.target.value = ''; }
  }

  async function handleApprove(docId) {
    await approveCourseKnowledge(docId);
    await load();
  }

  async function handleGenerate() {
    if (!genLessonId || !genDocId) return;
    setGenerating(true);
    try {
      const result = await generateContentFromDocument(genLessonId, genDocId);
      const lessonTitle = lessons.find((l) => String(l.id) === String(genLessonId))?.title || '';
      setReaction({ event: 'LESSON_KIT_CREATED', context: { itemCount: result.itemCount, lessonTitle } });
    } catch (err) { setError(err.message); } finally { setGenerating(false); }
  }

  const approvedDocs = (docs || []).filter((d) => d.approved);

  return (
    <Card>
      <SectionTitle subtitle={t.studioSourcesSubtitle}>{t.studioSourcesTitle}</SectionTitle>

      <form className="border border-[#101A24]/10 rounded-xl p-4 flex flex-col gap-3 bg-[#F5F6F8] mb-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#101A24]">{t.studioSourceTitleLabel}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
        </label>
        <label className={`px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide bg-white text-[#101A24] border border-[#101A24]/15 hover:bg-[#F5F6F8] flex items-center gap-2 w-fit ${uploading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input type="file" accept=".pdf,.txt" onChange={handleUpload} className="hidden" disabled={uploading} />
          <Upload size={16} /> {uploading ? t.studioAdding : t.studioUploadSourceBtn}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {!docs ? <Spinner label={t.studioLoading} /> : docs.length === 0 ? <EmptyState>{t.studioNoSourcesYet}</EmptyState> : (
        <div className="flex flex-col gap-2 mb-6">
          {docs.map((d) => (
            <div key={d.id} className="border border-[#101A24]/10 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#101A24]">{d.title}</p>
                <p className="text-xs text-[#888]">{d.chunkCount} đoạn · {d.sourceType}</p>
              </div>
              {d.approved
                ? <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-[#C7EFC4]">{t.studioApprove}</span>
                : <Button variant="success" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => handleApprove(d.id)}><Check size={14} /> {t.studioApprove}</Button>}
            </div>
          ))}
        </div>
      )}

      {approvedDocs.length > 0 && (
        <div className="border-t border-[#101A24]/10 pt-4 flex flex-col gap-3">
          <p className="text-sm font-extrabold text-[#101A24]">{t.studioGenerateFromSourceTitle}</p>
          <div className="flex gap-3 flex-wrap">
            <select value={genLessonId} onChange={(e) => setGenLessonId(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm">
              <option value="">{t.studioChooseLessonPlaceholder}</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <select value={genDocId} onChange={(e) => setGenDocId(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm">
              <option value="">{t.studioChooseSourcePlaceholder}</option>
              {approvedDocs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
            <Button onClick={handleGenerate} disabled={generating || !genLessonId || !genDocId} className="flex items-center gap-2">
              <Sparkles size={16} /> {generating ? t.studioGenerating : t.studioGenerateFromSourceBtn}
            </Button>
          </div>
          {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} />}
        </div>
      )}
    </Card>
  );
}

function IssueRow({ issue, onChanged }) {
  const t = useT();
  const [fix, setFix] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    try { setFix(await suggestQualityFix(issue.id)); } finally { setLoading(false); }
  }
  async function handleIgnore() {
    await ignoreQualityIssue(issue.id, 'Trainer đã xem xét và bỏ qua');
    onChanged();
  }

  return (
    <div className="border border-[#101A24]/10 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={issue.severity} />
          <span className="text-xs font-bold text-[#888] uppercase">{issue.category}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={handleSuggest} disabled={loading}>{t.studioSuggestFix}</Button>
          <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={handleIgnore}>{t.studioIgnoreIssue}</Button>
        </div>
      </div>
      <p className="text-sm text-[#101A24]">{issue.message}</p>
      {fix && <p className="text-sm bg-[#F5F6F8] rounded-lg p-2 text-[#101A24]"><strong>{t.studioSuggestionLabel}</strong> {fix.suggestion}</p>}
    </div>
  );
}

export default function Courses() {
  const t = useT();
  const [courses, setCourses] = useState(null);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);

  function refresh() { getCourses().then(setCourses); }
  useEffect(() => { refresh(); }, []);

  if (view === 'create') return <CreateCourseForm onCreated={(id) => { setSelected(id); setView('detail'); refresh(); }} onCancel={() => setView('list')} />;
  if (view === 'detail' && selected) return <CourseDetail courseId={selected} onBack={() => { setView('list'); refresh(); }} />;

  if (!courses) return <Spinner label={t.studioLoading} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle subtitle={t.studioCoursesSubtitle}>{t.studioCoursesTitle}</SectionTitle>
        <Button onClick={() => setView('create')} className="flex items-center gap-2"><Plus size={16} /> {t.studioNewCourse}</Button>
      </div>
      {courses.length === 0 ? (
        <EmptyState>{t.studioNoCoursesYet}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" >
              <button onClick={() => { setSelected(c.id); setView('detail'); }} className="text-left w-full">
                <h3 className="font-extrabold text-[#101A24]">{c.title}</h3>
                <p className="text-sm text-[#666] mt-1">{c.target_group}</p>
                <div className="flex items-center gap-3 mt-3 text-xs font-bold text-[#888]">
                  <span className="px-2 py-1 rounded bg-[#EEF0F3]">{c.status}</span>
                  <span>{t.studioHealthLabel.replace('{score}', c.health_score ?? '—')}</span>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
