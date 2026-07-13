import { Target, Lock, Play, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react';
import { translations as t } from '../translations';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate }) {
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-12 pop-in w-full max-w-5xl mx-auto">
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

      {/* Lessons */}
      <div>
        <h2 className="text-3xl font-extrabold text-[#101A24] uppercase tracking-tighter mb-8 flex items-center gap-3">
          <span className="w-4 h-8 bg-[#101A24] inline-block -skew-x-12" /> {t.lessonsTitle}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((l, i) => {
            const isCompleted = l.isCompleted;
            const isUnlocked = l.isUnlocked;
            
            return (
              <div key={l.id} 
                className={`card-pro p-6 flex flex-col justify-between transition-all duration-300 ${
                  !isUnlocked ? 'bg-[#F9FAFB] border-dashed border-[#888] shadow-none opacity-80' : 
                  isCompleted ? 'bg-white border-[#101A24]/10' : 
                  'bg-[#101A24] text-white border-[#101A24]/10 -translate-y-1 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 border rounded ${
                      !isUnlocked ? 'bg-gray-200 text-gray-500 border-gray-400' :
                      isCompleted ? 'bg-[#2563EB] text-white border-[#101A24]/10' : 
                      'bg-[#9FE870] text-[#101A24] border-[#101A24]/10'
                    }`}>
                      {t.progressLabel} {i + 1}/{lessons.length}
                    </span>
                    {isCompleted && <CheckCircle2 size={24} strokeWidth={3} className="text-[#2563EB]" />}
                    {!isUnlocked && <Lock size={20} strokeWidth={3} className="text-[#888]" />}
                  </div>
                  <h3 className={`text-2xl font-extrabold uppercase tracking-tight mb-2 ${!isUnlocked ? 'text-[#888]' : isCompleted ? 'text-[#101A24]' : 'text-white'}`}>
                    {l.title_vn}
                  </h3>
                </div>
                
                <button
                  onClick={() => isUnlocked && onSelectLesson(l)}
                  disabled={!isUnlocked}
                  className={`mt-8 py-3 px-4 rounded-2xl font-extrabold uppercase tracking-widest border flex items-center justify-center gap-2 transition-all ${
                    !isUnlocked ? 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed' :
                    isCompleted ? 'bg-[#F9FAFB] text-[#101A24] border-[#101A24]/10 shadow-sm hover:-translate-y-0.5 hover:shadow-sm' :
                    'bg-[#00B4D8] text-[#101A24] border-[#101A24]/10 shadow-sm hover:-translate-y-1 hover:shadow-sm active:translate-y-1 active:translate-x-1 active:shadow-none'
                  }`}
                >
                  {isCompleted ? <><RotateCcw size={18} strokeWidth={3} /> {t.lessonCompletedBtn}</> :
                   isUnlocked ? <><Play size={18} strokeWidth={3} fill="currentColor" /> {t.lessonStartBtn}</> :
                   <><Lock size={18} strokeWidth={3} /> {t.lockedBtn}</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
