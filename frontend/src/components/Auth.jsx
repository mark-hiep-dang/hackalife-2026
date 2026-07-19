import { useState } from 'react';
import { login, register } from '../utils/api';
import { switchRole } from '../utils/studioApi';
import { useT, useLanguage } from '../translations';
import { playPang } from '../utils/sound';
import llamaLogo from '../assets/llama-logo.png';
import { GraduationCap, Backpack } from 'lucide-react';

export default function Auth({ setSession }) {
  const t = useT();
  const { lang, setLang } = useLanguage();
  const [mode, setMode] = useState('learner');
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Fill it out, please.'); return; }
    setError(''); setLoading(true);
    try {
      let user = isRegister ? await register(username, password) : await login(username, password);
      if (user.role !== mode) {
        await switchRole(mode);
        user = { ...user, role: mode };
      }
      playPang(); setSession(user);
    } catch (err) { setError(err.message || 'Nope, try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-16">
      <div className="w-full max-w-lg pop-in">

        <div className="card-pro p-8 md:p-10 text-center">
          <div className="flex justify-end gap-2 mb-2">
            <button type="button" onClick={() => setLang('vi')} className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${lang === 'vi' ? 'bg-[#EEF0F3] text-[#101A24]' : 'text-[#888]'}`}>VI</button>
            <button type="button" onClick={() => setLang('en')} className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${lang === 'en' ? 'bg-[#EEF0F3] text-[#101A24]' : 'text-[#888]'}`}>EN</button>
          </div>
          <div className="flex justify-center mb-6">
            <img src={llamaLogo} alt="LLAMA" className="w-24 h-24 object-contain -rotate-3" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-[#101A24] tracking-tight mb-2 uppercase">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h1>
          <p className="text-sm text-[#101A24] font-bold mb-6">{t.tagline}</p>

          <div className="flex gap-2 mb-8 bg-[#EEF0F3] rounded-2xl p-1.5">
            <button
              type="button"
              onClick={() => setMode('learner')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all ${mode === 'learner' ? 'bg-white text-[#101A24] shadow-sm' : 'text-[#888]'}`}
            >
              <Backpack size={16} strokeWidth={2.5} /> {t.modeLearner}
            </button>
            <button
              type="button"
              onClick={() => setMode('trainer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all ${mode === 'trainer' ? 'bg-white text-[#101A24] shadow-sm' : 'text-[#888]'}`}
            >
              <GraduationCap size={16} strokeWidth={2.5} /> {t.modeTrainer}
            </button>
          </div>

          {error && (
            <div className="bg-[#F7D2CC] border border-[#101A24]/10 text-[#B4443B] text-sm font-bold px-4 py-3 rounded-lg mb-6 shadow-sm uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            <div>
              <label className="block text-xs font-extrabold text-[#101A24] uppercase tracking-widest mb-2">{t.usernameLabel}</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-pro"
                placeholder="agent_007"
                disabled={loading} required
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#101A24] uppercase tracking-widest mb-2">{t.passwordLabel}</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-pro"
                placeholder="••••••••"
                disabled={loading} required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-pro-primary w-full mt-4 text-xl">
              {loading ? '...' : (isRegister ? t.registerBtn : t.loginBtn)}
            </button>
          </form>

          <p className="text-center mt-8">
            <button
              onClick={() => { setIsRegister(r => !r); setError(''); }}
              className="text-sm font-extrabold text-[#101A24] border-b-3 border-[#101A24]/10 hover:text-[#4F9A5A] hover:border-[#C7EFC4] transition-colors pb-0.5"
            >
              {isRegister ? t.registerToggle : t.loginToggle}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
