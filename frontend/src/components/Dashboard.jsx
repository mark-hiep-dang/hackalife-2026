import { useMemo, useState } from 'react';
import { translations as t } from '../translations';
import { getDaysSinceLastStudy } from '../utils/streak';
import { getNagTier, getRandomWelcomeMessage, getLlamaAnimation } from '../nagMessages';
import LessonPath from './LessonPath';
import { LogOut } from 'lucide-react';
import llamaMoodChill from '../assets/llama-mood-chill.webp';
import llamaMoodCozy from '../assets/llama-mood-cozy.webp';
import llamaMoodIdle from '../assets/llama-mood-idle.webp';
import llamaMoodSleepy from '../assets/llama-mood-sleepy.webp';
import llamaMoodZombie from '../assets/llama-mood-zombie.webp';
import llamaMoodReturn from '../assets/llama-mood-return.webp';
import llamaMoodAngry from '../assets/llama-mood-angry.webp';
import llamaMoodFire from '../assets/quiz-mode-select.webp';
import PathSelection from './PathSelection';

// Maps each getLlamaAnimation() state to the matching mascot art — llama-chill
// and llama-zombie still reuse the older mood renders since there's no
// dedicated professor-style art for those yet.
const LLAMA_MOOD_IMAGES = {
  'llama-chill': llamaMoodChill,
  'llama-cozy': llamaMoodCozy,
  'llama-fire': llamaMoodFire,
  'llama-sleepy': llamaMoodSleepy,
  'llama-zombie': llamaMoodZombie,
  'llama-return': llamaMoodReturn,
  'llama-angry-return': llamaMoodAngry,
};

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate, onLogout }) {
  const [showPathSelect, setShowPathSelect] = useState(false);
  const daysAbsent = getDaysSinceLastStudy();
  const nagTier = useMemo(() => getNagTier(daysAbsent), [daysAbsent]);
  const welcome = useMemo(() => getRandomWelcomeMessage(), []);
  const llamaAnim = useMemo(() => getLlamaAnimation({ daysAbsent, streak: profile?.streak ?? 0 }), [daysAbsent, profile?.streak]);

  if (!profile) return null;

  function handleStudyNow() {
    const nextLesson = lessons.find((l) => l.isUnlocked && !l.isCompleted);
    if (nextLesson) onSelectLesson(nextLesson);
    else onNavigate('quiz');
  }

  const heroMessage = nagTier ? nagTier.message : welcome.message;

  return (
    <div className="flex flex-col gap-8 pop-in w-full max-w-5xl mx-auto">
      {/* Top row: llama greeting bubble + quick stat pills */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={handleStudyNow}
          className="border-none cursor-pointer bg-transparent flex items-center gap-3 flex-1 min-w-[240px] text-left"
        >
          <img
            src={LLAMA_MOOD_IMAGES[llamaAnim] || llamaMoodIdle}
            alt="Llama"
            className={`w-14 h-14 rounded-full object-cover border-[3px] border-[#FCE7A8] shadow-sm shrink-0 ${llamaAnim}`}
          />
          <div className="flex-1 min-w-0 bg-white rounded-[20px] rounded-bl-md px-4 py-2.5 font-comic font-extrabold text-base text-[#101A24] shadow-sm">
            {heroMessage}
          </div>
        </button>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setShowPathSelect(true)}
            className="flex items-center gap-1.5 bg-white border-2 border-[#101A24]/10 rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#101A24] shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-transform"
          >
            <span className="text-lg">🎯</span> {profile.selected_path || 'MOF'}
          </button>
          <div className="flex items-center gap-1.5 bg-white border-2 border-[#FCE7A8] rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#B8912E] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <span className="text-lg">🔥</span>{profile.streak}
          </div>
          <div className="flex items-center gap-1.5 bg-white border-2 border-[#B9E7EF] rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#3B93A8] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <span className="text-lg">💎</span>{profile.xp} XP
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 border-none cursor-pointer bg-white border-2 border-[#101A24]/10 rounded-full px-3.5 py-2 font-comic font-bold text-sm text-[#101A24] transition-transform hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
            >
              <LogOut size={16} strokeWidth={3} />{t.logout}
            </button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('quiz')}
          className="border-none cursor-pointer bg-[#B9E7EF] rounded-3xl py-5 px-3 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-1 hover:-rotate-1 active:translate-y-0.5 shadow-[0_6px_18px_rgba(59,147,168,0.2)]"
        >
          <span className="text-3xl">🎯</span>
          <span className="font-comic font-bold text-sm text-[#101A24]">{t.navQuiz}</span>
        </button>
        <button
          onClick={() => onNavigate('flashcards')}
          className="border-none cursor-pointer bg-[#C7D7F7] rounded-3xl py-5 px-3 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-1 hover:rotate-1 active:translate-y-0.5 shadow-[0_6px_18px_rgba(76,111,196,0.2)]"
        >
          <span className="text-3xl">🗂️</span>
          <span className="font-comic font-bold text-sm text-[#101A24]">{t.navFlashcards}</span>
        </button>
        <button
          onClick={() => onNavigate('leaderboard')}
          className="border-none cursor-pointer bg-[#C7EFC4] rounded-3xl py-5 px-3 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-1 hover:-rotate-1 active:translate-y-0.5 shadow-[0_6px_18px_rgba(79,154,90,0.2)]"
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

      {showPathSelect && (
        <PathSelection 
          onSelect={(path) => { 
            profile.selected_path = path; 
            setShowPathSelect(false); 
          }} 
          isCancellable={true} 
          onCancel={() => setShowPathSelect(false)} 
        />
      )}
    </div>
  );
}
