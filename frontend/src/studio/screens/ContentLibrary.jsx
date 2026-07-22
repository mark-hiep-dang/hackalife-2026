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

const TYPE_BADGE = {
  knowledge: { icon: '📖', bg: '#B9E7EF', color: '#0E6C82' },
  flashcard: { icon: '🗂️', bg: '#FBE3B0', color: '#8A6414' },
  mcq: { icon: '📝', bg: '#E3D9F5', color: '#5B3F94' },
  scenario: { icon: '📝', bg: '#E3D9F5', color: '#5B3F94' },
  checkpoint: { icon: '🚩', bg: '#E3D9F5', color: '#5B3F94' }
};
const STATUS_STYLE = {
  AI_DRAFT: { bg: '#FBE3B0', color: '#8A6414' },
  TRAINER_EDITING: { bg: '#FBE3B0', color: '#8A6414' },
  READY_FOR_REVIEW: { bg: '#FBE3B0', color: '#8A6414' },
  APPROVED: { bg: '#C7EFC4', color: '#3D7A2E' },
  PUBLISHED: { bg: '#C7EFC4', color: '#3D7A2E' },
  ARCHIVED: { bg: '#EEF0F3', color: '#8A8A8A' }
};
const CARD_BG = { knowledge: { bg: '#fff', shadow: 'rgba(16,26,36,0.06)' }, flashcard: { bg: '#FDF6E9', shadow: '#EBDCB8' } };
function cardStyleFor(contentType) { return CARD_BG[contentType] || { bg: '#fff', shadow: 'rgba(16,26,36,0.06)' }; }

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
  const typeBadge = TYPE_BADGE[item.contentType] || TYPE_BADGE.knowledge;
  const statusStyle = STATUS_STYLE[item.status] || STATUS_STYLE.AI_DRAFT;
  const cardStyle = cardStyleFor(item.contentType);
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
    <div className="rounded-[24px] p-5 flex flex-col gap-3" style={{ background: cardStyle.bg, boxShadow: `0 5px 0 ${cardStyle.shadow}` }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className="text-[11px] font-extrabold uppercase tracking-wide px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
          style={{ background: typeBadge.bg, color: typeBadge.color }}
        >
          {typeBadge.icon} {TYPE_LABEL[item.contentType] || item.contentType}
        </span>
        <span className="font-comic font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl" style={{ background: statusStyle.bg, color: statusStyle.color }}>
          {STATUS_LABEL[item.status] || item.status}
        </span>
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
          {item.contentType === 'knowledge' && item.title && <p className="font-comic font-extrabold text-base text-[#101A24]">{item.title}</p>}
          <p className="font-comic font-bold text-[15px] text-[#101A24] whitespace-pre-wrap leading-snug">{item.questionText || item.front || '(flashcard)'}</p>
          {item.contentType === 'flashcard' && item.back && <p className="text-xs text-[#666]">{item.back}</p>}
        </>
      )}

      {!editing && item.options?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {item.options.map((o, i) => {
            const correct = i === item.correctOption;
            return (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl" style={{ background: correct ? '#EAF6DD' : '#F9FAFB', border: `2px solid ${correct ? '#9FE870' : '#EEF0F3'}` }}>
                <span className="w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center font-comic font-extrabold text-xs shrink-0" style={{ color: correct ? '#3D7A2E' : '#101A24' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[13px] font-bold text-[#101A24]">{o}</span>
              </div>
            );
          })}
        </div>
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
      // Scoped to whichever tab the trainer is looking at — generating while
      // on the Quiz tab must only touch quiz items, never silently redo
      // knowledge/flashcards too (see routes.js's kit/generate contentType).
      const kit = await generateLessonKit(lesson.id, activeTab);
      setReaction({ event: 'LESSON_KIT_CREATED', context: { lessonTitle: lesson.title, ...kit } });
      onChanged();
    } catch (err) {
      setReaction({ event: 'AI_ERROR' });
    } finally { setBusy(false); }
  }

  const TAB_LABEL = { knowledge: t.studioTabKnowledge, flashcard: t.studioTabFlashcard, quiz: t.studioTabQuiz };
  const activeTypes = TABS.find((tb) => tb.key === activeTab).types;
  const visibleItems = items.filter((i) => activeTypes.includes(i.contentType));
  const generateLabel = (visibleItems.length ? t.studioRegenerateKitFor : t.studioGenerateKitFor).replace('{type}', TAB_LABEL[activeTab]);

  return (
    <Card className="!rounded-[28px] !p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-comic font-extrabold text-lg text-[#101A24]">{lesson.title}</h3>
          <p className="text-xs font-bold text-[#8A8A8A] mt-0.5">{t.studioMinutesLabel.replace('{n}', lesson.estimatedMinutes)} · {lesson.difficulty} · {t.studioExamWeightLabel.replace('{n}', Math.round((lesson.examWeight || 0) * 100))}</p>
        </div>
        <button onClick={handleGenerate} disabled={busy}
          className="flex items-center gap-2 font-comic font-extrabold text-[13px] text-white px-5 py-3 rounded-2xl bg-[#101A24] disabled:opacity-50"
        >
          <Sparkles size={16} /> {generateLabel}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => { setActiveTab(tb.key); setShowAddForm(false); }}
            className={`font-comic font-extrabold text-[12.5px] px-4.5 py-2.5 rounded-2xl transition-all ${activeTab === tb.key ? 'bg-[#101A24] text-white shadow-sm' : 'bg-[#F9FAFB] text-[#101A24] hover:shadow-sm'}`}
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
            className={`text-left px-4 py-3 rounded-2xl font-comic font-bold text-[12.5px] transition-all ${
              lessonId === l.id ? 'bg-[#E3D9F5] text-[#101A24] shadow-sm' : 'bg-white text-[#101A24] hover:shadow-sm'
            }`}
            style={{ boxShadow: lessonId === l.id ? '0 3px 0 #C7B8E8' : '0 3px 0 rgba(16,26,36,0.06)' }}
          >{l.title}</button>
        ))}
      </div>
      <div className="flex-1">
        {lesson && <LessonPanel lesson={lesson} items={items} onChanged={onChanged} t={t} />}
      </div>
    </div>
  );
}
