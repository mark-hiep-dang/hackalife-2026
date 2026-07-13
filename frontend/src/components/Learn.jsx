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
          <span className="text-xs font-black text-[#111] uppercase tracking-widest bg-[#FFC900] border-2 border-[#111] px-3 py-1 rounded shadow-[2px_2px_0_#111] -rotate-2">
            {t.learnTitle}
          </span>
          <span className="text-sm font-black text-[#111] uppercase tracking-widest bg-white border-2 border-[#111] px-4 py-1.5 rounded shadow-[2px_2px_0_#111]">
            {isDone ? t.lessonCompleted : `${cidx + 1} / ${cards.length}`}
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#111] uppercase tracking-tighter leading-none">{lesson.title_vn}</h2>
      </div>

      {/* Progress */}
      <div className="h-4 bg-white border-3 border-[#111] rounded-full overflow-hidden shadow-inner">
        <div className="progress-bar-brutal h-full bg-[#23A094]" style={{ width: `${pct}%` }} />
      </div>

      {isDone ? (
        <div className="card-brutal p-8 md:p-12 text-center bg-white pop-in">
          <CheckCircle2 size={80} strokeWidth={3} className="text-[#23A094] mx-auto mb-6" />
          <h3 className="text-4xl font-black uppercase tracking-tighter text-[#111] mb-4">{t.lessonCompleted}</h3>
          <p className="text-lg font-bold text-[#888] mb-10">Kinh nghiệm là tài sản lớn nhất của bạn.</p>
          <button onClick={handleFinish} disabled={submitting} className="btn-brutal bg-[#FFC900] w-full text-2xl py-6">
            {submitting ? '...' : t.lessonFinishBtn}
          </button>
        </div>
      ) : (
        <div className="card-brutal p-8 md:p-12 pop-in bg-white">
          <h3 className="text-3xl font-black text-[#111] uppercase tracking-tight mb-8">
            {cards[cidx].title_vn}
          </h3>
          
          <div className="text-lg md:text-xl text-[#111] font-bold leading-relaxed mb-10">
            {cards[cidx].content_vn}
          </div>
          
          <div className="bg-[#111] border-3 border-[#111] rounded-2xl p-6 text-white shadow-[6px_6px_0_#FF90E8] -rotate-1 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} strokeWidth={3} className="text-[#FFC900]" />
              <strong className="text-xs font-black uppercase tracking-widest text-[#FFC900]">{t.tipLabel}</strong>
            </div>
            <p className="text-base font-bold leading-relaxed">{cards[cidx].tip_vn}</p>
          </div>

          <button onClick={() => { setCidx(p => p + 1); playPang(); }} className="btn-brutal bg-[#23A094] text-white w-full text-xl py-5">
            Đã hiểu <ArrowRight size={24} strokeWidth={3} className="inline ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}
