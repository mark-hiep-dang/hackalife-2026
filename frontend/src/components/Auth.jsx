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
        
        <div className="card-brutal p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#FF90E8] border-3 border-[#111] rounded-xl flex items-center justify-center shadow-[4px_4px_0_#111] -rotate-3">
              <Target size={32} strokeWidth={3} className="text-[#111]" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-[#111] tracking-tight mb-2 uppercase">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h1>
          <p className="text-sm text-[#111] font-bold mb-8">{t.tagline}</p>

          {error && (
            <div className="bg-[#F24E1E] border-3 border-[#111] text-white text-sm font-bold px-4 py-3 rounded-lg mb-6 shadow-[2px_2px_0_#111] uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            <div>
              <label className="block text-xs font-black text-[#111] uppercase tracking-widest mb-2">{t.usernameLabel}</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-brutal"
                placeholder="agent_007"
                disabled={loading} required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#111] uppercase tracking-widest mb-2">{t.passwordLabel}</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-brutal"
                placeholder="••••••••"
                disabled={loading} required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-brutal w-full mt-4 text-xl">
              {loading ? '...' : (isRegister ? t.registerBtn : t.loginBtn)}
            </button>
          </form>

          <p className="text-center mt-8">
            <button
              onClick={() => { setIsRegister(r => !r); setError(''); }}
              className="text-sm font-black text-[#111] border-b-3 border-[#111] hover:text-[#FF90E8] hover:border-[#FF90E8] transition-colors pb-0.5"
            >
              {isRegister ? t.switchLogin : t.switchRegister}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
