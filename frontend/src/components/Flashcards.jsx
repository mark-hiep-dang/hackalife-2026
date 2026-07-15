import { useState, useEffect } from 'react';
import { getFlashcards, getFlashcardTopics } from '../utils/api';
import { playPang, playChiu } from '../utils/sound';

const CARD_SHADOW = '0 8px 0 rgba(16,26,36,0.08), 0 14px 30px -10px rgba(16,26,36,0.12)';

const TOPIC_STYLES = [
  { bg: '#EFF6FF', shadow: '#BFDBFE', color: '#1D4ED8', subColor: '#60A5FA' },
  { bg: '#FFF7ED', shadow: '#FED7AA', color: '#C2410C', subColor: '#FB923C' },
  { bg: '#F0FDF4', shadow: '#BBF7D0', color: '#15803D', subColor: '#4ADE80' },
  { bg: '#FDF2F8', shadow: '#FBCFE8', color: '#BE185D', subColor: '#F472B6' },
  { bg: '#ECFEFF', shadow: '#A5F3FC', color: '#0E7490', subColor: '#22D3EE' },
  { bg: '#FEFCE8', shadow: '#FEF08A', color: '#A16207', subColor: '#FACC15' },
  { bg: '#F3E8FF', shadow: '#E9D5FF', color: '#7E22CE', subColor: '#C084FC' },
  { bg: '#FFF1EC', shadow: '#FFD3C7', color: '#C2410C', subColor: '#FDA98A' }
];

export default function Flashcards() {
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null); // null = deck menu, string = topic, '__random' = mixed

  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try { setTopics(await getFlashcardTopics()); }
      catch (e) { setTopicsError(e.message || 'Lỗi tải danh sách bộ thẻ'); }
      finally { setTopicsLoading(false); }
    })();
  }, []);

  async function openDeck(topic) {
    setSelectedTopic(topic);
    setLoading(true); setError(''); setIdx(0); setFlipped(false); setKnown(0); setUnknown(0); setDone(false);
    try { setCards(await getFlashcards(topic === '__random' ? undefined : topic)); }
    catch (e) { setError(e.message || 'Lỗi tải thẻ bài'); }
    finally { setLoading(false); }
  }

  function backToTopics() {
    setSelectedTopic(null); setCards([]); setIdx(0); setFlipped(false); setError('');
  }

  function restartDeck() {
    setIdx(0); setFlipped(false); setKnown(0); setUnknown(0); setDone(false);
  }

  const card = cards[idx];
  const flip = () => { setFlipped(f => !f); flipped ? playChiu() : playPang(); };

  function mark(isKnown) {
    isKnown ? setKnown(k => k + 1) : setUnknown(u => u + 1);
    setFlipped(false);
    setTimeout(() => {
      if (idx + 1 >= cards.length) setDone(true);
      else setIdx(p => p + 1);
    }, 150);
  }

  /* ── Topic picker ─── */
  if (!selectedTopic) {
    return (
      <div className="flex flex-col gap-2 pop-in max-w-3xl mx-auto w-full">
        <h2 className="font-comic font-extrabold text-xl text-[#101A24] uppercase tracking-wide flex items-center gap-2">
          <span>🗂️</span> Thẻ ghi nhớ
        </h2>
        <p className="text-sm font-bold text-[#8A8A8A] mb-4">Chọn một chủ đề để bắt đầu ôn nhé!</p>

        {topicsLoading && (
          <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">Đang tải bộ thẻ...</div>
        )}
        {topicsError && (
          <div className="py-6 text-center text-white bg-[#EF4444] rounded-2xl font-bold uppercase tracking-widest">{topicsError}</div>
        )}

        {!topicsLoading && !topicsError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => openDeck('__random')}
              className="border-none cursor-pointer text-left bg-[#101A24] rounded-[1.75rem] py-6 px-6 flex items-center gap-4 transition-transform hover:-translate-y-1"
              style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.35)' }}
            >
              <span className="text-4xl shrink-0">🔀</span>
              <div className="min-w-0">
                <div className="font-comic font-extrabold text-[17px] text-white">Ngẫu nhiên tổng hợp</div>
                <div className="text-xs font-bold text-[#9FE870] mt-0.5">20 thẻ trộn từ mọi chủ đề</div>
              </div>
            </button>

            {topics.map((topicRow, i) => {
              const st = TOPIC_STYLES[i % TOPIC_STYLES.length];
              return (
                <button
                  key={topicRow.topic}
                  onClick={() => openDeck(topicRow.topic)}
                  className="border-none cursor-pointer text-left rounded-[1.75rem] py-6 px-6 flex items-center gap-4 transition-transform hover:-translate-y-1"
                  style={{ background: st.bg, boxShadow: `0 6px 0 ${st.shadow}` }}
                >
                  <span className="text-4xl shrink-0">📖</span>
                  <div className="min-w-0">
                    <div className="font-comic font-extrabold text-[17px] truncate" style={{ color: st.color }}>{topicRow.topic}</div>
                    <div className="text-xs font-bold mt-0.5" style={{ color: st.subColor }}>{topicRow.count} thẻ</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Study screen ─── */
  return (
    <div className="flex flex-col gap-2 pop-in max-w-2xl mx-auto w-full">
      {loading && <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">Đang rút bài...</div>}
      {error && <div className="py-6 text-center text-white bg-[#EF4444] rounded-2xl font-bold uppercase tracking-widest">{error}</div>}

      {!loading && !error && !done && card && (
        <>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={backToTopics}
              className="border-none cursor-pointer bg-white rounded-2xl py-2 px-3.5 font-comic font-bold text-[13px] text-[#101A24]"
              style={{ boxShadow: '0 3px 0 rgba(16,26,36,0.1)' }}
            >
              ← Chủ đề
            </button>
            <h2 className="font-comic font-extrabold text-lg text-[#101A24] uppercase tracking-wide truncate">
              {selectedTopic === '__random' ? '🔀 Ngẫu nhiên tổng hợp' : `📖 ${selectedTopic}`}
            </h2>
          </div>
          <p className="text-sm font-bold text-[#8A8A8A] mb-4">Chạm vào thẻ để lật, rồi cho Llama biết bạn có nhớ không nhé!</p>

          {/* Progress */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 h-3.5 bg-white rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(16,26,36,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((idx + 1) / cards.length) * 100}%`, background: 'linear-gradient(90deg,#9FE870,#6BAE2E)' }} />
            </div>
            <span className="font-comic font-extrabold text-[13px] text-[#101A24] bg-white px-3.5 py-1.5 rounded-2xl shrink-0" style={{ boxShadow: '0 3px 0 rgba(16,26,36,0.1)' }}>
              {idx + 1}/{cards.length}
            </span>
          </div>

          {/* Flip card */}
          <div className="relative cursor-pointer select-none" style={{ perspective: '1400px', height: '340px' }} onClick={flip}>
            <span className="absolute -top-4 left-1.5 text-2xl z-0 wiggle">✨</span>
            <span className="absolute -bottom-6 right-0 text-5xl z-0" style={{ animation: 'bob 2.8s ease-in-out infinite' }}>🦙</span>

            <div
              className="relative w-full h-full transition-transform duration-500 ease-in-out"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
                style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg,#2563EB 0%,#4C7EF3 100%)',
                  boxShadow: '0 8px 0 #17408F, 0 14px 30px -10px rgba(16,26,36,0.25)'
                }}
              >
                {card.topic && (
                  <span className="inline-block bg-white/20 text-white font-comic font-bold text-[11px] uppercase tracking-wide px-3.5 py-1.5 rounded-2xl mb-5">
                    {card.topic}
                  </span>
                )}
                <div className="font-comic font-extrabold text-2xl text-white leading-snug">{card.front}</div>
                <div className="absolute bottom-5 text-xs font-bold text-white/85">👆 Chạm để xem đáp án</div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center overflow-y-auto"
                style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: '#fff',
                  boxShadow: CARD_SHADOW
                }}
              >
                <span className="text-3xl mb-3">💡</span>
                {card.keyword && (
                  <div className="font-comic font-extrabold text-base text-[#101A24] mb-2">{card.keyword}</div>
                )}
                <p className="text-[15px] font-bold text-[#5C5C5C] leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>

          {flipped ? (
            <div className="flex gap-3.5 mt-7">
              <button
                onClick={() => mark(false)}
                className="flex-1 border-none cursor-pointer bg-white rounded-[1.25rem] py-4 font-comic font-extrabold text-[15px] text-[#D9603F] transition-transform hover:-translate-y-0.5"
                style={{ border: '2px solid #FFD3C7', boxShadow: '0 4px 0 #FFD3C7' }}
              >
                😓 Chưa nhớ
              </button>
              <button
                onClick={() => mark(true)}
                className="flex-1 border-none cursor-pointer bg-[#9FE870] rounded-[1.25rem] py-4 font-comic font-extrabold text-[15px] text-[#101A24] transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: '0 4px 0 #6BAE2E' }}
              >
                ✅ Đã nhớ
              </button>
            </div>
          ) : (
            <div className="h-4 mt-7" />
          )}
        </>
      )}

      {!loading && !error && !card && !done && (
        <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">Chưa có thẻ nào.</div>
      )}

      {done && (
        <div className="relative bg-white rounded-[2rem] py-12 px-10 text-center max-w-md mx-auto mt-5 bounce-in" style={{ boxShadow: CARD_SHADOW }}>
          <div
            className="w-[100px] h-[100px] rounded-full bg-[#9FE870] flex items-center justify-center text-5xl mx-auto mb-5"
            style={{ boxShadow: '0 5px 0 #6BAE2E', animation: 'bob 2.4s ease-in-out infinite' }}
          >
            🦙
          </div>
          <div className="font-comic font-extrabold text-2xl text-[#101A24] uppercase mb-2">Xong bộ thẻ rồi! 🎉</div>
          <div className="text-sm font-bold text-[#8A8A8A] mb-6">Llama tự hào về bạn lắm đó!</div>
          <div className="flex gap-3.5 mb-7">
            <div className="flex-1 bg-[#EFFBEA] rounded-2xl py-4">
              <div className="font-comic font-extrabold text-2xl text-[#4B9A1E]">{known}</div>
              <div className="text-[11px] font-extrabold text-[#6BAE2E] uppercase">Đã nhớ</div>
            </div>
            <div className="flex-1 bg-[#FFF1EC] rounded-2xl py-4">
              <div className="font-comic font-extrabold text-2xl text-[#D9603F]">{unknown}</div>
              <div className="text-[11px] font-extrabold text-[#D9603F] uppercase">Chưa nhớ</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={backToTopics}
              className="flex-1 border-none cursor-pointer bg-[#F9FAFB] rounded-2xl py-4 font-comic font-bold text-sm text-[#101A24]"
              style={{ boxShadow: '0 4px 0 rgba(16,26,36,0.1)' }}
            >
              Chủ đề khác
            </button>
            <button
              onClick={restartDeck}
              className="flex-[2] border-none cursor-pointer bg-[#00B4D8] rounded-2xl py-4 font-comic font-extrabold text-[15px] text-[#101A24]"
              style={{ boxShadow: '0 4px 0 #0E7C99' }}
            >
              Ôn lại lần nữa 🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
