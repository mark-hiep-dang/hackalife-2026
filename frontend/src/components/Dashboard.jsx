import { useMemo } from 'react';
import { translations as t } from '../translations';
import { getDaysSinceLastStudy } from '../utils/streak';
import { getNagTier, getRandomWelcomeMessage } from '../nagMessages';
import LessonPath from './LessonPath';
import { LogOut } from 'lucide-react';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate, onLogout }) {
  const nagTier = useMemo(() => getNagTier(getDaysSinceLastStudy()), []);
  const welcomeMessage = useMemo(() => getRandomWelcomeMessage(), []);

  if (!profile) return null;

  function handleStudyNow() {
    const nextLesson = lessons.find((l) => l.isUnlocked && !l.isCompleted);
    if (nextLesson) onSelectLesson(nextLesson);
    else onNavigate('quiz');
  }

  const heroMessage = nagTier ? nagTier.message : welcomeMessage;

  return (
    <div className="flex flex-col gap-8 pop-in w-full max-w-5xl mx-auto">
      {/* Top row: greeting + quick stat pills */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="font-comic font-extrabold text-2xl md:text-[28px] text-[#101A24]">
          Xin chào, {profile.username}! 👋
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border-2 border-[#FFDD8A] rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#B5670A]" style={{ boxShadow: '0 3px 0 #FFDD8A' }}>
            <span className="text-lg">🔥</span>{profile.streak}
          </div>
          <div className="flex items-center gap-1.5 bg-white border-2 border-[#00B4D8] rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#0E7C99]" style={{ boxShadow: '0 3px 0 #00B4D8' }}>
            <span className="text-lg">💎</span>{profile.xp} XP
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 border-none cursor-pointer bg-white border-2 border-[#101A24]/10 rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#101A24] transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: '0 3px 0 rgba(16,26,36,0.15)' }}
            >
              <LogOut size={16} strokeWidth={3} />{t.logout}
            </button>
          )}
        </div>
      </div>

      {/* Hero card — Llama's message of the day + streak/level */}
      <button
        onClick={handleStudyNow}
        className="relative text-left rounded-[2rem] px-6 py-6 md:px-8 overflow-hidden pop-in flex items-center justify-between gap-5 flex-wrap sm:flex-nowrap"
        style={{
          background: 'linear-gradient(120deg, #9FE870 0%, #C4F49A 100%)',
          boxShadow: '0 8px 0 #6BAE2E, 0 14px 30px -10px rgba(16,26,36,0.2)'
        }}
      >
        <div className="relative z-10 flex-1 min-w-0">
          <div className="inline-block bg-white rounded-[20px] rounded-bl-md px-4 md:px-5 py-3 font-comic font-extrabold text-base md:text-lg text-[#101A24] shadow-sm max-w-full">
            {heroMessage}
          </div>
        </div>

        <div className="relative z-10 flex gap-3 shrink-0">
          <div className="bg-white rounded-2xl px-5 py-3 text-center shadow-sm" style={{ minWidth: '80px' }}>
            <div className="font-comic font-extrabold text-2xl text-[#101A24]">🔥 {profile.streak}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#00B4D8] mt-0.5">{t.streakLabel}</div>
          </div>
        </div>
      </button>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('quiz')}
          className="border-none cursor-pointer bg-[#00B4D8] rounded-3xl py-5 px-3 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-1 hover:-rotate-1 active:translate-y-1"
          style={{ boxShadow: '0 6px 0 #0E7C99' }}
        >
          <span className="text-3xl">🎯</span>
          <span className="font-comic font-bold text-sm text-[#101A24]">{t.navQuiz}</span>
        </button>
        <button
          onClick={() => onNavigate('flashcards')}
          className="border-none cursor-pointer bg-[#2563EB] rounded-3xl py-5 px-3 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-1 hover:rotate-1 active:translate-y-1"
          style={{ boxShadow: '0 6px 0 #17408F' }}
        >
          <span className="text-3xl">🗂️</span>
          <span className="font-comic font-bold text-sm text-white">{t.navFlashcards}</span>
        </button>
        <button
          onClick={() => onNavigate('leaderboard')}
          className="border-2 border-[#101A24]/10 cursor-pointer bg-white rounded-3xl py-5 px-3 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-1 hover:-rotate-1 active:translate-y-1"
          style={{ boxShadow: '0 6px 0 rgba(16,26,36,0.15)' }}
        >
          <span className="text-3xl">🏆</span>
          <span className="font-comic font-bold text-sm text-[#101A24]">{t.navLeaderboard}</span>
        </button>
      </div>

      {/* Lessons — Llama's climb to the MOF summit */}
      <div>
        <h2 className="font-comic font-extrabold text-xl text-[#101A24] uppercase tracking-wide mb-1 flex items-center gap-2">
          <span>⛰️</span> Llama cùng bạn tiến đến đỉnh MOF
        </h2>
        <p className="text-sm font-bold text-[#8A8A8A] mb-4">Bấm vào từng trại để xem nội dung nhé!</p>

        <LessonPath lessons={lessons} onSelectLesson={onSelectLesson} />
      </div>
    </div>
  );
}
