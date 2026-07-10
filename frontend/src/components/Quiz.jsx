import { useState, useEffect, useRef } from 'react';
import { generateQuiz, submitQuizScore } from '../utils/api';
import { translations } from '../translations';
import { playPang, playChiu } from '../utils/sound';

export default function Quiz({ onQuizFinished, language }) {
  const t = translations[language];

  // Config States
  const [topic, setTopic] = useState('fundamentals');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [mode, setMode] = useState('practice'); // 'practice' or 'exam'
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
  const [timeLeft, setTimeLeft] = useState(2400); // 40 minutes in seconds
  const timerRef = useRef(null);

  // Result States
  const [quizFinished, setQuizFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [examAnswers, setExamAnswers] = useState([]); // stores user selections for mock review

  // Timer Effect
  useEffect(() => {
    if (quizStarted && mode === 'exam' && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinishQuiz(true); // Auto-finish on timeout
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

  // Handle Option Selection (Firing bullet)
  function handleSelectOption(optionIndex, event) {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    // Get click coordinates to dispatch visual gunshot trigger
    const x = event.clientX;
    const y = event.clientY;

    let isCorrect = false;
    
    if (currentQuestion.type === 'fitb') {
      // For fill in the blank, correct answer is matching string
      const answer = currentQuestion.correct_answer.trim().toLowerCase();
      const answerVn = currentQuestion.correct_answer_vn.trim().toLowerCase();
      const userText = optionIndex.trim().toLowerCase(); // optionIndex stores the user string input
      isCorrect = (userText === answer || userText === answerVn);
    } else {
      isCorrect = (optionIndex === currentQuestion.correct_index);
    }

    // Trigger audio & dispatch gunshot events
    if (isCorrect) {
      playPang();
      setScore(prev => prev + 1);
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      
      // Dispatch custom gunshot event
      window.dispatchEvent(new CustomEvent('pang-chiu-effect', {
        detail: { type: 'pang', x, y }
      }));
    } else {
      playChiu();
      setCombo(0); // Reset combo multiplier
      
      window.dispatchEvent(new CustomEvent('pang-chiu-effect', {
        detail: { type: 'chiu', x, y }
      }));
    }

    if (mode === 'exam') {
      // Record answer for final report
      setExamAnswers(prev => [...prev, {
        question: currentQuestion,
        selected: optionIndex,
        isCorrect
      }]);

      // In Exam Mode, automatically transition after a short gunshot animation delay (0.9s)
      setTimeout(() => {
        handleAdvanceQuestion();
      }, 900);
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

    const finalScore = mode === 'exam' 
      ? examAnswers.filter(a => a.isCorrect).length 
      : score;

    try {
      // Submit score to database
      const result = await submitQuizScore({
        score: finalScore,
        totalQuestions: questions.length,
        topic: mode === 'exam' ? 'full_exam' : topic,
        type: mode,
        maxCombo: maxCombo
      });

      setXpEarned(result.xp_earned);
      setNewBadges(result.newBadges || []);
      
      // Trigger finishing gunshot play!
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

  // --- RENDERING SUB-VIEWS ---

  // 1. SETUP ARENA (Configuring the quiz)
  if (!quizStarted) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '32px', borderTop: '3px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
            {t.quizTitle}
          </h2>

          {error && (
            <div className="glass-panel-glow-red" style={{ padding: '12px', color: '#f87171', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Mode Select */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setMode('practice')}
                className={mode === 'practice' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '14px 10px', fontSize: '0.95rem' }}
              >
                🎯 {t.practiceMode}
              </button>
              <button
                onClick={() => setMode('exam')}
                className={mode === 'exam' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '14px 10px', fontSize: '0.95rem' }}
              >
                ⏱️ {t.examMode}
              </button>
            </div>

            {mode === 'practice' && (
              <>
                {/* Topic Select */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t.selectTopic}
                  </label>
                  <select
                    className="glass-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{ background: '#161e31', color: '#fff', cursor: 'pointer' }}
                  >
                    <option value="fundamentals">{language === 'vn' ? 'Nguyên Lý Bảo Hiểm Cơ Bản' : 'Insurance Fundamentals'}</option>
                    <option value="products">{language === 'vn' ? 'Các Sản Phẩm Bảo Hiểm' : 'Insurance Products'}</option>
                    <option value="contracts">{language === 'vn' ? 'Hợp Đồng Bảo Hiểm' : 'Insurance Contracts'}</option>
                    <option value="regulations">{language === 'vn' ? 'Quy Định Pháp Luật' : 'State Regulations'}</option>
                  </select>
                </div>

                {/* Difficulty Select */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t.difficultyLabel}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={difficulty === lvl ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '10px', fontSize: '0.85rem' }}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === 'exam' && (
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '8px' }}>
                  📜 {t.examDuration}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {t.examRules}
                </p>
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              className="btn-success"
              disabled={loading}
              style={{
                marginTop: '16px',
                padding: '16px',
                fontSize: '1.1rem',
                animation: 'pulseGlow 2s infinite alternate',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? 'Aiming...' : t.startQuizBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. RESULTS SUMMARY
  if (quizFinished) {
    const finalScore = mode === 'exam' ? examAnswers.filter(a => a.isCorrect).length : score;
    const finalTotal = questions.length;

    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginBottom: '8px' }}>
            🎉 {t.quizCompleted}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            {mode === 'exam' ? t.examMode : `${t.practiceMode} - ${topic}`}
          </p>

          {/* Stats Circle */}
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            border: '6px solid var(--success)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 28px',
            boxShadow: '0 0 20px var(--success-glow)'
          }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800 }}>{finalScore}/{finalTotal}</span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{t.quizScore}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t.xpEarned}</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--success)' }}>+{xpEarned} XP</strong>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(249, 115, 22, 0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t.comboBonus}</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                {maxCombo > 1 ? `${(1 + Math.min((maxCombo - 1) * 0.05, 0.25)).toFixed(2)}x (${maxCombo} max)` : '1.00x'}
              </strong>
            </div>
          </div>

          {/* New Badges Alert */}
          {newBadges.length > 0 && (
            <div className="glass-panel-glow-green" style={{
              background: 'rgba(16, 185, 129, 0.05)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '32px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--success)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎖️ Achievements Unlocked!
              </h4>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {newBadges.map((badgeId) => (
                  <li key={badgeId} style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
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

          {/* Exam review scroll list */}
          {mode === 'exam' && examAnswers.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>Exam Review</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                {examAnswers.map((ans, idx) => (
                  <div key={idx} className="glass-panel" style={{
                    padding: '12px 16px',
                    borderLeft: ans.isCorrect ? '4px solid var(--success)' : '4px solid var(--danger)',
                    fontSize: '0.85rem'
                  }}>
                    <p style={{ fontWeight: 600, color: '#fff' }}>Q{idx + 1}: {language === 'vn' ? ans.question.question_vn : ans.question.question_en}</p>
                    <p style={{ color: ans.isCorrect ? 'var(--success)' : 'var(--danger)', marginTop: '4px', fontWeight: 500 }}>
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
            style={{ width: '100%', padding: '16px' }}
          >
            {t.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // 3. QUIZ PLAYING WINDOW
  if (!currentQuestion) return null;

  // FITB string state
  const FitbInput = () => {
    const [typed, setTyped] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <input
          type="text"
          className="glass-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={language === 'vn' ? 'Nhập câu trả lời...' : 'Type answer...'}
          disabled={isAnswered}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && typed.trim() !== '') {
              handleSelectOption(typed, e);
            }
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
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      {/* Quiz Dashboard Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {mode === 'exam' ? (
            <span style={{ color: timeLeft < 300 ? '#f87171' : 'var(--text-muted)', fontWeight: 700 }}>
              ⏰ {t.timerLabel} {formatTime(timeLeft)}
            </span>
          ) : (
            <span style={{ textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600 }}>
              🎯 {topic}
            </span>
          )}
        </span>

        {mode === 'practice' && combo > 0 && (
          <span className="streak-badge" style={{
            padding: '4px 12px',
            borderRadius: '99px',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 800
          }}>
            🔥 {combo} Combo Multiplier!
          </span>
        )}

        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
          {t.questionIndicator.replace('{current}', currentIndex + 1).replace('{total}', questions.length)}
        </span>
      </div>

      {/* Target Question Card */}
      <div className="glass-panel" style={{
        padding: '28px 24px',
        marginBottom: '24px',
        borderTop: '3px solid var(--primary)',
        borderColor: isAnswered 
          ? (currentQuestion.type === 'fitb' 
              ? (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() ? 'var(--success-glow)' : 'var(--danger-glow)')
              : (selectedOption === currentQuestion.correct_index ? 'var(--success-glow)' : 'var(--danger-glow)')
            )
          : 'var(--border-color)'
      }}>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Question Type: {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'tf' ? 'True / False' : 'Fill In The Blank'}
        </span>
        
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#fff', marginTop: '8px', lineHeight: '1.3' }}>
          {language === 'vn' ? currentQuestion.question_vn : currentQuestion.question_en}
        </h2>
        
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', italic: true, marginTop: '6px' }}>
          {language === 'vn' ? currentQuestion.question_en : currentQuestion.question_vn}
        </p>

        {/* Options List */}
        {currentQuestion.type === 'fitb' ? (
          <FitbInput />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            {(language === 'vn' ? currentQuestion.options_vn : currentQuestion.options_en).map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentQuestion.correct_index;
              
              // Styling logic for Practice mode feedback
              let btnClass = 'btn-secondary';
              let customStyle = {
                padding: '16px',
                textAlign: 'left',
                justifyContent: 'flex-start',
                fontSize: '1rem',
                position: 'relative',
                overflow: 'hidden',
                width: '100%'
              };

              if (isAnswered && mode === 'practice') {
                if (isCorrectOpt) {
                  customStyle.border = '2px solid var(--success)';
                  customStyle.background = 'rgba(16, 185, 129, 0.1)';
                  customStyle.color = '#fff';
                } else if (isSelected) {
                  customStyle.border = '2px solid var(--danger)';
                  customStyle.background = 'rgba(239, 68, 68, 0.1)';
                }
              } else if (isSelected) {
                customStyle.border = '2px solid var(--primary)';
                customStyle.background = 'rgba(249, 115, 22, 0.1)';
              }

              return (
                <button
                  key={idx}
                  onClick={(e) => handleSelectOption(idx, e)}
                  disabled={isAnswered}
                  className={btnClass}
                  style={customStyle}
                >
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: isSelected ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)'
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

      {/* PRACTICE MODE FEEDBACK CARD */}
      {isAnswered && mode === 'practice' && (
        <div className="glass-panel" style={{
          padding: '24px',
          marginBottom: '24px',
          borderColor: (selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase()))) 
            ? 'var(--success)' 
            : 'var(--danger)',
          background: (selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase())))
            ? 'rgba(16, 185, 129, 0.03)' 
            : 'rgba(239, 68, 68, 0.03)'
        }}>
          <h4 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: (selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase())))
              ? 'var(--success)' 
              : 'var(--danger)',
            marginBottom: '8px'
          }}>
            {(selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase())))
              ? t.correctFeedback 
              : t.incorrectFeedback
            }
          </h4>

          {/* Correct answer text */}
          {!(selectedOption === currentQuestion.correct_index || (currentQuestion.type === 'fitb' && (selectedOption.trim().toLowerCase() === currentQuestion.correct_answer.toLowerCase() || selectedOption.trim().toLowerCase() === currentQuestion.correct_answer_vn.toLowerCase()))) && (
            <p style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '12px' }}>
              <strong>{t.correctAnswerWas} </strong>
              {currentQuestion.type === 'fitb' 
                ? `${currentQuestion.correct_answer} / ${currentQuestion.correct_answer_vn}`
                : (language === 'vn' ? currentQuestion.options_vn[currentQuestion.correct_index] : currentQuestion.options_en[currentQuestion.correct_index])
              }
            </p>
          )}

          {/* Explanation Text */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              {t.explanationTitle}
            </span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
              {language === 'vn' ? currentQuestion.explanation_vn : currentQuestion.explanation_en}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', italic: true, lineHeight: '1.4', marginTop: '6px' }}>
              {language === 'vn' ? currentQuestion.explanation_en : currentQuestion.explanation_vn}
            </p>
          </div>

          <button
            onClick={handleAdvanceQuestion}
            className="btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
          >
            {t.nextQuestionBtn}
          </button>
        </div>
      )}

    </div>
  );
}
