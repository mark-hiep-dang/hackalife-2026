import { useState } from 'react';
import { login, register } from '../utils/api';
import { translations as t } from '../translations';
import { playPang } from '../utils/sound';
import { Target } from 'lucide-react';

export default function Auth({ setSession }) {
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
      const user = isRegister ? await register(username, password) : await login(username, password);
      playPang(); setSession(user);
    } catch (err) { setError(err.message || 'Nope, try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-16">
      <div className="w-full max-w-lg pop-in">
        
        <div className="card-pro p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#9FE870] border border-[#101A24]/10 rounded-2xl flex items-center justify-center shadow-sm -rotate-3">
              <Target size={32} strokeWidth={3} className="text-[#101A24]" />
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-[#101A24] tracking-tight mb-2 uppercase">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h1>
          <p className="text-sm text-[#101A24] font-bold mb-8">{t.tagline}</p>

          {error && (
            <div className="bg-[#EF4444] border border-[#101A24]/10 text-white text-sm font-bold px-4 py-3 rounded-lg mb-6 shadow-sm uppercase tracking-wider">
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
              className="text-sm font-extrabold text-[#101A24] border-b-3 border-[#101A24]/10 hover:text-[#9FE870] hover:border-[#9FE870] transition-colors pb-0.5"
            >
              {isRegister ? t.switchLogin : t.switchRegister}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
