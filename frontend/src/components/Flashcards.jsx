import { useState, useEffect, useMemo } from 'react';
import { getFlashcards, getFlashcardTopics, markFlashcardProgress } from '../utils/api';
import { playPang, playChiu } from '../utils/sound';
import { pickFlashcardTip } from '../llamaResponses';
import { useT, useLanguage } from '../translations';
import llamaTipIcon from '../assets/llama-mood-cozy.webp';
import { ArrowLeft } from 'lucide-react';

const CARD_SHADOW = '0 4px 20px rgba(0,0,0,0.06)';

const TOPIC_STYLES = [
  { bg: '#EFF6FF', color: '#4C6FC4', subColor: '#7C9AE0' },
  { bg: '#FFF3E9', color: '#C2703F', subColor: '#E0A374' },
  { bg: '#EEF9EE', color: '#4F9A5A', subColor: '#82C489' },
  { bg: '#FCEEF5', color: '#B5548A', subColor: '#DD8FB8' },
  { bg: '#EAF7FA', color: '#3B93A8', subColor: '#72BDCE' },
  { bg: '#FCF6E3', color: '#B8912E', subColor: '#DBC073' },
  { bg: '#F4EDFA', color: '#8A6FC9', subColor: '#B7A2E0' },
  { bg: '#FBEAE6', color: '#C46A4F', subColor: '#E0977E' }
];

export default function Flashcards({ initialTopic, onConsumeInitialTopic, onBack }) {
  const t = useT();
  const { lang } = useLanguage();
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

  async function loadTopics() {
    try { setTopics(await getFlashcardTopics()); }
    catch (e) { setTopicsError(e.message || t.fcTopicsLoadError); }
    finally { setTopicsLoading(false); }
  }

  useEffect(() => { loadTopics(); }, []);

  // Deep-link: jump straight into a specific deck (e.g. from the exam report's roadmap)
  useEffect(() => {
    if (initialTopic) {
      openDeck(initialTopic);
      onConsumeInitialTopic?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  async function openDeck(topic) {
    setSelectedTopic(topic);
    setLoading(true); setError(''); setIdx(0); setFlipped(false); setKnown(0); setUnknown(0); setDone(false);
    try { setCards(await getFlashcards(topic === '__random' ? undefined : topic)); }
    catch (e) { setError(e.message || t.fcCardsLoadError); }
    finally { setLoading(false); }
  }

  function backToTopics() {
    setSelectedTopic(null); setCards([]); setIdx(0); setFlipped(false); setError('');
    loadTopics();
  }

  function restartDeck() {
    setIdx(0); setFlipped(false); setKnown(0); setUnknown(0); setDone(false);
  }

  const card = cards[idx];
  const flip = () => { setFlipped(f => !f); flipped ? playChiu() : playPang(); };
  const tip = useMemo(() => (card ? pickFlashcardTip({ term: card.keyword || card.front, lang }) : ''), [idx, cards, lang]);

  function mark(isKnown) {
    isKnown ? setKnown(k => k + 1) : setUnknown(u => u + 1);
    if (card) markFlashcardProgress(card.id, isKnown).catch(() => {});
    setFlipped(false);
    setTimeout(() => {
      if (idx + 1 >= cards.length) setDone(true);
      else setIdx(p => p + 1);
    }, 150);
  }

  /* ── Topic picker ─── */
  if (!selectedTopic) {
    const totalCount = topics.reduce((s, tr) => s + tr.count, 0);
    const totalKnown = topics.reduce((s, tr) => s + (tr.known_count || 0), 0);
    return (
      <div className="flex flex-col gap-2 pop-in max-w-3xl mx-auto w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="self-start flex items-center gap-1.5 border-none cursor-pointer bg-white rounded-2xl py-2 px-3.5 mb-2 font-comic font-bold text-[13px] text-[#101A24] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
          >
            <ArrowLeft size={16} strokeWidth={3} /> {t.navHome}
          </button>
        )}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-comic font-extrabold text-xl text-[#101A24] uppercase tracking-wide flex items-center gap-2">
            <span>🗂️</span> {t.fcDeckTitle}
          </h2>
          {!topicsLoading && totalCount > 0 && totalCount - totalKnown > 0 && (
            <span className="text-xs font-extrabold text-[#8A6D1F] bg-[#FCF6E3] px-3 py-1.5 rounded-full">
              {t.fcDueLabel.replace('{n}', totalCount - totalKnown)}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-[#8A8A8A] mb-4">{t.fcChooseTopic}</p>

        {topicsLoading && (
          <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">{t.fcLoadingDecks}</div>
        )}
        {topicsError && (
          <div className="py-6 text-center text-[#B4443B] bg-[#F7D2CC] rounded-2xl font-bold uppercase tracking-widest">{topicsError}</div>
        )}

        {!topicsLoading && !topicsError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => openDeck('__random')}
              className="border-none cursor-pointer text-left rounded-[1.75rem] py-6 px-6 flex items-center gap-4 transition-transform hover:-translate-y-1 shadow-[0_6px_20px_rgba(138,111,201,0.22)]"
              style={{ background: 'linear-gradient(135deg, #E3D9F5 0%, #FCE7A8 100%)' }}
            >
              <span className="text-4xl shrink-0">🔀</span>
              <div className="min-w-0 flex-1">
                <div className="font-comic font-extrabold text-[17px] text-[#101A24]">{t.fcRandomMix}</div>
                <div className="text-xs font-bold text-[#8A6D1F] mt-0.5">{t.fcCardsStudied.replace('{known}', totalKnown).replace('{total}', totalCount)}</div>
                <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-[#8A6D1F]" style={{ width: `${totalCount ? (totalKnown / totalCount) * 100 : 0}%` }} />
                </div>
              </div>
            </button>

            {topics.map((topicRow, i) => {
              const st = TOPIC_STYLES[i % TOPIC_STYLES.length];
              const known = topicRow.known_count || 0;
              return (
                <button
                  key={topicRow.topic}
                  onClick={() => openDeck(topicRow.topic)}
                  className="border-none cursor-pointer text-left rounded-[1.75rem] py-6 px-6 flex items-center gap-4 transition-transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                  style={{ background: st.bg }}
                >
                  <span className="text-4xl shrink-0">📖</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-comic font-extrabold text-[17px] truncate" style={{ color: st.color }}>{topicRow.topic}</div>
                    <div className="text-xs font-bold mt-0.5" style={{ color: st.subColor }}>{t.fcCardsStudied.replace('{known}', known).replace('{total}', topicRow.count)}</div>
                    <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full rounded-full" style={{ width: `${topicRow.count ? (known / topicRow.count) * 100 : 0}%`, background: st.color }} />
                    </div>
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
      {loading && <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">{t.fcDrawingCards}</div>}
      {error && <div className="py-6 text-center text-[#B4443B] bg-[#F7D2CC] rounded-2xl font-bold uppercase tracking-widest">{error}</div>}

      {!loading && !error && !done && card && (
        <>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={backToTopics}
              className="border-none cursor-pointer bg-white rounded-2xl py-2 px-3.5 font-comic font-bold text-[13px] text-[#101A24] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
            >
              {t.fcBackToTopics}
            </button>
            <h2 className="font-comic font-extrabold text-lg text-[#101A24] uppercase tracking-wide truncate">
              {selectedTopic === '__random' ? `🔀 ${t.fcRandomMix}` : `📖 ${selectedTopic}`}
            </h2>
          </div>
          <p className="text-sm font-bold text-[#8A8A8A] mb-4">{t.fcTapHint}</p>

          {/* Progress */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 h-3.5 bg-white rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((idx + 1) / cards.length) * 100}%`, background: 'linear-gradient(90deg,#C7EFC4,#9BDDA0)' }} />
            </div>
            <span className="font-comic font-extrabold text-[13px] text-[#101A24] bg-white px-3.5 py-1.5 rounded-2xl shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
              {idx + 1}/{cards.length}
            </span>
          </div>

          {/* Flip card */}
          <div className="relative cursor-pointer select-none" style={{ perspective: '1400px', height: '340px' }} onClick={flip}>
            <span className="absolute -top-4 left-1.5 text-2xl z-0 wiggle">✨</span>

            <div
              className="relative w-full h-full transition-transform duration-500 ease-in-out"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
                style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg,#8CA6E8 0%,#A9C0F0 100%)',
                  boxShadow: '0 10px 28px rgba(76,111,196,0.25)'
                }}
              >
                {card.topic && (
                  <span className="inline-block bg-white/20 text-white font-comic font-bold text-[11px] uppercase tracking-wide px-3.5 py-1.5 rounded-2xl mb-5">
                    {card.topic}
                  </span>
                )}
                <div className="font-comic font-extrabold text-2xl text-white leading-snug">{card.front}</div>
                <div className="absolute bottom-5 text-xs font-bold text-white/85">{t.fcTapToFlip}</div>
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

          {flipped && tip && (
            <div className="flex items-start gap-2.5 bg-[#FCEFD0] rounded-2xl px-4 py-3 mt-4 text-left bounce-in">
              <img src={llamaTipIcon} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              <p className="text-xs font-bold text-[#8A6D1F] leading-relaxed">{tip}</p>
            </div>
          )}

          {flipped ? (
            <div className="flex gap-3.5 mt-7">
              <button
                onClick={() => mark(false)}
                className="flex-1 border-none cursor-pointer bg-white rounded-[1.25rem] py-4 font-comic font-extrabold text-[15px] text-[#C46A4F] transition-transform hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                style={{ border: '2px solid #F7D2CC' }}
              >
                {t.fcNotKnownBtn}
              </button>
              <button
                onClick={() => mark(true)}
                className="flex-1 border-none cursor-pointer bg-[#C7EFC4] rounded-[1.25rem] py-4 font-comic font-extrabold text-[15px] text-[#2F5C37] transition-transform hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(79,154,90,0.2)]"
              >
                {t.fcKnownBtn}
              </button>
            </div>
          ) : (
            <div className="h-4 mt-7" />
          )}
        </>
      )}

      {!loading && !error && !card && !done && (
        <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">{t.emptyState}</div>
      )}

      {done && (
        <div className="relative bg-white rounded-[2rem] py-12 px-10 text-center max-w-md mx-auto mt-5 bounce-in" style={{ boxShadow: CARD_SHADOW }}>
          <div
            className="w-[100px] h-[100px] rounded-full bg-[#C7EFC4] flex items-center justify-center text-5xl mx-auto mb-5 shadow-[0_6px_18px_rgba(79,154,90,0.2)]"
            style={{ animation: 'bob 2.4s ease-in-out infinite' }}
          >
            🦙
          </div>
          <div className="font-comic font-extrabold text-2xl text-[#101A24] uppercase mb-2">{t.fcDeckDone}</div>
          <div className="text-sm font-bold text-[#8A8A8A] mb-6">{t.fcProudMessage}</div>
          <div className="flex gap-3.5 mb-7">
            <div className="flex-1 bg-[#EEF9EE] rounded-2xl py-4">
              <div className="font-comic font-extrabold text-2xl text-[#4F9A5A]">{known}</div>
              <div className="text-[11px] font-extrabold text-[#4F9A5A] uppercase">{t.fcKnownLabel}</div>
            </div>
            <div className="flex-1 bg-[#FBEAE6] rounded-2xl py-4">
              <div className="font-comic font-extrabold text-2xl text-[#C46A4F]">{unknown}</div>
              <div className="text-[11px] font-extrabold text-[#C46A4F] uppercase">{t.fcNotKnownLabel}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={backToTopics}
              className="flex-1 border-none cursor-pointer bg-[#EEF0F3] rounded-2xl py-4 font-comic font-bold text-sm text-[#101A24] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
            >
              {t.fcAnotherTopicBtn}
            </button>
            <button
              onClick={restartDeck}
              className="flex-[2] border-none cursor-pointer bg-[#B9E7EF] rounded-2xl py-4 font-comic font-extrabold text-[15px] text-[#20606E] shadow-[0_4px_14px_rgba(59,147,168,0.2)]"
            >
              {t.fcRestartBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
