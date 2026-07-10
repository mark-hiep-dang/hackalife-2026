import { useState, useEffect, useRef } from 'react';
import { generateQuiz, submitQuizScore } from '../utils/api';
import { translations } from '../translations';
import { playPang, playChiu } from '../utils/sound';

export default function Quiz({ onQuizFinished, language }) {
  const t = translations[language];

  // Config States
  const [topic, setTopic] = useState('fundamentals');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [mode, setMode] = useState('practice');
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Quiz Running States
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Game Play States
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  
  // Timer for Mock Exam
  const [timeLeft, setTimeLeft] = useState(2400);
  const timerRef = useRef(null);

  // Result States
  const [quizFinished, setQuizFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [examAnswers, setExamAnswers] = useState([]);

  // Timer Effect
  useEffect(() => {
    if (quizStarted && mode === 'exam' && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinishQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizStarted, quizFinished, mode]);

  const currentQuestion = questions[currentIndex];

  async function handleStartQuiz() {
    setLoading(true);
    setError('');
    try {
      const qs = await generateQuiz(topic, difficulty, mode);
      setQuestions(qs);
      setCurrentIndex(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(2400);
      setExamAnswers([]);
      setQuizStarted(true);
      setQuizFinished(false);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(optionIndex, event) {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const x = event.clientX;
    const y = event.clientY;

    let isCorrect = false;
    
    if (currentQuestion.type === 'fitb') {
      const answer = currentQuestion.correct_answer.trim().toLowerCase();
      const answerVn = currentQuestion.correct_answer_vn.trim().toLowerCase();
      const userText = optionIndex.trim().toLowerCase();
      isCorrect = (userText === answer || userText === answerVn);
    } else {
      isCorrect = (optionIndex === currentQuestion.correct_index);
    }

    if (isCorrect) {
      playPang();
      setScore(prev => prev + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      window.dispatchEvent(new CustomEvent('pang-chiu-effect', { detail: { type: 'pang', x, y } }));
    } else {
      playChiu();
      setCombo(0);
      window.dispatchEvent(new CustomEvent('pang-chiu-effect', { detail: { type: 'chiu', x, y } }));
    }

    if (mode === 'exam') {
      setExamAnswers(prev => [...prev, { question: currentQuestion, selected: optionIndex, isCorrect }]);
      setTimeout(() => { handleAdvanceQuestion(); }, 900);
    }
  }

  function handleAdvanceQuestion() {
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinishQuiz(false);
    }
  }

  async function handleFinishQuiz(isTimeout = false) {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmittingScore(true);
    setQuizFinished(true);

    const finalScore = mode === 'exam' ? examAnswers.filter(a => a.isCorrect).length : score;

    try {
      const result = await submitQuizScore({
        score: finalScore,
        totalQuestions: questions.length,
        topic: mode === 'exam' ? 'full_exam' : topic,
        type: mode,
        maxCombo: maxCombo
      });
      setXpEarned(result.xp_earned);
      setNewBadges(result.newBadges || []);
      playPang();
    } catch (err) {
      setError(err.message || 'Failed to submit quiz results');
    } finally {
      setSubmittingScore(false);
    }
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  // ── 1. SETUP SCREEN ──
  if (!quizStarted) {
    return (
      <div className="fade-in" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '36px 32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', textAlign: 'center', color: 'var(--text-dark)', letterSpacing: '-0.03em' }}>
            {t.quizTitle}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '28px' }}>
            {language === 'vn' ? 'Chọn chế độ và bắt đầu luyện tập' : 'Choose a mode and start practicing'}
          </p>

          {error && (
            <div style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(239,68,68,0.15)', padding: '10px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setMode('practice')}
                className={mode === 'practice' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '14px 10px' }}
              >
                🎯 {t.practiceMode}
              </button>
              <button
                onClick={() => setMode('exam')}
                className={mode === 'exam' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '14px 10px' }}
              >
                ⏱️ {t.examMode}
              </button>
            </div>

            {mode === 'practice' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t.selectTopic}
                  </label>
                  <select
                    className="glass-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="fundamentals">{language === 'vn' ? 'Nguyên Lý Bảo Hiểm Cơ Bản' : 'Insurance Fundamentals'}</option>
                    <option value="products">{language === 'vn' ? 'Các Sản Phẩm Bảo Hiểm' : 'Insurance Products'}</option>
                    <option value="contracts">{language === 'vn' ? 'Hợp Đồng Bảo Hiểm' : 'Insurance Contracts'}</option>
                    <option value="regulations">{language === 'vn' ? 'Quy Định Pháp Luật' : 'State Regulations'}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t.difficultyLabel}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={difficulty === lvl ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '10px', fontSize: '0.825rem' }}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === 'exam' && (
              <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: '6px' }}>
                  📜 {t.examDuration}
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {t.examRules}
                </p>
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              className="btn-success"
              disabled={loading}
              style={{ marginTop: '8px', padding: '14px', fontSize: '1rem' }}
            >
              {loading ? 'Aiming...' : t.startQuizBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. RESULTS SCREEN ──
  if (quizFinished) {
    const finalScore = mode === 'exam' ? examAnswers.filter(a => a.isCorrect).length : score;
    const finalTotal = questions.length;

    return (
      <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '36px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-dark)', marginBottom: '4px', letterSpacing: '-0.03em' }}>
            {t.quizCompleted}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.875rem' }}>
            {mode === 'exam' ? t.examMode : `${t.practiceMode} — ${topic}`}
          </p>

          {/* Score Ring */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '4px solid var(--success)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 28px',
            background: 'var(--success-subtle)'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-dark)' }}>{finalScore}/{finalTotal}</span>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{t.quizScore}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{t.xpEarned}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--success-dark)' }}>+{xpEarned} XP</strong>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{t.comboBonus}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                {maxCombo > 1 ? `${(1 + Math.min((maxCombo - 1) * 0.05, 0.25)).toFixed(2)}x` : '1.00x'}
              </strong>
            </div>
          </div>

          {newBadges.length > 0 && (
            <div style={{
              background: 'var(--success-subtle)',
              border: '1px solid rgba(34,197,94,0.2)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '28px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--success-dark)', fontWeight: 700, marginBottom: '8px' }}>
                🎖️ Achievements Unlocked!
              </h4>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {newBadges.map((badgeId) => (
                  <li key={badgeId} style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {badgeId === 'first_lesson' && `🔫 ${t.badge_first_lesson}`}
                    {badgeId === 'streak_3' && `🎯 ${t.badge_streak_3}`}
                    {badgeId === 'streak_7' && `🔥 ${t.badge_streak_7}`}
                    {badgeId === 'pang_sniper' && `💥 ${t.badge_pang_sniper}`}
                    {badgeId === 'topic_master' && `🎖️ ${t.badge_topic_master}`}
                    {badgeId === 'xp_1000' && `👑 ${t.badge_xp_1000}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mode === 'exam' && examAnswers.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-dark)' }}>Exam Review</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {examAnswers.map((ans, idx) => (
                  <div key={idx} className="glass-panel" style={{
                    padding: '12px 16px',
                    borderLeft: `3px solid ${ans.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                    fontSize: '0.85rem'
                  }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Q{idx + 1}: {language === 'vn' ? ans.question.question_vn : ans.question.question_en}</p>
                    <p style={{ color: ans.isCorrect ? 'var(--success-dark)' : 'var(--danger)', marginTop: '4px', fontWeight: 600 }}>
                      Selected: {ans.question.type === 'fitb' 
                        ? ans.selected 
                        : (language === 'vn' ? ans.question.options_vn[ans.selected] : ans.question.options_en[ans.selected])
                      } {ans.isCorrect ? '🎯' : '💨'}
                    </p>
                    {!ans.isCorrect && (
                      <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                        Correct: {ans.question.type === 'fitb' 
                          ? ans.question.correct_answer 
                          : (language === 'vn' ? ans.question.options_vn[ans.question.correct_index] : ans.question.options_en[ans.question.correct_index])
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onQuizFinished(xpEarned, profile?.level || 1, newBadges)}
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {t.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // ── 3. QUIZ IN PROGRESS ──
  if (!currentQuestion) return null;

  const FitbInput = () => {
    const [typed, setTyped] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        <input
          type="text"
          className="glass-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={language === 'vn' ? 'Nhập câu trả lời...' : 'Type answer...'}
          disabled={isAnswered}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && typed.trim() !== '') handleSelectOption(typed, e);
          }}
        />
        <button
          onClick={(e) => handleSelectOption(typed, e)}
          className="btn-primary"
          disabled={isAnswered || typed.trim() === ''}
        >
          {t.submitAnswerBtn}
        </button>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Quiz Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {mode === 'exam' ? (
            <span style={{ color: timeLeft < 300 ? 'var(--danger)' : 'var(--text-muted)' }}>
              ⏰ {t.timerLabel} {formatTime(timeLeft)}
            </span>
          ) : (
            <span style={{ color: 'var(--info)' }}>
              🎯 {topic}
            </span>
          )}
        </span>

        {mode === 'practice' && combo > 0 && (
          <span className="streak-badge" style={{
            padding: '4px 12px',
            borderRadius: '99px',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            🔥 {combo}x Combo
          </span>
        )}

        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t.questionIndicator.replace('{current}', currentIndex + 1).replace('{total}', questions.length)}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: '99px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{
          width: `${((currentIndex + 1) / questions.length) * 100}%`,
          height: '100%',
          background: 'var(--primary)',
          borderRadius: '99px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Question Card */}
      <div className="glass-panel" style={{ padding: '28px 24px', marginBottom: '20px' }}>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'tf' ? 'True / False' : 'Fill In The Blank'}
        </span>
        
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px', lineHeight: '1.4', letterSpacing: '-0.01em' }}>
          {language === 'vn' ? currentQuestion.question_vn : currentQuestion.question_en}
        </h2>
        
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
          {language === 'vn' ? currentQuestion.question_en : currentQuestion.question_vn}
        </p>

        {/* Options */}
        {currentQuestion.type === 'fitb' ? (
          <FitbInput />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
            {(language === 'vn' ? currentQuestion.options_vn : currentQuestion.options_en).map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentQuestion.correct_index;
              
              let borderColor = 'var(--border-color)';
              let bg = 'var(--bg-card)';
              let textColor = 'var(--text-main)';
              let shadow = 'none';

              if (isAnswered && mode === 'practice') {
                if (isCorrectOpt) {
                  borderColor = 'var(--success)';
                  bg = 'var(--success-subtle)';
                  textColor = 'var(--success-dark)';
                } else if (isSelected) {
                  borderColor = 'var(--danger)';
                  bg = 'var(--primary-subtle)';
                  textColor = 'var(--danger)';
                }
              } else if (isSelected) {
                borderColor = 'var(--info)';
                bg = 'var(--info-subtle)';
                textColor = 'var(--info-dark)';
                shadow = '0 0 0 3px var(--info-subtle)';
              }

              return (
                <button
                  key={idx}
                  onClick={(e) => handleSelectOption(idx, e)}
                  disabled={isAnswered}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '0.925rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: isAnswered ? 'default' : 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    color: textColor,
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.15s ease',
                    boxShadow: shadow
                  }}
                >
                  <span style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: `1.5px solid ${isSelected ? borderColor : 'var(--border-color)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    background: isSelected ? borderColor : 'var(--bg-subtle)',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Practice Feedback */}
      {isAnswered && mode === 'practice' && (
        <div className="glass-panel fade-in" style={{
          padding: '24px',
          marginBottom: '20px',
          borderLeft: `3px solid ${(selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase()))) ? 'var(--success)' : 'var(--danger)'}`
        }}>
          <h4 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: (selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase())))
              ? 'var(--success-dark)' 
              : 'var(--danger)',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            {(selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase())))
              ? t.correctFeedback 
              : t.incorrectFeedback
            }
          </h4>

          {!(selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase()))) && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '12px' }}>
              <strong>{t.correctAnswerWas} </strong>
              <span style={{ color: 'var(--success-dark)', fontWeight: 600 }}>
                {currentQuestion.type === 'fitb' 
                  ? `${currentQuestion.correct_answer} / ${currentQuestion.correct_answer_vn}`
                  : (language === 'vn' ? currentQuestion.options_vn[currentQuestion.correct_index] : currentQuestion.options_en[currentQuestion.correct_index])
                }
              </span>
            </p>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.explanationTitle}
            </span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {language === 'vn' ? currentQuestion.explanation_vn : currentQuestion.explanation_en}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.4', marginTop: '6px' }}>
              {language === 'vn' ? currentQuestion.explanation_en : currentQuestion.explanation_vn}
            </p>
          </div>

          <button
            onClick={handleAdvanceQuestion}
            className="btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
          >
            {t.nextQuestionBtn}
          </button>
        </div>
      )}

    </div>
  );
}
