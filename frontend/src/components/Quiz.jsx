import { useState, useEffect, useRef } from 'react';
import { generateQuiz, submitQuizScore } from '../utils/api';
import { translations as t } from '../translations';
import { playPang, playChiu } from '../utils/sound';
import { Target, Flame, Zap, Medal, Crown, Crosshair, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const BADGE_ICONS = { first_lesson: Crosshair, streak_3: Target, streak_7: Flame, pang_sniper: Zap, topic_master: Medal, xp_1000: Crown };

export default function Quiz({ onQuizFinished }) {
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [mode, setMode] = useState('practice');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [cidx, setCidx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2400);
  const timerRef = useRef(null);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [examAnswers, setExamAnswers] = useState([]);

  useEffect(() => {
    if (started && mode === 'exam' && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); finishQuiz(true); return 0; } return p - 1; });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started, finished, mode]);

  const q = questions[cidx];

  async function startQuiz() {
    setLoading(true); setError('');
    try {
      const qs = await generateQuiz(topic, difficulty, mode);
      if (qs.length === 0) throw new Error("Không có câu hỏi nào cho chủ đề này.");
      setQuestions(qs); setCidx(0); setScore(0); setCombo(0); setMaxCombo(0);
      setSelected(null); setAnswered(false); setTimeLeft(2400);
      setExamAnswers([]); setStarted(true); setFinished(false);
    } catch (e) { setError(e.message || 'Lỗi tải đề thi'); }
    finally { setLoading(false); }
  }

  function pick(optIdx, e) {
    if (answered) return;
    setSelected(optIdx); setAnswered(true);
    
    const correct = optIdx === q.correct_index;
    
    if (correct) {
      playPang(); setScore(p => p + 1);
      const nc = combo + 1; setCombo(nc); if (nc > maxCombo) setMaxCombo(nc);
      window.dispatchEvent(new CustomEvent('pang-chiu-effect', { detail: { type: 'pang', x: e.clientX, y: e.clientY } }));
    } else {
      playChiu(); setCombo(0);
      window.dispatchEvent(new CustomEvent('pang-chiu-effect', { detail: { type: 'chiu', x: e.clientX, y: e.clientY } }));
    }
    if (mode === 'exam') {
      setExamAnswers(p => [...p, { question: q, selected: optIdx, isCorrect: correct }]);
      setTimeout(advance, 600);
    }
  }

  function advance() {
    setSelected(null); setAnswered(false);
    if (cidx < questions.length - 1) setCidx(p => p + 1);
    else finishQuiz(false);
  }

  async function finishQuiz(timeout = false) {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true); setFinished(true);
    const fs = mode === 'exam' ? examAnswers.filter(a => a.isCorrect).length : score;
    try {
      const r = await submitQuizScore({ score: fs, totalQuestions: questions.length, topic: mode === 'exam' ? 'full_exam' : topic, type: mode, maxCombo });
      setXpEarned(r.xp_earned); setNewBadges(r.newBadges || []); playPang();
    } catch (e) { setError(e.message || 'Lỗi lưu kết quả'); }
    finally { setSubmitting(false); }
  }

  function fmt(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; }

  const isCorrect = answered && selected === q?.correct_index;

  /* ── Setup ─── */
  if (!started && !finished) return (
    <div className="card-pro p-8 md:p-10 pop-in bg-white">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-[#9FE870] border border-[#101A24]/10 rounded-2xl flex items-center justify-center shadow-sm -rotate-6">
          <Target size={40} strokeWidth={3} className="text-[#101A24]" />
        </div>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-extrabold text-[#101A24] uppercase tracking-tighter text-center mb-8">{t.quizTitle}</h2>

      <div className="flex flex-col gap-8">
        {/* Mode */}
        <div>
          <label className="block text-sm font-extrabold text-[#101A24] uppercase tracking-widest mb-3">Chế độ chiến</label>
          <div className="flex flex-col sm:flex-row gap-4">
            {[['practice', t.practiceMode], ['exam', t.examMode]].map(([v,label]) => (
              <button key={v} onClick={() => setMode(v)} disabled={loading}
                className={`flex-1 py-4 px-6 rounded-2xl border font-extrabold uppercase tracking-widest transition-all ${mode === v ? 'bg-[#9FE870] border-[#101A24]/10 text-[#101A24] shadow-sm -translate-y-1 -translate-x-1' : 'bg-white border-[#101A24]/10 text-[#101A24] shadow-sm hover:-translate-y-0.5 hover:-translate-x-0.5'}`}
              >{label}</button>
            ))}
          </div>
        </div>

        {error && <div className="text-white text-sm font-extrabold uppercase tracking-widest bg-[#EF4444] border border-[#101A24]/10 shadow-sm px-4 py-3 rounded-lg">{error}</div>}

        <button onClick={startQuiz} disabled={loading} className="btn-pro-primary w-full text-xl mt-4 bg-[#00B4D8] py-4">
          {loading ? 'Đang chuẩn bị đạn...' : t.startQuizBtn}
        </button>
      </div>
    </div>
  );

  /* ── Results ─── */
  if (finished) {
    const fs = mode === 'exam' ? examAnswers.filter(a => a.isCorrect).length : score;
    const pct = Math.round((fs / questions.length) * 100);

    return (
      <div className="card-pro p-8 md:p-10 pop-in bg-white text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold text-[#101A24] uppercase tracking-tighter mb-4">{t.quizCompleted}</h2>
        <p className="text-lg font-extrabold uppercase tracking-widest text-[#888] mb-8">{mode === 'exam' ? t.examMode : t.practiceMode}</p>

        <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border border-[#101A24]/10 bg-[#9FE870] shadow-sm mb-10 -rotate-2">
          <span className="text-5xl font-extrabold text-[#101A24]">{pct}%</span>
          <span className="text-sm font-extrabold text-[#101A24] uppercase tracking-widest bg-white border border-[#101A24]/10 px-2 py-0.5 rounded shadow-sm mt-2 -rotate-3">{fs}/{questions.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-[#101A24]/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#101A24] mb-1">{t.xpEarned}</p>
            <p className="text-4xl font-extrabold text-[#9FE870]">+{xpEarned}</p>
          </div>
          <div className="bg-white border border-[#101A24]/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#101A24] mb-1">{t.comboBonus}</p>
            <p className="text-4xl font-extrabold text-[#00B4D8]">{maxCombo > 1 ? `${(1 + Math.min((maxCombo-1)*0.05,0.25)).toFixed(2)}x` : '1.0x'}</p>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="bg-[#00B4D8] border border-[#101A24]/10 rounded-2xl p-6 shadow-sm text-left mb-10">
            <p className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] mb-4">🏅 Huy hiệu mới</p>
            <div className="flex flex-col gap-3">
              {newBadges.map(bid => {
                const Icon = BADGE_ICONS[bid] || Zap;
                return <div key={bid} className="flex items-center gap-3 text-sm font-extrabold text-[#101A24] uppercase bg-white border border-[#101A24]/10 px-3 py-2 rounded shadow-sm"><Icon size={20} strokeWidth={3} className="text-[#9FE870]" /> {t[`badge_${bid}`] || bid}</div>;
              })}
            </div>
          </div>
        )}

        {mode === 'exam' && examAnswers.length > 0 && (
          <div className="text-left mb-10">
            <p className="text-xl font-extrabold uppercase tracking-widest text-[#101A24] mb-4">Xem lại bài thi</p>
            <div className="flex flex-col gap-4">
              {examAnswers.map((a, i) => (
                <div key={i} className={`p-6 rounded-2xl border border-[#101A24]/10 shadow-sm ${a.isCorrect ? 'bg-[#2563EB]' : 'bg-[#EF4444]'}`}>
                  <div className="flex items-start gap-4 text-white">
                    {a.isCorrect ? <CheckCircle2 size={28} strokeWidth={3} className="shrink-0 mt-0.5" /> : <XCircle size={28} strokeWidth={3} className="shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold text-lg leading-snug mb-3">{a.question.question}</p>
                      {!a.isCorrect && <p className="text-white text-sm font-extrabold uppercase tracking-widest bg-[#101A24] inline-block px-3 py-1.5 rounded shadow-sm">✓ {a.question.options[a.question.correct_index]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => onQuizFinished()} className="btn-pro-primary w-full text-xl bg-[#2563EB] text-white py-4">
          {t.backToDashboard}
        </button>
      </div>
    );
  }

  /* ── In Progress ─── */
  if (!q) return null;
  const opts = q.options;

  return (
    <div className="flex flex-col gap-6 pop-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === 'exam' ? (
            <span className={`flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest px-4 py-2 rounded-2xl border shadow-sm ${timeLeft < 300 ? 'bg-[#EF4444] border-[#101A24]/10 text-white animate-pulse' : 'bg-white border-[#101A24]/10 text-[#101A24]'}`}>
              <Clock size={20} strokeWidth={3} /> {fmt(timeLeft)}
            </span>
          ) : combo > 1 ? (
            <span className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-widest bg-[#00B4D8] text-[#101A24] border border-[#101A24]/10 px-4 py-2 rounded-2xl shadow-sm rotate-2">
              <Flame size={20} strokeWidth={3} className="text-[#101A24]" /> {combo}x COMBO
            </span>
          ) : null}
        </div>
        <span className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] bg-white border border-[#101A24]/10 px-4 py-2 rounded-2xl shadow-sm">
          {t.questionIndicator.replace('{current}', cidx + 1).replace('{total}', questions.length)}
        </span>
      </div>

      {/* Progress */}
      <div className="h-4 bg-white border border-[#101A24]/10 rounded-full overflow-hidden shadow-inner">
        <div className="transition-all duration-300 rounded-full h-full bg-[#9FE870]" style={{ width: `${((cidx + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="card-pro p-8 md:p-12 bg-white relative mt-4">
        <span className="absolute -top-5 -left-5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#101A24] px-4 py-2 rounded-2xl border border-[#101A24]/10 shadow-sm -rotate-6">
          Câu {q.stt || cidx + 1}
        </span>
        
        <h3 className="text-2xl md:text-4xl font-extrabold text-[#101A24] leading-snug tracking-tight mb-10 mt-2">
          {q.question}
        </h3>

        <div className="flex flex-col gap-4">
          {(opts || []).map((opt, i) => {
            const isCorr = i === q.correct_index;
            const isSel  = selected === i;
            let cls = 'w-full text-left px-6 py-5 rounded-2xl border border-[#101A24]/10 text-lg font-bold transition-all flex items-center gap-5 ';

            if (answered && mode === 'practice') {
              if (isCorr)      cls += 'bg-[#2563EB] text-white shadow-sm -translate-y-1 -translate-x-1';
              else if (isSel)  cls += 'bg-[#EF4444] text-white shadow-none translate-y-1 translate-x-1';
              else             cls += 'bg-[#F9FAFB] text-[#101A24] opacity-50 shadow-none';
            } else if (isSel) {
              cls += 'bg-[#00B4D8] text-[#101A24] shadow-sm -translate-y-1 -translate-x-1';
            } else {
              cls += 'bg-white text-[#101A24] shadow-sm hover:-translate-y-0.5 hover:-translate-x-0.5 cursor-pointer';
            }

            return (
              <button key={i} onClick={e => pick(i, e)} disabled={answered} className={cls}>
                <span className={`w-10 h-10 rounded-lg border border-[#101A24]/10 text-sm font-extrabold flex items-center justify-center shrink-0 ${
                  answered && isCorr ? 'bg-white text-[#101A24]'
                  : answered && isSel ? 'bg-[#101A24] text-white'
                  : 'bg-[#9FE870] text-[#101A24] shadow-sm'
                }`}>{['A','B','C','D'][i]}</span>
                <span className="flex-1">{opt}</span>
                {answered && isCorr && <CheckCircle2 size={28} strokeWidth={3} className="text-white shrink-0" />}
                {answered && isSel && !isCorr && <XCircle size={28} strokeWidth={3} className="text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {answered && mode === 'practice' && (
        <div className={`card-pro p-8 border-t-8 scale-in mt-4 ${isCorrect ? 'border-t-[#2563EB] bg-white' : 'border-t-[#EF4444] bg-[#F9FAFB]'}`}>
          <div className="flex items-center gap-4 mb-4">
            {isCorrect
              ? <><CheckCircle2 size={36} strokeWidth={3} className="text-[#2563EB]" /> <span className="font-extrabold text-3xl uppercase tracking-tighter text-[#101A24]">{t.correctFeedback}</span></>
              : <><XCircle size={36} strokeWidth={3} className="text-[#EF4444]" /> <span className="font-extrabold text-3xl uppercase tracking-tighter text-[#101A24]">{t.incorrectFeedback}</span></>
            }
          </div>
          {!isCorrect && (
            <p className="text-base font-bold text-[#101A24] mb-6">
              <strong className="uppercase tracking-widest bg-[#00B4D8] border border-[#101A24]/10 px-3 py-1 rounded-lg mr-3 shadow-sm">{t.correctAnswerWas}</strong>
              {q.options[q.correct_index]}
            </p>
          )}
          <div className="bg-white rounded-2xl p-6 text-base text-[#101A24] font-bold leading-relaxed border border-[#101A24]/10 shadow-inner mb-6">
            <strong className="block text-[#101A24] text-sm font-extrabold uppercase tracking-widest mb-3 underline decoration-3 decoration-[#9FE870] underline-offset-4">{t.explanationTitle}</strong>
            {q.explanation}
            {q.source && <p className="mt-4 text-xs font-medium text-[#666] italic">Nguồn: {q.source}</p>}
          </div>
          <button onClick={advance} className="btn-pro-primary w-full text-2xl py-5 bg-[#00B4D8]">
            {t.nextQuestionBtn} <ArrowRight size={24} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}
