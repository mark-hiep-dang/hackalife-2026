import { useState, useEffect } from 'react';
import { useT, useLanguage } from '../translations';
import { getDailyExpedition } from '../utils/api';
import { getCampInfo } from './LessonPath';
import { getExpeditionCopy, ACTIVITY_ICON } from '../expeditionCopy';
import Learn from './Learn';
import Quiz from './Quiz';
import Flashcards from './Flashcards';
import RescueTrail from './RescueTrail';
import { ArrowLeft, Sparkles } from 'lucide-react';

const QUIZ_TYPES = ['PRACTICE', 'CHECKPOINT', 'SCENARIO'];

// The screen opened by "Bắt đầu chặng" / "Tiếp tục leo" (spec §6/§7) — never
// jumps straight into a quiz/lesson. It shows today's activity sequence and
// routes into the right existing screen for whichever activity is next,
// then comes back here (not the dashboard) once that activity is done.
export default function ExpeditionPlayer({ lessons, onExit, onProgress, onPathChanged, onAskLlama }) {
  const t = useT();
  const { lang } = useLanguage();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeActivity, setActiveActivity] = useState(null);
  const [reaction, setReaction] = useState(null);

  function refetchPlan() {
    return getDailyExpedition().then(setPlan).catch(() => {});
  }

  useEffect(() => { refetchPlan().finally(() => setLoading(false)); }, []);

  function handleActivityDone(justCompletedType) {
    onProgress?.();
    refetchPlan().then(() => {
      setReaction(getExpeditionCopy(
        justCompletedType === 'LESSON' || justCompletedType === 'LESSON_REVIEW' ? 'RETURN_TO_EXPEDITION' : 'LESSON_COMPLETED',
        { lang }
      ).message);
    });
    setActiveActivity(null);
  }

  if (loading || !plan) {
    return <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">{t.quizPreparing}</div>;
  }

  const focusIdx = lessons?.findIndex((l) => l.id === plan.focusLessonId) ?? -1;
  const focusLesson = focusIdx >= 0 ? lessons[focusIdx] : null;
  const campInfo = focusIdx >= 0 ? getCampInfo(focusIdx, lessons.length, t) : null;

  /* ── An activity is in progress: hand off to the matching real screen ─── */
  if (activeActivity) {
    const a = activeActivity;
    if (a.type === 'LESSON' || a.type === 'LESSON_REVIEW') {
      const lesson = lessons.find((l) => l.id === a.lessonId) || focusLesson;
      if (!lesson) { setActiveActivity(null); return null; }
      return (
        <Learn
          lesson={lesson}
          onLessonFinished={() => handleActivityDone(a.type)}
        />
      );
    }
    if (QUIZ_TYPES.includes(a.type)) {
      return (
        <Quiz
          activityContext={{ lessonId: a.lessonId, activityType: a.type, topics: a.topics, count: a.count, mode: 'practice' }}
          onQuizFinished={() => handleActivityDone(a.type)}
          onPathChanged={onPathChanged}
          onAskLlama={onAskLlama}
        />
      );
    }
    if (a.type === 'FLASHCARD_REVIEW') {
      return (
        <Flashcards
          initialTopics={a.topics}
          activityContext={{ lessonId: a.lessonId, count: a.count }}
          onActivityFinished={() => handleActivityDone(a.type)}
        />
      );
    }
    if (a.type === 'RESCUE_TRAIL') {
      return <RescueTrail topic={a.topic} mistakeType={a.mistakeType} onDone={() => handleActivityDone(a.type)} />;
    }
    setActiveActivity(null);
    return null;
  }

  /* ── All done for today ─── */
  if (plan.completed) {
    return (
      <div className="max-w-2xl mx-auto pop-in text-center bg-white rounded-[2rem] p-10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div className="text-6xl mb-4" style={{ animation: 'bob 2.4s ease-in-out infinite' }}>🦙🏁</div>
        <h2 className="font-comic font-extrabold text-2xl text-[#101A24] uppercase mb-2">{t.expeditionAllDoneTitle}</h2>
        <p className="text-sm font-bold text-[#8A8A8A] mb-8">{getExpeditionCopy('EXPEDITION_ALL_DONE', { lang }).message}</p>
        <button onClick={onExit} className="btn-pro w-full bg-[#101A24] text-white hover:bg-[#0A1119] py-4 text-lg">
          {t.expeditionBackToDashboard}
        </button>
      </div>
    );
  }

  /* ── Activity list ─── */
  const nextAvailable = plan.activities.find((a) => a.status === 'AVAILABLE');

  return (
    <div className="max-w-2xl mx-auto pop-in flex flex-col gap-5">
      <button
        onClick={onExit}
        className="self-start flex items-center gap-1.5 border-none cursor-pointer bg-white rounded-2xl py-2 px-3.5 font-comic font-bold text-[13px] text-[#101A24] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
      >
        <ArrowLeft size={16} strokeWidth={3} /> {t.navHome}
      </button>

      <div
        className="rounded-[2rem] p-6"
        style={{ background: 'linear-gradient(135deg, #E3D9F5 0%, #FCE7A8 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
      >
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#6B4FA8] mb-1">
          {campInfo?.label} {focusLesson ? `· ${focusLesson.title_vn}` : ''}
        </p>
        <h2 className="font-comic font-extrabold text-xl text-[#101A24]">{t.expeditionCardTitle}</h2>

        {reaction && (
          <div className="mt-3 bg-white/70 rounded-2xl px-4 py-3 flex items-start gap-2 bounce-in">
            <Sparkles size={16} strokeWidth={3} className="text-[#6B4FA8] shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-[#101A24]">{reaction}</p>
          </div>
        )}

        <div className="bg-white/60 rounded-2xl p-4 mt-4 mb-2">
          <p className="text-xs font-extrabold text-[#6B4FA8] uppercase tracking-widest mb-1">{t.expeditionWhyLabel}</p>
          <p className="text-sm font-bold text-[#101A24] leading-relaxed">{plan.explanation}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {plan.activities.map((a) => {
          const isLocked = a.status === 'LOCKED';
          const isDone = a.status === 'COMPLETED';
          const isAvailable = a.status === 'AVAILABLE';
          return (
            <button
              key={a.activityId}
              disabled={!isAvailable}
              onClick={() => isAvailable && setActiveActivity(a)}
              className={`text-left border-none rounded-2xl px-5 py-4 flex items-center gap-4 transition-transform ${isAvailable ? 'cursor-pointer bg-white hover:-translate-y-0.5' : 'cursor-default'}`}
              style={{
                background: isDone ? '#EEF0F3' : isAvailable ? '#fff' : '#F7F7F8',
                opacity: isLocked ? 0.55 : 1,
                boxShadow: isAvailable ? '0 4px 16px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <span className="text-2xl shrink-0">{isDone ? '✅' : isLocked ? '🔒' : (ACTIVITY_ICON[a.type] || '📌')}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-comic font-extrabold text-[15px] ${isDone ? 'text-[#8A8A8A] line-through' : 'text-[#101A24]'}`}>{a.label}</div>
                <div className="text-xs font-bold text-[#8A8A8A] truncate">{a.subtitle}</div>
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8A6D1F] shrink-0">
                {isDone ? t.expeditionStatusCompleted : isLocked ? t.expeditionStatusLocked : t.expeditionMinutesShort.replace('{n}', a.minutes)}
              </span>
            </button>
          );
        })}
      </div>

      {nextAvailable && (
        <button
          onClick={() => setActiveActivity(nextAvailable)}
          className="btn-pro w-full bg-[#101A24] text-white hover:bg-[#0A1119] py-4 text-lg"
        >
          {nextAvailable.label}
        </button>
      )}
    </div>
  );
}
