import { Target, Trophy } from 'lucide-react';
import { translations as t } from '../translations';
import { getDaysSinceLastStudy } from '../utils/streak';
import LlamaNag from './LlamaNag';
import LessonPath from './LessonPath';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate }) {
  if (!profile) return null;

  function handleStudyNow() {
    const nextLesson = lessons.find((l) => l.isUnlocked && !l.isCompleted);
    if (nextLesson) onSelectLesson(nextLesson);
    else onNavigate('quiz');
  }

  return (
    <div className="flex flex-col gap-12 pop-in w-full max-w-5xl mx-auto">
      <LlamaNag daysSince={getDaysSinceLastStudy()} onStudyNow={handleStudyNow} />

      {/* Hero */}
      <div className="card-pro p-8 md:p-14 bg-[#9FE870] text-[#101A24]">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter mb-4 leading-none">
              <span className="block text-2xl md:text-3xl mb-2 opacity-90">{t.welcomeLabel}</span>
              {profile.username}
            </h1>
            <p className="text-xl md:text-2xl font-extrabold opacity-80 uppercase tracking-widest">{t.welcomeSubtitle}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
            <div className="bg-white border border-[#101A24]/10 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center -rotate-2">
              <span className="text-4xl font-extrabold text-[#101A24]">{profile.streak}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#101A24] bg-[#00B4D8] border border-[#101A24]/10 px-2 py-0.5 rounded mt-2">{t.streakLabel}</span>
            </div>
            <div className="bg-[#101A24] border border-[#101A24]/10 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center rotate-3">
              <span className="text-4xl font-extrabold text-white">{profile.level}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#101A24] bg-[#2563EB] border border-[#101A24]/10 px-2 py-0.5 rounded mt-2">{t.levelLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button onClick={() => onNavigate('quiz')} className="btn-pro-primary bg-[#00B4D8] py-6 flex flex-col items-center justify-center gap-2 group">
          <Target size={32} strokeWidth={3} className="text-[#101A24] group-hover:scale-110 transition-transform" />
          <span className="text-xl">{t.navQuiz}</span>
        </button>
        <button onClick={() => onNavigate('flashcards')} className="btn-pro-primary bg-[#2563EB] text-white py-6 flex flex-col items-center justify-center gap-2 group">
          <div className="w-8 h-8 bg-white border border-[#101A24]/10 shadow-sm rounded group-hover:-translate-y-1 transition-transform" />
          <span className="text-xl">{t.navFlashcards}</span>
        </button>
        <button onClick={() => onNavigate('leaderboard')} className="btn-pro-primary bg-white text-[#101A24] py-6 flex flex-col items-center justify-center gap-2 group">
          <Trophy size={32} strokeWidth={3} className="text-[#00B4D8] group-hover:scale-110 transition-transform" />
          <span className="text-xl">{t.navLeaderboard}</span>
        </button>
      </div>

      {/* Lessons — Llama's climb to the MOF summit */}
      <div>
        <h2 className="text-3xl font-extrabold text-[#101A24] uppercase tracking-tighter mb-8 flex items-center gap-3">
          <span className="w-4 h-8 bg-[#101A24] inline-block -skew-x-12" /> Llama Cùng Bạn Tiến Đến Đỉnh MOF
        </h2>

        <LessonPath lessons={lessons} onSelectLesson={onSelectLesson} />
      </div>
    </div>
  );
}
