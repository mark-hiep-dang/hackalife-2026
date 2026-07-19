import { useEffect, useState } from 'react';
import { getCourses, createCourse, getCourse, generateCourseCurriculum, runQualityCheck, getQuality, suggestQualityFix, ignoreQualityIssue } from '../../utils/studioApi';
import { Card, SectionTitle, Button, Spinner, EmptyState, SeverityBadge, Stat } from '../components/ui';
import StudioLlamaBubble from '../components/StudioLlamaBubble';
import { Plus, ArrowLeft, Mountain, Sparkles } from 'lucide-react';

const CAMP_COLORS = ['bg-[#C7EFC4]', 'bg-[#B9E7EF]', 'bg-[#E3D9F5]', 'bg-[#FBE3B0]', 'bg-[#F5C9DA]'];

function CreateCourseForm({ onCreated, onCancel }) {
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
      <SectionTitle>Tạo khóa học mới</SectionTitle>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('title', 'Tên khóa học')}
        {field('targetGroup', 'Đối tượng học viên')}
        {field('description', 'Mô tả')}
        {field('learningGoal', 'Mục tiêu học tập')}
        {field('durationWeeks', 'Số tuần', 'number')}
        {field('targetScore', 'Điểm mục tiêu', 'number')}
        {field('examDate', 'Ngày thi', 'date')}
        {field('preferredCamps', 'Số camp mong muốn', 'number')}
        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
        <div className="md:col-span-2 flex gap-3 mt-2">
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Tạo khóa học'}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        </div>
      </form>
    </Card>
  );
}

function MountainVisual({ camps, lessons }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[#101A24] font-extrabold"><Mountain size={20} /> Base Camp → Summit</div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {camps.map((camp, i) => (
          <div key={camp.id} className={`min-w-[220px] rounded-2xl border border-[#101A24]/10 p-4 ${CAMP_COLORS[i % CAMP_COLORS.length]}`}>
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#101A24]/70 mb-2">Camp {i + 1}</div>
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
          🏔️ Summit
        </div>
      </div>
    </div>
  );
}

function CourseDetail({ courseId, onBack }) {
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

  if (!bundle) return <Spinner />;
  const { course, camps, lessons } = bundle;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[#101A24]"><ArrowLeft size={16} /> Danh sách khóa học</button>
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#101A24]">{course.title}</h2>
            <p className="text-sm text-[#666]">{course.target_group} · {course.duration_weeks} tuần · Mục tiêu {course.target_score} điểm</p>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#EEF0F3]">{course.status}</span>
        </div>
      </Card>

      {reaction && <StudioLlamaBubble event={reaction.event} context={reaction.context} />}

      <div className="flex gap-2">
        <Button variant={tab === 'architect' ? 'primary' : 'secondary'} onClick={() => setTab('architect')}>Course Architect</Button>
        <Button variant={tab === 'quality' ? 'primary' : 'secondary'} onClick={() => setTab('quality')}>Course Quality</Button>
      </div>

      {tab === 'architect' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle subtitle="Llama đề xuất giáo trình dựa trên tài liệu đã duyệt. Mọi nội dung đều là bản nháp cho tới khi bạn duyệt.">Lộ trình khóa học</SectionTitle>
            <Button onClick={handleGenerate} disabled={busy} className="flex items-center gap-2">
              <Sparkles size={16} /> {camps.length ? 'Tạo lại giáo trình' : 'Tạo giáo trình bằng AI'}
            </Button>
          </div>
          {camps.length === 0 ? <EmptyState>Chưa có lộ trình. Bấm "Tạo giáo trình bằng AI" để bắt đầu.</EmptyState> : <MountainVisual camps={camps} lessons={lessons} />}
        </Card>
      )}

      {tab === 'quality' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Course Quality Check</SectionTitle>
            <Button onClick={handleQualityCheck} disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Chạy kiểm tra'}</Button>
          </div>
          {quality ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Health Score" value={`${quality.healthScore}/100`} />
                <Stat label="Có thể publish" value={quality.canPublish ? 'Có' : 'Chưa'} />
              </div>
              <div className="flex flex-col gap-2">
                {quality.issues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onChanged={handleQualityCheck} />
                ))}
                {quality.issues.length === 0 && <EmptyState>Không còn vấn đề nào — giáo án sạch!</EmptyState>}
              </div>
            </div>
          ) : <EmptyState>Chưa chạy kiểm tra lần nào.</EmptyState>}
        </Card>
      )}
    </div>
  );
}

function IssueRow({ issue, onChanged }) {
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
          <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={handleSuggest} disabled={loading}>Gợi ý sửa</Button>
          <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={handleIgnore}>Bỏ qua</Button>
        </div>
      </div>
      <p className="text-sm text-[#101A24]">{issue.message}</p>
      {fix && <p className="text-sm bg-[#F5F6F8] rounded-lg p-2 text-[#101A24]"><strong>Gợi ý:</strong> {fix.suggestion}</p>}
    </div>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);

  function refresh() { getCourses().then(setCourses); }
  useEffect(() => { refresh(); }, []);

  if (view === 'create') return <CreateCourseForm onCreated={(id) => { setSelected(id); setView('detail'); refresh(); }} onCancel={() => setView('list')} />;
  if (view === 'detail' && selected) return <CourseDetail courseId={selected} onBack={() => { setView('list'); refresh(); }} />;

  if (!courses) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle subtitle="Quản lý giáo trình và kiểm tra chất lượng khóa học.">Khóa học</SectionTitle>
        <Button onClick={() => setView('create')} className="flex items-center gap-2"><Plus size={16} /> Khóa học mới</Button>
      </div>
      {courses.length === 0 ? (
        <EmptyState>Chưa có khóa học nào. Tạo khóa học đầu tiên để bắt đầu dựng đường.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" >
              <button onClick={() => { setSelected(c.id); setView('detail'); }} className="text-left w-full">
                <h3 className="font-extrabold text-[#101A24]">{c.title}</h3>
                <p className="text-sm text-[#666] mt-1">{c.target_group}</p>
                <div className="flex items-center gap-3 mt-3 text-xs font-bold text-[#888]">
                  <span className="px-2 py-1 rounded bg-[#EEF0F3]">{c.status}</span>
                  <span>Health {c.health_score ?? '—'}/100</span>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
