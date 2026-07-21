import { useEffect, useState } from 'react';
import {
  getCourses, createCourse, getCourse, generateCourseCurriculum, runQualityCheck, getQuality, suggestQualityFix, ignoreQualityIssue,
  getCourseKnowledge, uploadCourseKnowledge, deleteCourseKnowledge, generateContentFromDocument,
  createCamp, updateCamp, deleteCamp, createLesson, updateLesson, deleteLesson
} from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, EmptyState, SeverityBadge, Stat, CAMP_COLORS } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import ContentLibrary from './ContentLibrary';
import PublishCenter from './PublishCenter';
import { Plus, ArrowLeft, Mountain, Sparkles, Upload, Pencil, Trash2 } from 'lucide-react';
import { useT } from '../../translations';

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

function AddLessonForm({ campId, t, onAdded, onCancel }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    try { await createLesson(campId, { title }); onAdded(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.studioLessonTitleLabel} required
        className="px-2 py-1.5 rounded-lg border border-[#101A24]/15 text-xs bg-white" />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="success" className="!px-2 !py-1 text-[11px]" disabled={saving}>{saving ? t.studioAdding : t.studioSave}</Button>
        <Button type="button" variant="secondary" className="!px-2 !py-1 text-[11px]" onClick={onCancel}>{t.studioCancel}</Button>
      </div>
    </form>
  );
}

function LessonRow({ lesson, t, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: lesson.title, description: lesson.description || '', estimatedMinutes: lesson.estimatedMinutes, difficulty: lesson.difficulty });
  const [busy, setBusy] = useState(false);
  const isPublished = lesson.status === 'PUBLISHED';

  async function save() {
    setBusy(true);
    try { await updateLesson(lesson.id, draft); setEditing(false); onChanged(); } finally { setBusy(false); }
  }
  async function handleDelete() {
    if (!window.confirm(t.studioDeleteLessonConfirm)) return;
    setBusy(true);
    try { await deleteLesson(lesson.id); onChanged(); } catch (err) { window.alert(err.message); } finally { setBusy(false); }
  }

  if (editing) {
    return (
      <div className="bg-white/90 rounded-lg p-2.5 flex flex-col gap-2">
        <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="px-2 py-1 rounded border border-[#101A24]/15 text-xs bg-white" />
        <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2}
          placeholder={t.studioLessonDescriptionLabel} className="px-2 py-1 rounded border border-[#101A24]/15 text-xs bg-white" />
        <div className="flex gap-2">
          <input type="number" value={draft.estimatedMinutes} onChange={(e) => setDraft((d) => ({ ...d, estimatedMinutes: Number(e.target.value) }))}
            className="w-16 px-2 py-1 rounded border border-[#101A24]/15 text-xs bg-white" />
          <select value={draft.difficulty} onChange={(e) => setDraft((d) => ({ ...d, difficulty: e.target.value }))} className="px-2 py-1 rounded border border-[#101A24]/15 text-xs bg-white">
            <option value="Dễ">Dễ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Khó">Khó</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="success" className="!px-2 !py-1 text-[11px]" onClick={save} disabled={busy}>{t.studioSave}</Button>
          <Button variant="secondary" className="!px-2 !py-1 text-[11px]" onClick={() => setEditing(false)}>{t.studioCancel}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 rounded-lg px-3 py-2 text-xs font-bold text-[#101A24] flex items-center justify-between gap-2">
      <span className="truncate">{lesson.title}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="opacity-60">{lesson.status}</span>
        <button onClick={() => setEditing(true)} className="text-[#101A24]/60 hover:text-[#101A24]"><Pencil size={12} /></button>
        <button onClick={handleDelete} disabled={busy || isPublished} title={isPublished ? t.studioDeleteLessonBlockedPublished : undefined}
          className="text-[#101A24]/60 hover:text-red-600 disabled:opacity-30 disabled:hover:text-[#101A24]/60"><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

function CampCard({ camp, index, lessons, t, onChanged }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(camp.title);
  const [addingLesson, setAddingLesson] = useState(false);
  const [busy, setBusy] = useState(false);
  const campLessons = lessons.filter((l) => l.campId === camp.id);
  const hasPublished = campLessons.some((l) => l.status === 'PUBLISHED');

  async function saveTitle() {
    setBusy(true);
    try { await updateCamp(camp.id, { title: titleDraft }); setEditingTitle(false); onChanged(); } finally { setBusy(false); }
  }
  async function handleDeleteCamp() {
    if (!window.confirm(t.studioDeleteCampConfirm)) return;
    setBusy(true);
    try { await deleteCamp(camp.id); onChanged(); } catch (err) { window.alert(err.message); } finally { setBusy(false); }
  }

  return (
    <div className={`min-w-[240px] rounded-2xl border border-[#101A24]/10 p-4 ${CAMP_COLORS[index % CAMP_COLORS.length]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-extrabold uppercase tracking-widest text-[#101A24]/70">{t.studioCampLabel.replace('{n}', index + 1)}</div>
        <div className="flex gap-1.5">
          <button onClick={() => setEditingTitle(true)} className="text-[#101A24]/60 hover:text-[#101A24]"><Pencil size={13} /></button>
          <button onClick={handleDeleteCamp} disabled={busy || hasPublished} title={hasPublished ? t.studioDeleteCampBlockedPublished : undefined}
            className="text-[#101A24]/60 hover:text-red-600 disabled:opacity-30 disabled:hover:text-[#101A24]/60"><Trash2 size={13} /></button>
        </div>
      </div>
      {editingTitle ? (
        <div className="flex flex-col gap-2 mb-3">
          <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="px-2 py-1.5 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
          <div className="flex gap-2">
            <Button variant="success" className="!px-2 !py-1 text-xs" onClick={saveTitle} disabled={busy}>{t.studioSave}</Button>
            <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => { setEditingTitle(false); setTitleDraft(camp.title); }}>{t.studioCancel}</Button>
          </div>
        </div>
      ) : (
        <div className="font-extrabold text-[#101A24] mb-3">{camp.title}</div>
      )}
      <div className="flex flex-col gap-2">
        {campLessons.map((l) => <LessonRow key={l.id} lesson={l} t={t} onChanged={onChanged} />)}
      </div>
      {addingLesson ? (
        <AddLessonForm campId={camp.id} t={t} onCancel={() => setAddingLesson(false)} onAdded={() => { setAddingLesson(false); onChanged(); }} />
      ) : (
        <button onClick={() => setAddingLesson(true)} className="mt-2.5 text-xs font-extrabold text-[#101A24]/70 hover:text-[#101A24] flex items-center gap-1">
          <Plus size={12} /> {t.studioAddLesson}
        </button>
      )}
    </div>
  );
}

function MountainVisual({ courseId, camps, lessons, t, onChanged }) {
  const [addingCamp, setAddingCamp] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddCamp(e) {
    e.preventDefault();
    setSaving(true);
    try { await createCamp(courseId, newCampTitle); setNewCampTitle(''); setAddingCamp(false); onChanged(); } finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[#101A24] font-extrabold"><Mountain size={20} /> {t.studioMountainTitle}</div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {camps.map((camp, i) => <CampCard key={camp.id} camp={camp} index={i} lessons={lessons} t={t} onChanged={onChanged} />)}
        <div className="min-w-[160px] rounded-2xl border border-[#101A24]/10 p-4 bg-[#101A24] text-white flex flex-col items-center justify-center gap-3">
          <span className="font-extrabold text-center">🏔️ {t.studioSummitLabel}</span>
          {addingCamp ? (
            <form onSubmit={handleAddCamp} className="flex flex-col gap-2 w-full">
              <input value={newCampTitle} onChange={(e) => setNewCampTitle(e.target.value)} required autoFocus
                placeholder={t.studioCampTitleLabel} className="px-2 py-1 rounded text-xs text-[#101A24]" />
              <div className="flex gap-1">
                <Button type="submit" variant="success" className="!px-2 !py-1 text-[10px]" disabled={saving}>{t.studioSave}</Button>
                <Button type="button" variant="secondary" className="!px-2 !py-1 text-[10px]" onClick={() => setAddingCamp(false)}>{t.studioCancel}</Button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAddingCamp(true)} className="text-xs font-extrabold text-white/80 hover:text-white flex items-center gap-1">
              <Plus size={12} /> {t.studioAddCamp}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceMaterialsPanel({ courseId, docs, onDocsChanged, t }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try { await uploadCourseKnowledge(courseId, file, title); setTitle(''); await onDocsChanged(); }
    catch (err) { setError(err.message); } finally { setUploading(false); e.target.value = ''; }
  }

  async function handleDelete(docId) {
    if (!window.confirm(t.studioDeleteSourceConfirm)) return;
    setDeletingId(docId); setError(null);
    try { await deleteCourseKnowledge(docId); await onDocsChanged(); }
    catch (err) { setError(err.message); } finally { setDeletingId(null); }
  }

  return (
    <div className="flex flex-col gap-3 mb-5 pb-5 border-b border-[#101A24]/10">
      <div>
        <p className="text-sm font-bold text-[#101A24]">{t.studioSourcesTitle}</p>
        <p className="text-xs text-[#888]">{t.studioSourcesSubtitle}</p>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-bold text-[#101A24]">{t.studioSourceTitleLabel}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
        </label>
        <label className={`px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide bg-white text-[#101A24] border border-[#101A24]/15 hover:bg-[#F5F6F8] flex items-center gap-2 w-fit ${uploading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input type="file" accept=".pdf,.txt" onChange={handleUpload} className="hidden" disabled={uploading} />
          <Upload size={16} /> {uploading ? t.studioAdding : t.studioUploadSourceBtn}
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {docs !== null && (docs.length === 0 ? (
        <p className="text-xs text-[#888]">{t.studioNoSourcesYet}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((d) => (
            <div key={d.id} className="border border-[#101A24]/10 rounded-xl p-3 flex items-center justify-between gap-3 bg-white">
              <p className="text-sm font-bold text-[#101A24] truncate">{d.title}</p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-xs text-[#888]">{d.chunkCount} đoạn · {d.sourceType}</p>
                <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}
                  className="text-[#101A24]/60 hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GenerateFromSourcePanel({ docs, lessons, t }) {
  const [genLessonId, setGenLessonId] = useState('');
  const [genDocId, setGenDocId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [reaction, setReaction] = useState(null);

  async function handleGenerate() {
    if (!genLessonId || !genDocId) return;
    setGenerating(true); setError(null);
    try {
      const result = await generateContentFromDocument(genLessonId, genDocId);
      const lessonTitle = lessons.find((l) => String(l.id) === String(genLessonId))?.title || '';
      setReaction({ event: 'LESSON_KIT_CREATED', context: { itemCount: result.itemCount, lessonTitle } });
    } catch (err) { setError(err.message); } finally { setGenerating(false); }
  }

  if (!docs || docs.length === 0) return null;

  return (
    <Card>
      <p className="text-sm font-extrabold text-[#101A24] mb-3">{t.studioGenerateFromSourceTitle}</p>
      <div className="flex gap-3 flex-wrap">
        <select value={genLessonId} onChange={(e) => setGenLessonId(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm">
          <option value="">{t.studioChooseLessonPlaceholder}</option>
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <select value={genDocId} onChange={(e) => setGenDocId(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm">
          <option value="">{t.studioChooseSourcePlaceholder}</option>
          {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <Button onClick={handleGenerate} disabled={generating || !genLessonId || !genDocId} className="flex items-center gap-2">
          <Sparkles size={16} /> {generating ? t.studioGenerating : t.studioGenerateFromSourceBtn}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} className="mt-3" />}
    </Card>
  );
}

function CourseDetail({ courseId, onBack }) {
  const t = useT();
  const [bundle, setBundle] = useState(null);
  const [quality, setQuality] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [tab, setTab] = useState('architect');
  const [prompt, setPrompt] = useState('');
  const [knowledgeDocs, setKnowledgeDocs] = useState(null);

  async function load() {
    const b = await getCourse(courseId);
    setBundle(b);
    const q = await getQuality(courseId);
    setQuality(q);
  }
  async function loadKnowledgeDocs() {
    setKnowledgeDocs(await getCourseKnowledge(courseId));
  }
  useEffect(() => { load(); loadKnowledgeDocs(); }, [courseId]);

  async function handleGenerate() {
    setBusy(true);
    try {
      const result = await generateCourseCurriculum(courseId, prompt);
      setReaction({ event: 'CURRICULUM_CREATED', context: result });
      await load();
    } catch (err) {
      window.alert(err.message);
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

      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === 'architect' ? 'primary' : 'secondary'} onClick={() => setTab('architect')}>{t.studioCourseArchitectTab}</Button>
        <Button variant={tab === 'quality' ? 'primary' : 'secondary'} onClick={() => setTab('quality')}>{t.studioCourseQualityTab}</Button>
        <Button variant={tab === 'library' ? 'primary' : 'secondary'} onClick={() => setTab('library')}>{t.studioNavLibrary}</Button>
        <Button variant={tab === 'publish' ? 'primary' : 'secondary'} onClick={() => setTab('publish')}>{t.studioNavPublish}</Button>
      </div>

      {tab === 'architect' && (() => {
        const hasApprovedContent = lessons.some((l) => l.status === 'APPROVED' || l.status === 'PUBLISHED');
        return (
          <>
            <Card>
              <SectionTitle subtitle={t.studioCurriculumSubtitle}>{t.studioCurriculumTitle}</SectionTitle>
              <SourceMaterialsPanel courseId={courseId} docs={knowledgeDocs} onDocsChanged={loadKnowledgeDocs} t={t} />
              {hasApprovedContent ? (
                <p className="text-sm text-[#888] italic mb-4">{t.studioRegenerateBlockedMessage}</p>
              ) : (
                <div className="flex flex-col gap-3 mb-4">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-bold text-[#101A24]">{t.studioCurriculumPromptLabel}</span>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
                      placeholder={t.studioCurriculumPromptPlaceholder} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm" />
                  </label>
                  {knowledgeDocs !== null && (
                    <p className="text-xs text-[#888] italic">
                      {knowledgeDocs.length > 0
                        ? t.studioWillUseDocs.replace('{n}', knowledgeDocs.length)
                        : prompt.trim() ? t.studioWillUseGoalOnly : t.studioWillUseBank}
                    </p>
                  )}
                  <Button onClick={handleGenerate} disabled={busy} className="flex items-center gap-2 w-fit">
                    <Sparkles size={16} /> {camps.length ? t.studioRegenerateCurriculum : t.studioGenerateCurriculum}
                  </Button>
                </div>
              )}
              {camps.length === 0 ? <EmptyState>{t.studioNoCurriculum}</EmptyState> : <MountainVisual courseId={courseId} camps={camps} lessons={lessons} t={t} onChanged={load} />}
            </Card>
            <GenerateFromSourcePanel docs={knowledgeDocs} lessons={lessons} t={t} />
          </>
        );
      })()}

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

      {tab === 'library' && <ContentLibrary bundle={bundle} onChanged={load} />}
      {tab === 'publish' && <PublishCenter courseId={courseId} bundle={bundle} quality={quality} onRunQualityCheck={handleQualityCheck} busy={busy} />}
    </div>
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
