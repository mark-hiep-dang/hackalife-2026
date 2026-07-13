import { useState, useEffect } from 'react';
import { getFlashcards } from '../utils/api';
import { translations as t } from '../translations';
import { playPang, playChiu } from '../utils/sound';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    (async () => {
      try { setCards(await getFlashcards()); }
      catch (e) { setError(e.message || 'Lỗi tải thẻ bài'); }
      finally { setLoading(false); }
    })();
  }, []);

  const card = cards[idx];
  const flip  = () => { setFlipped(f => !f); flipped ? playChiu() : playPang(); };
  const next  = () => { setFlipped(false); setTimeout(() => setIdx(p => Math.min(p + 1, cards.length - 1)), 150); };
  const prev  = () => { setFlipped(false); setTimeout(() => setIdx(p => Math.max(p - 1, 0)), 150); };

  if (loading) return <div className="text-center py-16 text-[#101A24] text-lg font-extrabold uppercase tracking-widest">Đang rút bài...</div>;
  if (error)   return <div className="text-center py-16 text-white bg-[#EF4444] border border-[#101A24]/10 font-extrabold uppercase tracking-widest mx-4 rounded-2xl shadow-sm">{error}</div>;
  if (!card)   return <div className="text-center py-16 text-[#101A24] font-extrabold uppercase tracking-widest">{t.emptyState}</div>;

  const pct = ((idx + 1) / cards.length) * 100;

  return (
    <div className="flex flex-col gap-8 pop-in max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-[#101A24] uppercase tracking-tighter">
          {t.flashcardTitle}
        </h2>
        <span className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] bg-white border border-[#101A24]/10 px-4 py-2 rounded-2xl shadow-sm">
          {idx + 1} / {cards.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-4 bg-white border border-[#101A24]/10 rounded-full overflow-hidden shadow-inner">
        <div className="transition-all duration-300 rounded-full h-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
      </div>

      {/* 3D Card */}
      <div
        className="cursor-pointer select-none mt-4"
        style={{ perspective: '2000px', height: '450px' }}
        onClick={flip}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 ease-in-out"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white border border-[#101A24]/10 rounded-3xl shadow-sm flex flex-col items-center justify-center p-10 text-center"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {card.topic && (
              <span className="absolute top-6 left-6 text-[10px] font-extrabold uppercase tracking-widest text-[#101A24] bg-[#00B4D8] px-4 py-2 rounded-2xl border border-[#101A24]/10 shadow-sm -rotate-3">
                {card.topic}
              </span>
            )}
            <h3 className="text-3xl md:text-5xl font-extrabold text-[#101A24] leading-tight mt-6">{card.front}</h3>
            <div className="absolute bottom-8 flex flex-col items-center gap-3 text-[#101A24]">
              <div className="w-10 h-10 rounded-full bg-[#101A24] text-white flex items-center justify-center border border-[#101A24]/10">
                <RotateCcw size={20} strokeWidth={3} />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest">{t.flipBtn}</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-[#9FE870] border border-[#101A24]/10 rounded-3xl shadow-sm flex flex-col p-10 overflow-y-auto custom-scrollbar"
            style={{
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="bg-white border border-[#101A24]/10 rounded-2xl p-5 mb-8 text-base font-extrabold text-[#101A24] shadow-sm -rotate-1">
              <span className="block uppercase tracking-widest text-[#EF4444] mb-2 text-xs">Từ khóa / Đáp án:</span>
              <span className="text-xl">{card.keyword}</span>
            </div>
            
            <div className="bg-[#101A24] text-white border border-[#101A24]/10 rounded-2xl p-6 shadow-sm flex-1">
              <strong className="block text-white text-xs font-extrabold uppercase tracking-widest mb-4 underline decoration-3 decoration-[#9FE870] underline-offset-4">Nội dung chi tiết</strong>
              <p className="text-base font-bold leading-relaxed">
                {card.back}
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-2 text-[#101A24] mt-8">
              <div className="w-10 h-10 rounded-full bg-[#101A24] text-white flex items-center justify-center">
                <RotateCcw size={20} strokeWidth={3} />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest">{t.flipBtn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-6 mt-8">
        <button onClick={prev} disabled={idx === 0} className="btn-pro-secondary flex-1 py-5 text-xl">
          <ArrowLeft size={24} strokeWidth={3} /> {t.prevBtn}
        </button>
        <button onClick={next} disabled={idx === cards.length - 1} className="btn-pro-primary flex-[2] py-5 text-xl bg-[#2563EB] text-white">
          {t.nextBtn} <ArrowRight size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
