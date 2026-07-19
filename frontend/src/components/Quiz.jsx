import { useState, useEffect, useRef } from 'react';
import { generateQuiz, submitQuizScore } from '../utils/api';
import { useT, useLanguage } from '../translations';
import { playPang, playCheer, playScream } from '../utils/sound';
import { Target, Flame, Zap, Medal, Crown, Crosshair, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import llamaSpit from '../assets/llama-spit.webp';
import llamaCheer from '../assets/llama-cheer.webp';
import quizModeSelect from '../assets/quiz-mode-select.webp';
import quizPracticeMode from '../assets/quiz-practice-mode.webp';
import quizExamMode from '../assets/quiz-exam-mode.webp';
import { pickCorrectResponse, pickWrongResponse } from '../llamaResponses';
import ExamReport from './ExamReport';
import QuizHistory from './QuizHistory';

const BADGE_ICONS = { first_lesson: Crosshair, streak_3: Target, streak_7: Flame, pang_sniper: Zap, topic_master: Medal, xp_1000: Crown };
const CARD_SHADOW = '0 4px 20px rgba(0,0,0,0.06)';

export default function Quiz({ onQuizFinished, onStudyTopic, onBack }) {
  const t = useT();
  const { lang } = useLanguage();
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
  const [wrongStreak, setWrongStreak] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes, matching the real MOF exam
  const timerRef = useRef(null);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [examAnswers, setExamAnswers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (started && mode === 'exam' && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); finishQuiz(true); return 0; } return p - 1; });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started, finished, mode]);

  const q = questions[cidx];

  async function startQuiz(selectedMode = mode) {
    setLoading(true); setError('');
    try {
      const qs = await generateQuiz(topic, difficulty, selectedMode);
      if (qs.length === 0) throw new Error(t.quizNoQuestions);
      setQuestions(qs); setCidx(0); setScore(0); setCombo(0); setMaxCombo(0);
      setSelected(null); setAnswered(false); setTimeLeft(3600);
      setExamAnswers([]); setStarted(true); setFinished(false); setShowDetailedReport(false);
    } catch (e) { setError(e.message || t.quizLoadError); }
    finally { setLoading(false); }
  }

  function pick(optIdx, e) {
    if (answered) return;
    setSelected(optIdx); setAnswered(true);

    const correct = optIdx === q.correct_index;

    if (correct) {
      setScore(p => p + 1);
      const nc = combo + 1; setCombo(nc); if (nc > maxCombo) setMaxCombo(nc);
      setWrongStreak(0);
      if (mode === 'practice') {
        playCheer();
        setFeedbackText(pickCorrectResponse({ streak: nc, difficulty: q.difficulty, topic: q.topic, lang }));
        window.dispatchEvent(new CustomEvent('pang-chiu-effect', { detail: { type: 'pang', x: e.clientX, y: e.clientY } }));
      }
    } else {
      setCombo(0);
      const nw = wrongStreak + 1; setWrongStreak(nw);
      if (mode === 'practice') {
        playScream();
        setFeedbackText(pickWrongResponse({ wrongStreak: nw, difficulty: q.difficulty, correct_answer: q.options[q.correct_index], wrong_answer: q.options[optIdx], lang }));
        window.dispatchEvent(new CustomEvent('pang-chiu-effect', { detail: { type: 'chiu', x: e.clientX, y: e.clientY } }));
      }
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
    const answers = mode === 'exam' ? examAnswers.map(a => ({
      question: a.question.question,
      topic: a.question.topic,
      options: a.question.options,
      correct_index: a.question.correct_index,
      selected_index: a.selected,
      isCorrect: a.isCorrect,
      explanation: a.question.explanation
    })) : undefined;
    try {
      const r = await submitQuizScore({ score: fs, totalQuestions: questions.length, topic: mode === 'exam' ? 'full_exam' : topic, type: mode, maxCombo, answers });
      setXpEarned(r.xp_earned); setNewBadges(r.newBadges || []); playPang();
    } catch (e) { setError(e.message || t.quizSaveError); }
    finally { setSubmitting(false); }
  }

  function fmt(s) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; }

  function backToModeSelect() {
    onQuizFinished();
    setStarted(false); setFinished(false); setQuestions([]); setCidx(0);
    setScore(0); setCombo(0); setMaxCombo(0); setWrongStreak(0);
    setSelected(null); setAnswered(false); setExamAnswers([]);
    setXpEarned(0); setNewBadges([]); setError('');
  }

  const isCorrect = answered && selected === q?.correct_index;

  if (showHistory) return <QuizHistory onBack={() => setShowHistory(false)} onStudyTopic={onStudyTopic} />;

  /* ── Setup: "Chọn chế độ chiến!" ─── */
  if (!started && !finished) return (
    <div className="bg-white pop-in text-center max-w-xl mx-auto" style={{ borderRadius: '2rem', boxShadow: CARD_SHADOW, padding: '44px 40px' }}>
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 border-none cursor-pointer bg-[#EEF0F3] rounded-2xl py-2 px-3.5 mb-5 font-comic font-bold text-[13px] text-[#101A24]"
        >
          <ArrowLeft size={16} strokeWidth={3} /> {t.navHome}
        </button>
      )}
      <img
        src={quizModeSelect}
        alt=""
        className="w-24 h-24 object-contain mx-auto mb-5 wiggle"
        style={{ transform: 'rotate(-6deg)' }}
      />
      <h2 className="font-comic font-extrabold text-3xl text-[#101A24] uppercase mb-2">{t.quizChooseModeHeading}</h2>
      <p className="text-sm font-bold text-[#8A8A8A] mb-7">{t.quizChooseModeSubtitle}</p>

      <div className="flex gap-4 mb-3">
        <button
          onClick={() => { setMode('practice'); startQuiz('practice'); }}
          disabled={loading}
          className="flex-1 border-none cursor-pointer rounded-3xl py-6 px-4 flex flex-col items-center gap-2.5 transition-transform hover:-translate-y-1"
          style={{
            background: '#C7EFC4',
            boxShadow: '0 4px 14px rgba(79,154,90,0.25)'
          }}
        >
          <img src={quizPracticeMode} alt="" className="w-14 h-14 object-contain" />
          <span className="font-comic font-extrabold text-base text-[#101A24]">{t.practiceMode}</span>
          <span className="text-xs font-bold text-[#2F5C37]">{t.quizPracticeDesc}</span>
        </button>
        <button
          onClick={() => { setMode('exam'); startQuiz('exam'); }}
          disabled={loading}
          className="flex-1 border-none cursor-pointer rounded-3xl py-6 px-4 flex flex-col items-center gap-2.5 transition-transform hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, #E3D9F5 0%, #FCE7A8 100%)',
            boxShadow: '0 4px 14px rgba(138,111,201,0.3)'
          }}
        >
          <img src={quizExamMode} alt="" className="w-14 h-14 object-contain" />
          <span className="font-comic font-extrabold text-base text-[#101A24]">{t.examMode}</span>
          <span className="text-xs font-bold text-[#6B4FA8]">{t.quizExamDesc}</span>
        </button>
      </div>

      {loading && (
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A8A8A] mb-4">{t.quizPreparing}</p>
      )}

      {error && (
        <div className="text-[#B4443B] text-sm font-bold rounded-2xl bg-[#F7D2CC] px-4 py-3 mb-4">{error}</div>
      )}

      <button
        onClick={() => setShowHistory(true)}
        className="w-full border-none cursor-pointer bg-white rounded-2xl py-3 mt-3 font-comic font-extrabold text-sm text-[#101A24] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
      >
        {t.quizHistoryBtn}
      </button>
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

        <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border border-[#101A24]/10 bg-[#C7EFC4] shadow-sm mb-6 -rotate-2">
          <span className="text-5xl font-extrabold text-[#101A24]">{pct}%</span>
          <span className="text-sm font-extrabold text-[#101A24] uppercase tracking-widest bg-white border border-[#101A24]/10 px-2 py-0.5 rounded shadow-sm mt-2 -rotate-3">{fs}/{questions.length}</span>
        </div>

        {mode === 'exam' && (
          <div className={`inline-block mb-10 px-6 py-3 rounded-2xl border border-[#101A24]/10 shadow-sm font-extrabold uppercase tracking-widest text-white ${pct >= 70 ? 'bg-[#6B8AD6]' : 'bg-[#D9695F]'}`}>
            {pct >= 70 ? t.quizPassMessage : t.quizFailMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-[#101A24]/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#101A24] mb-1">{t.xpEarned}</p>
            <p className="text-4xl font-extrabold text-[#4F9A5A]">+{xpEarned}</p>
          </div>
          <div className="bg-white border border-[#101A24]/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#101A24] mb-1">{t.comboBonus}</p>
            <p className="text-4xl font-extrabold text-[#3B93A8]">{maxCombo > 1 ? `${(1 + Math.min((maxCombo-1)*0.05,0.25)).toFixed(2)}x` : '1.0x'}</p>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="bg-[#B9E7EF] border border-[#101A24]/10 rounded-2xl p-6 shadow-sm text-left mb-10">
            <p className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] mb-4">{t.quizNewBadges}</p>
            <div className="flex flex-col gap-3">
              {newBadges.map(bid => {
                const Icon = BADGE_ICONS[bid] || Zap;
                return <div key={bid} className="flex items-center gap-3 text-sm font-extrabold text-[#101A24] uppercase bg-white border border-[#101A24]/10 px-3 py-2 rounded shadow-sm"><Icon size={20} strokeWidth={3} className="text-[#4F9A5A]" /> {t[`badge_${bid}`] || bid}</div>;
              })}
            </div>
          </div>
        )}

        {mode === 'exam' && examAnswers.length > 0 && (
          <div className="mb-10">
            <ExamReport examAnswers={examAnswers} onStudyTopic={onStudyTopic} />
          </div>
        )}

        <button onClick={backToModeSelect} className="btn-pro w-full text-xl bg-[#4C6FC4] hover:bg-[#3D5DAE] text-white py-4">
          {t.backToDashboard}
        </button>
      </div>
    );
  }

  /* ── In Progress ─── */
  if (!q) return null;
  const opts = q.options;

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
    <div className="flex flex-col gap-5 pop-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === 'exam' ? (
            <span className={`flex items-center gap-2 font-comic font-extrabold text-sm px-4 py-2 rounded-2xl ${timeLeft < 300 ? 'bg-[#E4897E] text-white animate-pulse' : 'bg-white text-[#101A24]'}`} style={{ boxShadow: timeLeft < 300 ? 'none' : '0 4px 14px rgba(0,0,0,0.06)' }}>
              <Clock size={20} strokeWidth={3} /> {fmt(timeLeft)}
            </span>
          ) : combo > 1 ? (
            <span className="flex items-center gap-1.5 font-comic font-extrabold text-sm px-4 py-2 rounded-2xl" style={{ background: '#F7DA8A', color: '#101A24', boxShadow: '0 4px 14px rgba(184,145,46,0.25)', transform: 'rotate(-2deg)' }}>
              {t.quizComboIndicator.replace('{combo}', combo)}
            </span>
          ) : null}
        </div>
        <span className="font-comic font-extrabold text-sm text-[#101A24] bg-white px-4 py-2 rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
          {t.questionIndicator.replace('{current}', cidx + 1).replace('{total}', questions.length)}
        </span>
      </div>

      {/* Progress */}
      <div className="h-4 bg-white rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((cidx + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #C7EFC4, #9BDDA0)' }} />
      </div>

      {/* Question */}
      <div className="relative bg-white mt-2" style={{ borderRadius: '2rem', boxShadow: CARD_SHADOW, padding: '36px 32px' }}>
        <span
          className="absolute font-comic font-bold text-xs text-white bg-[#8A6FC9] px-4 py-2 rounded-full"
          style={{ top: '-18px', left: '28px', boxShadow: '0 4px 14px rgba(138,111,201,0.3)', transform: 'rotate(-3deg)' }}
        >
          {t.quizReadyTag}
        </span>

        <h3 className="font-comic font-extrabold text-xl md:text-2xl text-[#101A24] leading-snug mt-3 mb-7">
          {q.question}
        </h3>

        <div className="flex flex-col gap-3.5">
          {(opts || []).map((opt, i) => {
            const isCorr = i === q.correct_index;
            const isSel = selected === i;

            let bg = '#EEF0F3', color = '#101A24', shadow = '0 4px 14px rgba(0,0,0,0.06)', letterBg = '#C7EFC4', letterColor = '#101A24', mark = '';
            if (answered && mode === 'practice') {
              if (isCorr) { bg = '#6B8AD6'; color = '#fff'; shadow = '0 4px 14px rgba(76,111,196,0.3)'; letterBg = '#fff'; letterColor = '#101A24'; mark = '✓'; }
              else if (isSel) { bg = '#D9695F'; color = '#fff'; shadow = 'none'; letterBg = '#101A24'; letterColor = '#fff'; mark = '✕'; }
              else { bg = '#F3ECDD'; color = '#A69B87'; shadow = 'none'; letterBg = '#E5E0D3'; letterColor = '#A69B87'; }
            } else if (answered && mode === 'exam' && isSel) {
              // Real-exam behavior: just mark what you picked, no correctness reveal until results.
              bg = '#8A6FC9'; color = '#fff'; shadow = '0 4px 14px rgba(138,111,201,0.3)'; letterBg = '#fff'; letterColor = '#101A24';
            }

            return (
              <button
                key={i}
                onClick={e => pick(i, e)}
                disabled={answered}
                className="flex items-center gap-4 text-left border-none cursor-pointer rounded-[20px] py-4 px-5 text-base font-bold transition-transform hover:-translate-y-0.5"
                style={{ background: bg, color, boxShadow: shadow }}
              >
                <span
                  className="w-9 h-9 rounded-[10px] font-comic font-extrabold text-sm flex items-center justify-center shrink-0"
                  style={{ background: letterBg, color: letterColor }}
                >
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                <span className="flex-1">{opt}</span>
                {mark && <span className="text-xl">{mark}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>

      {/* Feedback — centered popup with a Llama mascot bubble, impossible to miss */}
      {answered && mode === 'practice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101A24]/55 p-5">
          <div className="bounce-in bg-white w-full max-w-md overflow-hidden text-center" style={{ borderRadius: '2rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}>
            <div className="flex justify-center py-8" style={{ background: isCorrect ? '#E7F5E5' : '#FBEAE6' }}>
              <div
                className="relative w-[140px] h-[140px]"
                style={{ animation: 'bob 2.2s ease-in-out infinite' }}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{ boxShadow: `0 6px 16px ${isCorrect ? 'rgba(79,154,90,0.3)' : 'rgba(217,105,95,0.3)'}` }}
                >
                  <img
                    src={isCorrect ? llamaCheer : llamaSpit}
                    alt={isCorrect ? t.quizCorrectAlt : t.quizWrongAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="absolute -bottom-1.5 -right-1.5 text-2xl bg-white rounded-full w-[52px] h-[52px] flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                >
                  {isCorrect ? '🎉' : '💦'}
                </span>
              </div>
            </div>

            <div className="p-7">
              <h4 className="font-comic font-extrabold text-xl text-[#101A24] mb-2 leading-snug">
                {feedbackText}
              </h4>
              {!isCorrect && (
                <p className="text-sm font-bold text-[#8A8A8A] mb-5 leading-relaxed">
                  {t.correctAnswerWas} <strong className="text-[#101A24]">{q.options[q.correct_index]}</strong>
                </p>
              )}

              <div className="text-left bg-[#EEF0F3] rounded-2xl p-5 mb-6">
                <strong className="block text-[#101A24] text-xs font-extrabold uppercase tracking-widest mb-2">{t.explanationTitle}</strong>
                <p className="text-sm font-bold text-[#3A3A3A] leading-relaxed">{q.explanation}</p>
                {q.source && <p className="mt-3 text-xs font-medium text-[#8A8A8A] italic">{t.quizSourceLabel.replace('{source}', q.source)}</p>}
              </div>

              <button
                onClick={advance}
                className="w-full border-none cursor-pointer bg-[#B9E7EF] rounded-2xl py-4 font-comic font-extrabold text-base text-[#20606E] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(59,147,168,0.2)]"
              >
                {t.nextQuestionBtn} <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
