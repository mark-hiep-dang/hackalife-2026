import { useEffect, useState } from 'react';
import { generateLessonKit, reviewContentItem, rewriteContentItem, createContentItem, deleteContentItem } from '../../utils/studioApi';
import { Card, Button, Spinner, EmptyState } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { Sparkles, Check, X, Pencil, RefreshCw, Plus, Trash2, Flag } from 'lucide-react';
import { useT } from '../../translations';

const TABS = [
  { key: 'knowledge', types: ['knowledge'] },
  { key: 'flashcard', types: ['flashcard'] },
  { key: 'quiz', types: ['mcq', 'scenario', 'checkpoint'] }
];

function QuizFields({ value, onChange, t }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#101A24]">{t.studioQuizQuestionLabel}</span>
        <textarea value={value.questionText} onChange={(e) => set({ questionText: e.target.value })} rows={2} required
          className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
      </label>
      {[0, 1, 2, 3].map((i) => (
        <label key={i} className="flex items-center gap-2 text-sm">
          <input type="radio" name="correctOption" checked={value.correctOption === i} onChange={() => set({ correctOption: i })} />
          <input value={value.options[i] || ''} onChange={(e) => { const opts = [...value.options]; opts[i] = e.target.value; set({ options: opts }); }}
            placeholder={t.studioQuizOptionLabel.replace('{letter}', String.fromCharCode(65 + i))} required
            className="flex-1 px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
        </label>
      ))}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#101A24]">{t.studioQuizExplanationLabel}</span>
        <textarea value={value.explanation} onChange={(e) => set({ explanation: e.target.value })} rows={2}
          className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
      </label>
    </>
  );
}

function ContentItemCard({ item, onChanged, t }) {
  const TYPE_LABEL = { flashcard: t.studioTypeFlashcard, mcq: t.studioTypeMcq, scenario: t.studioTypeScenario, checkpoint: t.studioTypeCheckpoint, knowledge: t.studioTypeKnowledge };
  const STATUS_LABEL = { AI_DRAFT: t.studioStatusAiDraft, TRAINER_EDITING: t.studioStatusTrainerEditing, READY_FOR_REVIEW: t.studioStatusReadyForReview, APPROVED: t.studioStatusApproved, PUBLISHED: t.studioStatusPublished, ARCHIVED: t.studioStatusArchived };
  const isQuiz = ['mcq', 'scenario', 'checkpoint'].includes(item.contentType);
  const isPublished = !!(item.publishedQuestionId || item.publishedFlashcardId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: item.title || '', front: item.front || '', back: item.back || '', keyword: item.keyword || '',
    questionText: item.questionText || '', explanation: item.explanation || '',
    options: item.options?.length ? item.options : ['', '', '', ''], correctOption: item.correctOption ?? 0
  });
  const [rewrite, setRewrite] = useState(null);
  const [busy, setBusy] = useState(false);

  async function act(action, fields) {
    setBusy(true);
    try { await reviewContentItem(item.id, action, fields); onChanged(); } finally { setBusy(false); }
  }
  async function handleRewrite() {
    setBusy(true);
    try { setRewrite(await rewriteContentItem(item.id, [])); } finally { setBusy(false); }
  }
  async function saveEdit() {
    if (item.contentType === 'flashcard') await act('edit', { front: draft.front, back: draft.back, keyword: draft.keyword });
    else if (item.contentType === 'knowledge') await act('edit', { title: draft.title, questionText: draft.questionText });
    else await act('edit', { questionText: draft.questionText, explanation: draft.explanation, options: draft.options, correctOption: draft.correctOption });
    setEditing(false);
  }
  async function handleDelete() {
    if (!window.confirm(t.studioDeleteConfirm)) return;
    setBusy(true);
    try { await deleteContentItem(item.id); onChanged(); } catch (err) { window.alert(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="border border-[#101A24]/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{TYPE_LABEL[item.contentType] || item.contentType}</span>
          {item.contentType === 'checkpoint' && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-[#FBE3B0] flex items-center gap-1"><Flag size={10} /> {t.studioTypeCheckpoint}</span>
          )}
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-[#EEF0F3]">{STATUS_LABEL[item.status] || item.status}</span>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          {item.contentType === 'flashcard' && (
            <>
              <textarea value={draft.front} onChange={(e) => setDraft((d) => ({ ...d, front: e.target.value }))} rows={2} className="w-full text-sm border border-[#101A24]/15 rounded-lg p-2" placeholder={t.studioFlashcardFront} />
              <textarea value={draft.back} onChange={(e) => setDraft((d) => ({ ...d, back: e.target.value }))} rows={2} className="w-full text-sm border border-[#101A24]/15 rounded-lg p-2" placeholder={t.studioFlashcardBack} />
              <input value={draft.keyword} onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))} className="w-full text-sm border border-[#101A24]/15 rounded-lg p-2" placeholder={t.studioFlashcardKeyword} />
            </>
          )}
          {item.contentType === 'knowledge' && (
            <>
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="w-full text-sm border border-[#101A24]/15 rounded-lg p-2" placeholder={t.studioKnowledgeTitle} />
              <textarea value={draft.questionText} onChange={(e) => setDraft((d) => ({ ...d, questionText: e.target.value }))} rows={5} className="w-full text-sm border border-[#101A24]/15 rounded-lg p-2" placeholder={t.studioKnowledgeBody} />
            </>
          )}
          {isQuiz && <QuizFields value={draft} onChange={setDraft} t={t} />}
        </div>
      ) : (
        <>
          {item.contentType === 'knowledge' && item.title && <p className="text-sm font-extrabold text-[#101A24]">{item.title}</p>}
          <p className="text-sm text-[#101A24] font-semibold whitespace-pre-wrap">{item.questionText || item.front || '(flashcard)'}</p>
          {item.contentType === 'flashcard' && item.back && <p className="text-xs text-[#666]">{item.back}</p>}
        </>
      )}

      {!editing && item.options?.length > 0 && (
        <ul className="text-xs text-[#666] list-disc list-inside">
          {item.options.map((o, i) => <li key={i} className={i === item.correctOption ? 'font-bold text-[#101A24]' : ''}>{o}</li>)}
        </ul>
      )}
      {rewrite && <p className="text-xs bg-[#F5F6F8] rounded-lg p-2 text-[#101A24]"><strong>{t.studioSuggestRewrite}</strong> {rewrite.rewrittenText || rewrite.suggestion}</p>}

      <div className="flex flex-wrap gap-2 mt-1">
        {editing ? (
          <>
            <Button variant="success" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={saveEdit} disabled={busy}><Check size={14} /> {t.studioSave}</Button>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setEditing(false)}>{t.studioCancel}</Button>
          </>
        ) : (
          <>
            <Button variant="success" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act('approve')} disabled={busy}><Check size={14} /> {t.studioApprove}</Button>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => setEditing(true)}><Pencil size={14} /> {t.studioEdit}</Button>
            {item.contentType !== 'knowledge' && item.contentType !== 'flashcard' && (
              <Button variant="secondary" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={handleRewrite} disabled={busy}><RefreshCw size={14} /> {t.studioLlamaRewrite}</Button>
            )}
            {isQuiz && (
              <Button variant="secondary" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act('toggleCheckpoint')} disabled={busy}>
                <Flag size={14} /> {item.contentType === 'checkpoint' ? t.studioUnmarkCheckpoint : t.studioMarkCheckpoint}
              </Button>
            )}
            <Button variant="danger" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act('reject')} disabled={busy}><X size={14} /> {t.studioReject}</Button>
            <Button
              variant="danger" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={handleDelete}
              disabled={busy || isPublished} title={isPublished ? t.studioDeleteBlockedPublished : undefined}
            ><Trash2 size={14} /> {t.studioDelete}</Button>
          </>
        )}
      </div>
    </div>
  );
}

function AddContentForm({ contentType, lessonId, onAdded, onCancel, t }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState('');
  const [quiz, setQuiz] = useState({ questionText: '', options: ['', '', '', ''], correctOption: 0, explanation: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (contentType === 'flashcard') await createContentItem(lessonId, { contentType, front, back, keyword });
      else if (contentType === 'knowledge') await createContentItem(lessonId, { contentType, title, questionText: back });
      else await createContentItem(lessonId, { contentType: 'mcq', questionText: quiz.questionText, options: quiz.options, correctOption: quiz.correctOption, explanation: quiz.explanation });
      onAdded();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="border border-[#101A24]/10 rounded-xl p-4 flex flex-col gap-3 bg-[#F5F6F8]">
      {contentType === 'flashcard' && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#101A24]">{t.studioFlashcardFront}</span>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} required className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#101A24]">{t.studioFlashcardBack}</span>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} required className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#101A24]">{t.studioFlashcardKeyword}</span>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
          </label>
        </>
      )}
      {contentType === 'knowledge' && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#101A24]">{t.studioKnowledgeTitle}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#101A24]">{t.studioKnowledgeBody}</span>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={5} required className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm bg-white" />
          </label>
        </>
      )}
      {contentType === 'quiz' && <QuizFields value={quiz} onChange={setQuiz} t={t} />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="success" disabled={saving}>{saving ? t.studioAdding : t.studioSave}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>{t.studioCancel}</Button>
      </div>
    </form>
  );
}

function LessonPanel({ lesson, items, onChanged, t }) {
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [activeTab, setActiveTab] = useState('knowledge');
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    try {
      const kit = await generateLessonKit(lesson.id);
      setReaction({ event: 'LESSON_KIT_CREATED', context: { lessonTitle: lesson.title, ...kit } });
      onChanged();
    } catch (err) {
      setReaction({ event: 'AI_ERROR' });
    } finally { setBusy(false); }
  }

  const TAB_LABEL = { knowledge: t.studioTabKnowledge, flashcard: t.studioTabFlashcard, quiz: t.studioTabQuiz };
  const activeTypes = TABS.find((tb) => tb.key === activeTab).types;
  const visibleItems = items.filter((i) => activeTypes.includes(i.contentType));

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-extrabold text-[#101A24]">{lesson.title}</h3>
          <p className="text-xs text-[#888]">{t.studioMinutesLabel.replace('{n}', lesson.estimatedMinutes)} · {lesson.difficulty} · {t.studioExamWeightLabel.replace('{n}', Math.round((lesson.examWeight || 0) * 100))}</p>
        </div>
        <Button onClick={handleGenerate} disabled={busy} className="flex items-center gap-2">
          <Sparkles size={16} /> {items.length ? t.studioRegenerateKit : t.studioGenerateKit}
        </Button>
      </div>

      <div className="flex gap-2 mb-4 border-b border-[#101A24]/10 pb-2">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => { setActiveTab(tb.key); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide ${activeTab === tb.key ? 'bg-[#E3D9F5] text-[#101A24]' : 'text-[#888] hover:bg-[#F5F6F8]'}`}
          >{TAB_LABEL[tb.key]}</button>
        ))}
      </div>

      <div className="mb-3">
        <Button variant="secondary" onClick={() => setShowAddForm((v) => !v)} className="flex items-center gap-2">
          <Plus size={16} /> {t.studioAddContentBtn.replace('{type}', TAB_LABEL[activeTab])}
        </Button>
      </div>
      {showAddForm && (
        <AddContentForm contentType={activeTab} lessonId={lesson.id} t={t} onCancel={() => setShowAddForm(false)}
          onAdded={() => { setShowAddForm(false); onChanged(); }} />
      )}
      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} className="mb-3 mt-3" />}
      {visibleItems.length === 0 ? (
        <EmptyState>{t.studioNoContentYet}</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {visibleItems.map((item) => <ContentItemCard key={item.id} item={item} onChanged={onChanged} t={t} />)}
        </div>
      )}
    </Card>
  );
}

// Rendered as a tab inside CourseDetail (Courses.jsx) — `bundle` (course +
// camps + lessons + contentItems) and `onChanged` (re-fetch) are owned by the
// parent so this never needs its own course-selection or bundle fetch.
export default function ContentLibrary({ bundle, onChanged }) {
  const t = useT();
  const [lessonId, setLessonId] = useState(null);

  useEffect(() => { if (!lessonId && bundle?.lessons?.length) setLessonId(bundle.lessons[0].id); }, [bundle]);

  if (!bundle) return <Spinner label={t.studioLoading} />;
  if (bundle.lessons.length === 0) return <EmptyState>{t.studioNoLessonsYet}</EmptyState>;

  const lesson = bundle.lessons.find((l) => l.id === lessonId);
  const items = bundle.contentItems.filter((c) => c.lessonId === lessonId);

  return (
    <div className="flex gap-6 flex-col md:flex-row">
      <div className="md:w-64 shrink-0 flex flex-col gap-2">
        {bundle.lessons.map((l) => (
          <button key={l.id} onClick={() => setLessonId(l.id)}
            className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold border ${lessonId === l.id ? 'bg-[#E3D9F5] border-[#101A24]/10' : 'bg-white border-[#101A24]/10 hover:bg-[#F5F6F8]'}`}
          >{l.title}</button>
        ))}
      </div>
      <div className="flex-1">
        {lesson && <LessonPanel lesson={lesson} items={items} onChanged={onChanged} t={t} />}
      </div>
    </div>
  );
}
