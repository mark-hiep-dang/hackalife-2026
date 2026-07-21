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
    <div className="min-h-screen bg-[#F4F1FB] flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r-3 border-[#101A24]/10 sticky top-0 h-screen shrink-0">
        <div className="p-7 pb-0">
          <button onClick={() => setTab('overview')} className="flex items-center gap-2 font-comic font-extrabold text-[21px] tracking-tight text-[#101A24]">
            <img src={llamaLogo} alt="" className="w-9 h-9 object-contain" />
            <span>Llama Tutor</span>
          </button>
          <p className="mt-1.5 mb-7 text-[11px] font-extrabold uppercase tracking-widest text-[#8B7BAE]">{t.studioTagline}</p>
        </div>

        <nav className="flex-1 px-5 flex flex-col gap-1.5 overflow-y-auto">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13.5px] font-extrabold transition-all text-left ${
                  active ? 'bg-[#E3D9F5] text-[#101A24] shadow-sm' : 'bg-white text-[#101A24] hover:bg-[#F9FAFB]'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.75 : 2} /> {label}
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t-2 border-[#101A24]/10 flex flex-col gap-2.5 mt-4">
          <div className="flex items-center gap-2.5">
            <div className="w-[38px] h-[38px] rounded-full bg-[#E3D9F5] flex items-center justify-center text-lg shrink-0">👤</div>
            <div className="min-w-0 flex-1">
              <div className="font-comic font-extrabold text-[13px] text-[#101A24] truncate">{profile?.username}</div>
              <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-[#8B7BAE]">{t.studioTrainerBadge}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setLang('vi')} className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${lang === 'vi' ? 'bg-[#EEF0F3] text-[#101A24]' : 'text-[#888]'}`}>VI</button>
              <button onClick={() => setLang('en')} className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${lang === 'en' ? 'bg-[#EEF0F3] text-[#101A24]' : 'text-[#888]'}`}>EN</button>
            </div>
          </div>
          <button onClick={handleExit} disabled={switching}
            className="w-full py-2.5 rounded-2xl bg-[#F9FAFB] flex items-center justify-center gap-2 text-[#101A24] hover:-translate-y-0.5 transition-transform font-comic font-bold text-xs disabled:opacity-50"
          >
            <ArrowLeftRight size={16} strokeWidth={3} /> {t.studioExitToLearner}
          </button>
          <button onClick={onLogout}
            className="w-full py-2.5 rounded-2xl bg-[#F9FAFB] flex items-center justify-center gap-2 text-[#D9695F] hover:-translate-y-0.5 transition-transform font-comic font-bold text-xs"
          >
            <LogOut size={16} strokeWidth={3} /> {t.logout}
          </button>
        </div>
      </aside>

      <header className="md:hidden bg-white border-b-3 border-[#101A24]/10 sticky top-0 z-50">
        <div className="px-4 h-16 flex items-center justify-between">
          <span className="flex items-center gap-2 font-comic font-extrabold text-lg text-[#101A24]"><img src={llamaLogo} className="w-7 h-7" alt="" />Llama Tutor</span>
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
