import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getQuizHistory, getQuizHistoryDetail } from '../utils/api';
import { useT, useLanguage } from '../translations';
import ExamReport from './ExamReport';

function formatDate(iso, lang) {
  const locale = lang === 'en' ? 'en-US' : 'vi-VN';
  const d = new Date(iso);
  return d.toLocaleDateString(locale) + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

// "Lịch sử thi thử": list of past exam attempts, each reopenable into the
// same full study report (ExamReport) shown right after finishing an exam.
export default function QuizHistory({ onBack, onStudyTopic }) {
  const t = useT();
  const { lang } = useLanguage();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    (async () => {
      try { setList(await getQuizHistory()); }
      catch (e) { setError(e.message || t.historyLoadError); }
      finally { setLoading(false); }
    })();
  }, []);

  async function openAttempt(id) {
    setSelectedId(id); setDetail(null); setDetailLoading(true); setDetailError('');
    try {
      const data = await getQuizHistoryDetail(id);
      const examAnswers = data.answers.map((a) => ({
        question: { question: a.question, topic: a.topic, options: a.options, correct_index: a.correct_index, explanation: a.explanation },
        selected: a.selected_index,
        isCorrect: a.isCorrect
      }));
      setDetail(examAnswers);
    } catch (e) { setDetailError(e.message || t.historyDetailLoadError); }
    finally { setDetailLoading(false); }
  }

  /* ── Detail: reopen a past attempt's full study report ─── */
  if (selectedId) {
    return (
      <div className="card-pro p-8 md:p-10 pop-in bg-white max-w-2xl mx-auto">
        <button onClick={() => setSelectedId(null)} className="btn-pro-secondary py-2.5 px-4 mb-6">
          <ArrowLeft size={18} strokeWidth={3} /> {t.historyBackBtn}
        </button>
        {detailLoading && <div className="text-center py-16 text-[#101A24] font-comic font-extrabold uppercase tracking-widest">{t.historyLoading}</div>}
        {detailError && <div className="text-[#B4443B] bg-[#F7D2CC] rounded-2xl px-4 py-3 font-bold">{detailError}</div>}
        {detail && <ExamReport examAnswers={detail} onStudyTopic={onStudyTopic} />}
      </div>
    );
  }

  /* ── List of past attempts ─── */
  return (
    <div className="card-pro p-8 md:p-10 pop-in bg-white text-left max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-pro-secondary py-2.5 px-4">
          <ArrowLeft size={18} strokeWidth={3} />
        </button>
        <h2 className="font-comic font-extrabold text-xl text-[#101A24] uppercase">{t.quizHistoryBtn}</h2>
      </div>

      {loading && <div className="text-center py-16 text-[#101A24] font-comic font-extrabold uppercase tracking-widest">{t.historyLoading}</div>}
      {error && <div className="text-[#B4443B] bg-[#F7D2CC] rounded-2xl px-4 py-3 font-bold">{error}</div>}
      {!loading && !error && list.length === 0 && (
        <div className="text-center py-16 text-[#8A8A8A] font-bold">{t.historyEmpty}</div>
      )}

      <div className="flex flex-col gap-3">
        {list.map((q) => {
          const pct = Math.round((q.score / q.total_questions) * 100);
          const passed = pct >= 70;
          return (
            <button
              key={q.id}
              onClick={() => openAttempt(q.id)}
              className="w-full flex items-center justify-between gap-3 text-left border-none cursor-pointer bg-[#EEF0F3] rounded-2xl py-4 px-5 transition-transform hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
            >
              <div className="min-w-0">
                <p className="font-comic font-extrabold text-sm text-[#101A24]">{formatDate(q.created_at, lang)}</p>
                <p className="text-xs font-bold text-[#8A8A8A] mt-0.5">{t.historyRow.replace('{score}', q.score).replace('{total}', q.total_questions).replace('{xp}', q.xp_earned)}</p>
              </div>
              <span className={`shrink-0 font-comic font-extrabold text-xs uppercase px-3 py-1.5 rounded-full ${passed ? 'bg-[#6B8AD6] text-white' : 'bg-[#D9695F] text-white'}`}>
                {pct}% {passed ? t.historyPassed : t.historyFailed}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
