import { Target, Lock, Play, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react';
import { translations as t } from '../translations';

export default function Dashboard({ profile, lessons, onSelectLesson, onNavigate }) {
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-12 pop-in w-full max-w-5xl mx-auto">
      {/* Hero */}
      <div className="card-brutal p-8 md:p-14 bg-[#FF90E8] text-[#111]">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
              <span className="block text-2xl md:text-3xl mb-2 opacity-90">{t.welcomeLabel}</span>
              {profile.username}
            </h1>
            <p className="text-xl md:text-2xl font-black opacity-80 uppercase tracking-widest">{t.welcomeSubtitle}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
            <div className="bg-white border-4 border-[#111] p-5 rounded-2xl shadow-[6px_6px_0_#111] flex flex-col items-center justify-center -rotate-2">
              <span className="text-4xl font-black text-[#111]">{profile.streak}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#111] bg-[#FFC900] border-2 border-[#111] px-2 py-0.5 rounded mt-2">{t.streakLabel}</span>
            </div>
            <div className="bg-[#111] border-4 border-[#111] p-5 rounded-2xl shadow-[6px_6px_0_#111] flex flex-col items-center justify-center rotate-3">
              <span className="text-4xl font-black text-white">{profile.level}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#111] bg-[#23A094] border-2 border-[#111] px-2 py-0.5 rounded mt-2">{t.levelLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button onClick={() => onNavigate('quiz')} className="btn-brutal bg-[#FFC900] py-6 flex flex-col items-center justify-center gap-2 group">
          <Target size={32} strokeWidth={3} className="text-[#111] group-hover:scale-110 transition-transform" />
          <span className="text-xl">{t.navQuiz}</span>
        </button>
        <button onClick={() => onNavigate('flashcards')} className="btn-brutal bg-[#23A094] text-white py-6 flex flex-col items-center justify-center gap-2 group">
          <div className="w-8 h-8 bg-white border-3 border-[#111] shadow-[2px_2px_0_#111] rounded group-hover:-translate-y-1 transition-transform" />
          <span className="text-xl">{t.navFlashcards}</span>
        </button>
        <button onClick={() => onNavigate('leaderboard')} className="btn-brutal bg-white text-[#111] py-6 flex flex-col items-center justify-center gap-2 group">
          <Trophy size={32} strokeWidth={3} className="text-[#FFC900] group-hover:scale-110 transition-transform" />
          <span className="text-xl">{t.navLeaderboard}</span>
        </button>
      </div>

      {/* Lessons */}
      <div>
        <h2 className="text-3xl font-black text-[#111] uppercase tracking-tighter mb-8 flex items-center gap-3">
          <span className="w-4 h-8 bg-[#111] inline-block -skew-x-12" /> {t.lessonsTitle}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((l, i) => {
            const isCompleted = l.isCompleted;
            const isUnlocked = l.isUnlocked;
            
            return (
              <div key={l.id} 
                className={`card-brutal p-6 flex flex-col justify-between transition-all duration-300 ${
                  !isUnlocked ? 'bg-[#F4F4F0] border-dashed border-[#888] shadow-none opacity-80' : 
                  isCompleted ? 'bg-white border-[#111]' : 
                  'bg-[#111] text-white border-[#111] -translate-y-1 shadow-[8px_8px_0_#FFC900]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 rounded ${
                      !isUnlocked ? 'bg-gray-200 text-gray-500 border-gray-400' :
                      isCompleted ? 'bg-[#23A094] text-white border-[#111]' : 
                      'bg-[#FF90E8] text-[#111] border-[#111]'
                    }`}>
                      {t.progressLabel} {i + 1}/{lessons.length}
                    </span>
                    {isCompleted && <CheckCircle2 size={24} strokeWidth={3} className="text-[#23A094]" />}
                    {!isUnlocked && <Lock size={20} strokeWidth={3} className="text-[#888]" />}
                  </div>
                  <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${!isUnlocked ? 'text-[#888]' : isCompleted ? 'text-[#111]' : 'text-white'}`}>
                    {l.title_vn}
                  </h3>
                </div>
                
                <button
                  onClick={() => isUnlocked && onSelectLesson(l)}
                  disabled={!isUnlocked}
                  className={`mt-8 py-3 px-4 rounded-xl font-black uppercase tracking-widest border-3 flex items-center justify-center gap-2 transition-all ${
                    !isUnlocked ? 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed' :
                    isCompleted ? 'bg-[#F4F4F0] text-[#111] border-[#111] shadow-[2px_2px_0_#111] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111]' :
                    'bg-[#FFC900] text-[#111] border-[#111] shadow-[4px_4px_0_#fff] hover:-translate-y-1 hover:shadow-[6px_6px_0_#fff] active:translate-y-1 active:translate-x-1 active:shadow-none'
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
