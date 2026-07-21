import { useState } from 'react';
import { LayoutDashboard, GraduationCap, Users2, LogOut, ArrowLeftRight } from 'lucide-react';
import llamaLogo from '../assets/llama-logo.png';
import { switchRole } from '../utils/studioApi';
import { useT, useLanguage } from '../translations';

import Overview from './screens/Overview';
import Courses from './screens/Courses';
import LearnersAndExams from './screens/LearnersAndExams';
import TrainerCopilot from './components/TrainerCopilot';

function getNav(t) {
  return [
    { id: 'overview', icon: LayoutDashboard, label: t.studioNavOverview },
    { id: 'courses', icon: GraduationCap, label: t.studioNavCourses },
    { id: 'learners-exams', icon: Users2, label: t.studioNavLearnersExams }
  ];
}

export default function StudioApp({ profile, onExitStudio, onLogout }) {
  const t = useT();
  const { lang, setLang } = useLanguage();
  const NAV = getNav(t);
  const [tab, setTab] = useState('overview');
  const [switching, setSwitching] = useState(false);

  async function handleExit() {
    setSwitching(true);
    try {
      await switchRole('learner');
      onExitStudio();
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#E6F7EF] flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r-3 border-[#101A24]/10 sticky top-0 h-screen shrink-0">
        <div className="p-6 border-b-3 border-[#101A24]/10">
          <button onClick={() => setTab('overview')} className="flex items-center gap-2 font-comic font-extrabold text-2xl tracking-tight text-[#101A24]">
            <img src={llamaLogo} alt="" className="w-9 h-9 object-contain" />
            <span>Llama Trainer</span>
          </button>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[#8B7BAE]">{t.studioTagline}</p>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold uppercase tracking-wide transition-all border text-left ${
                  active
                    ? 'bg-[#E3D9F5] border-[#101A24]/10 text-[#101A24] shadow-sm -translate-y-0.5 -translate-x-0.5'
                    : 'bg-white border-transparent text-[#101A24] hover:border-[#101A24]/10 hover:shadow-sm'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.75 : 2} /> {label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t-3 border-[#101A24]/10 bg-[#EEF0F3] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{profile?.username} · {t.studioTrainerBadge}</span>
            <div className="flex gap-1">
              <button onClick={() => setLang('vi')} className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${lang === 'vi' ? 'bg-white text-[#101A24]' : 'text-[#888]'}`}>VI</button>
              <button onClick={() => setLang('en')} className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${lang === 'en' ? 'bg-white text-[#101A24]' : 'text-[#888]'}`}>EN</button>
            </div>
          </div>
          <button onClick={handleExit} disabled={switching}
            className="w-full py-2 rounded-lg border border-[#101A24]/10 bg-white shadow-sm flex items-center justify-center gap-2 text-[#101A24] hover:bg-[#B9E7EF] transition-colors font-extrabold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <ArrowLeftRight size={16} strokeWidth={3} /> {t.studioExitToLearner}
          </button>
          <button onClick={onLogout}
            className="w-full py-2 rounded-lg border border-[#101A24]/10 bg-white shadow-sm flex items-center justify-center gap-2 text-[#D9695F] hover:bg-[#F7D2CC] transition-colors font-extrabold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} strokeWidth={3} /> {t.logout}
          </button>
        </div>
      </aside>

      <header className="md:hidden bg-white border-b-3 border-[#101A24]/10 sticky top-0 z-50">
        <div className="px-4 h-16 flex items-center justify-between">
          <span className="flex items-center gap-2 font-comic font-extrabold text-lg text-[#101A24]"><img src={llamaLogo} className="w-7 h-7" alt="" />Trainer</span>
          <div className="flex items-center gap-2">
            <button onClick={handleExit} className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#101A24]/10 bg-white flex items-center gap-1">
              <ArrowLeftRight size={14} /> {t.modeLearner}
            </button>
            <button onClick={onLogout} className="w-8 h-8 rounded-lg border border-[#101A24]/10 bg-white flex items-center justify-center text-[#D9695F]">
              <LogOut size={14} />
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto gap-2 px-3 pb-3">
          {NAV.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${tab === id ? 'bg-[#E3D9F5] border-[#101A24]/10' : 'bg-white border-[#101A24]/10'}`}
            >{label}</button>
          ))}
        </div>
      </header>

      <main className="flex-1 w-full overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
          {tab === 'overview' && <Overview onNavigate={setTab} />}
          {tab === 'courses' && <Courses />}
          {tab === 'learners-exams' && <LearnersAndExams />}
        </div>
      </main>
      <TrainerCopilot />
    </div>
  );
}
