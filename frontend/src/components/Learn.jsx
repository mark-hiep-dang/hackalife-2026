import { useState } from 'react';
import { completeLesson } from '../utils/api';
import { translations as t } from '../translations';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { playPang } from '../utils/sound';

export default function Learn({ lesson, onLessonFinished }) {
  const [cidx, setCidx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  if (!lesson) return null;
  const cards = lesson.cards;
  const isDone = cidx >= cards.length;

  async function handleFinish() {
    setSubmitting(true);
    try {
      const res = await completeLesson(lesson.id);
      playPang();
      onLessonFinished(res.xp_earned);
    } catch (e) {
      console.error(e);
      onLessonFinished(null);
    } finally {
      setSubmitting(false);
    }
  }

  const pct = isDone ? 100 : (cidx / cards.length) * 100;

  return (
    <div className="flex flex-col gap-8 pop-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest bg-[#B9E7EF] border border-[#101A24]/10 px-3 py-1 rounded shadow-sm -rotate-2">
            {t.learnTitle}
          </span>
          <span className="text-sm font-extrabold text-[#101A24] uppercase tracking-widest bg-white border border-[#101A24]/10 px-4 py-1.5 rounded shadow-sm">
            {isDone ? t.lessonCompleted : `${cidx + 1} / ${cards.length}`}
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#101A24] uppercase tracking-tighter leading-none">{lesson.title_vn}</h2>
      </div>

      {/* Progress */}
      <div className="h-4 bg-white border border-[#101A24]/10 rounded-full overflow-hidden shadow-inner">
        <div className="transition-all duration-300 rounded-full h-full bg-[#8CA6E8]" style={{ width: `${pct}%` }} />
      </div>

      {isDone ? (
        <div className="card-pro p-8 md:p-12 text-center bg-white pop-in">
          <CheckCircle2 size={80} strokeWidth={3} className="text-[#4C6FC4] mx-auto mb-6" />
          <h3 className="text-4xl font-extrabold uppercase tracking-tighter text-[#101A24] mb-4">{t.lessonCompleted}</h3>
          <p className="text-lg font-bold text-[#888] mb-10">Kinh nghiệm là tài sản lớn nhất của bạn.</p>
          <button onClick={handleFinish} disabled={submitting} className="btn-pro bg-[#B9E7EF] text-[#20606E] hover:bg-[#A8DEE8] w-full text-2xl py-6">
            {submitting ? '...' : t.lessonFinishBtn}
          </button>
        </div>
      ) : (
        <div className="card-pro p-8 md:p-12 pop-in bg-white">
          <h3 className="text-3xl font-extrabold text-[#101A24] uppercase tracking-tight mb-8">
            {cards[cidx].title_vn}
          </h3>
          
          <div className="text-lg md:text-xl text-[#101A24] font-bold leading-relaxed mb-10">
            {cards[cidx].content_vn}
          </div>
          
          <div className="bg-[#E3D9F5] border border-[#101A24]/10 rounded-2xl p-6 text-[#101A24] shadow-sm -rotate-1 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} strokeWidth={3} className="text-[#6B4FA8]" />
              <strong className="text-xs font-extrabold uppercase tracking-widest text-[#6B4FA8]">{t.tipLabel}</strong>
            </div>
            <p className="text-base font-bold leading-relaxed">{cards[cidx].tip_vn}</p>
          </div>

          <button onClick={() => { setCidx(p => p + 1); playPang(); }} className="btn-pro bg-[#4C6FC4] hover:bg-[#3D5DAE] text-white w-full text-xl py-5">
            Đã hiểu <ArrowRight size={24} strokeWidth={3} className="inline ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}
