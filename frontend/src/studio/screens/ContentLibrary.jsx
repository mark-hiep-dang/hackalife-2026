import { useEffect, useState } from 'react';
import { getCourses, getCourse, generateLessonKit, reviewContentItem, rewriteContentItem } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, EmptyState } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { Sparkles, Check, X, Pencil, RefreshCw } from 'lucide-react';

const TYPE_LABEL = { flashcard: 'Flashcard', mcq: 'Câu hỏi', scenario: 'Tình huống', checkpoint: 'Checkpoint' };
const STATUS_LABEL = { AI_DRAFT: 'AI nháp', TRAINER_EDITING: 'Đang chỉnh sửa', READY_FOR_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', PUBLISHED: 'Đã publish', ARCHIVED: 'Đã loại bỏ' };

function ContentItemCard({ item, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.questionText || '');
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

  return (
    <div className="border border-[#101A24]/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{TYPE_LABEL[item.contentType] || item.contentType}</span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-[#EEF0F3]">{STATUS_LABEL[item.status] || item.status}</span>
      </div>
      {editing ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full text-sm border border-[#101A24]/15 rounded-lg p-2" rows={3} />
      ) : (
        <p className="text-sm text-[#101A24] font-semibold">{item.questionText || item.front || '(flashcard)'}</p>
      )}
      {item.options?.length > 0 && (
        <ul className="text-xs text-[#666] list-disc list-inside">
          {item.options.map((o, i) => <li key={i} className={i === item.correctOption ? 'font-bold text-[#101A24]' : ''}>{o}</li>)}
        </ul>
      )}
      {rewrite && <p className="text-xs bg-[#F5F6F8] rounded-lg p-2 text-[#101A24]"><strong>Gợi ý viết lại:</strong> {rewrite.rewrittenText || rewrite.suggestion}</p>}
      <div className="flex flex-wrap gap-2 mt-1">
        {editing ? (
          <>
            <Button variant="success" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => { act('edit', { questionText: draft }); setEditing(false); }} disabled={busy}><Check size={14} /> Lưu</Button>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setEditing(false)}>Hủy</Button>
          </>
        ) : (
          <>
            <Button variant="success" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act('approve')} disabled={busy}><Check size={14} /> Duyệt</Button>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => setEditing(true)}><Pencil size={14} /> Sửa</Button>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={handleRewrite} disabled={busy}><RefreshCw size={14} /> Llama viết lại</Button>
            <Button variant="danger" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act('reject')} disabled={busy}><X size={14} /> Loại bỏ</Button>
          </>
        )}
      </div>
    </div>
  );
}

function LessonPanel({ lesson, items, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState(null);

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

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-extrabold text-[#101A24]">{lesson.title}</h3>
          <p className="text-xs text-[#888]">{lesson.estimatedMinutes} phút · {lesson.difficulty} · Trọng số thi {Math.round((lesson.examWeight || 0) * 100)}%</p>
        </div>
        <Button onClick={handleGenerate} disabled={busy} className="flex items-center gap-2">
          <Sparkles size={16} /> {items.length ? 'Tạo lại bộ nội dung' : 'Tạo bộ nội dung AI'}
        </Button>
      </div>
      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} className="mb-3" />}
      {items.length === 0 ? (
        <EmptyState>Chưa có nội dung. Bấm "Tạo bộ nội dung AI" để soạn flashcard, câu hỏi và tình huống.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => <ContentItemCard key={item.id} item={item} onChanged={onChanged} />)}
        </div>
      )}
    </Card>
  );
}

export default function ContentLibrary() {
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [lessonId, setLessonId] = useState(null);

  useEffect(() => { getCourses().then((cs) => { setCourses(cs); if (cs.length) setCourseId(cs[0].id); }); }, []);

  async function loadBundle() {
    if (!courseId) return;
    const b = await getCourse(courseId);
    setBundle(b);
    if (!lessonId && b.lessons.length) setLessonId(b.lessons[0].id);
  }
  useEffect(() => { loadBundle(); }, [courseId]);

  if (!courses) return <Spinner />;
  if (courses.length === 0) return <EmptyState>Chưa có khóa học nào. Tạo khóa học ở mục "Khóa học" trước.</EmptyState>;

  const lesson = bundle?.lessons.find((l) => l.id === lessonId);
  const items = bundle?.contentItems.filter((c) => c.lessonId === lessonId) || [];

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle="Soạn và duyệt flashcard, câu hỏi, tình huống cho từng chặng học.">Thư viện nội dung</SectionTitle>

      <div className="flex gap-3 flex-wrap">
        <select value={courseId || ''} onChange={(e) => { setCourseId(Number(e.target.value)); setLessonId(null); }} className="px-3 py-2 rounded-lg border border-[#101A24]/15 text-sm font-bold">
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {!bundle ? <Spinner /> : bundle.lessons.length === 0 ? (
        <EmptyState>Khóa học này chưa có chặng học nào. Vào "Khóa học" → Course Architect để tạo giáo trình trước.</EmptyState>
      ) : (
        <div className="flex gap-6 flex-col md:flex-row">
          <div className="md:w-64 shrink-0 flex flex-col gap-2">
            {bundle.lessons.map((l) => (
              <button key={l.id} onClick={() => setLessonId(l.id)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold border ${lessonId === l.id ? 'bg-[#E3D9F5] border-[#101A24]/10' : 'bg-white border-[#101A24]/10 hover:bg-[#F5F6F8]'}`}
              >{l.title}</button>
            ))}
          </div>
          <div className="flex-1">
            {lesson && <LessonPanel lesson={lesson} items={items} onChanged={loadBundle} />}
          </div>
        </div>
      )}
    </div>
  );
}
