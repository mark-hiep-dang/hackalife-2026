import { useState } from 'react';
import { translations as t } from '../translations';
import { logout } from '../utils/api';
import { getMuteState, setMuteState } from '../utils/sound';
import { Settings as SettingsIcon, Volume2, VolumeX, LogOut, Database } from 'lucide-react';

export default function Settings({ profile, setSession, onMuteToggled }) {
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434');
  const [muted, setMuted] = useState(getMuteState());
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    localStorage.setItem('pang_chiu_ollama_url', ollamaUrl);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }
  function toggleMute() {
    const n = !muted; setMuted(n); setMuteState(n); onMuteToggled(n);
  }
  function handleLogout() { logout(); setSession(null); }

  const Section = ({ title, children }) => (
    <div className="mb-10">
      <p className="text-xs font-black text-[#111] bg-[#FFC900] border-2 border-[#111] inline-block px-4 py-1.5 rounded-lg shadow-[3px_3px_0_#111] uppercase tracking-widest mb-6 rotate-1">{title}</p>
      <div className="card-brutal p-8 md:p-10 bg-white">{children}</div>
    </div>
  );

  return (
    <div className="flex flex-col pop-in max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-16 h-16 bg-[#23A094] border-4 border-[#111] rounded-2xl flex items-center justify-center shadow-[6px_6px_0_#111] -rotate-3">
          <SettingsIcon size={36} strokeWidth={3} className="text-[#111]" />
        </div>
        <h2 className="text-5xl font-black text-[#111] uppercase tracking-tighter">{t.settingsTitle}</h2>
      </div>

      {saved && (
        <div className="bg-[#23A094] border-3 border-[#111] text-white text-base font-black uppercase tracking-widest px-5 py-4 rounded-xl mb-8 shadow-[6px_6px_0_#111]">
          ✓ Đã lưu cài đặt!
        </div>
      )}

      {/* Sound */}
      <Section title={t.soundLabel}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-base font-black text-[#111] uppercase tracking-widest mb-1">
              {muted ? <VolumeX size={24} strokeWidth={3} /> : <Volume2 size={24} strokeWidth={3} />}
              Hiệu ứng âm thanh
            </div>
            <p className="text-sm text-[#888] font-bold">Tắt để học trong tĩnh lặng</p>
          </div>
          
          <button onClick={toggleMute}
            className={`relative w-20 h-10 rounded-full border-4 transition-all shadow-[4px_4px_0_#111] ${muted ? 'bg-gray-300 border-[#111]' : 'bg-[#23A094] border-[#111]'}`}
          >
            <span className={`absolute top-0.5 w-7 h-7 rounded-full border-3 border-[#111] bg-white transition-all ${muted ? 'left-1' : 'left-10'}`} />
          </button>
        </div>
      </Section>

      {/* Ollama */}
      <Section title={t.connectionConfig}>
        <form onSubmit={handleSave}>
          <div className="flex items-center gap-3 text-base font-black text-[#111] uppercase tracking-widest mb-6">
            <Database size={24} strokeWidth={3} /> LLM Địa phương (Ollama)
          </div>
          <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
            className="input-brutal mb-6 text-lg py-4" placeholder="http://localhost:11434" />
          <button type="submit" className="btn-brutal w-full bg-[#FFC900] text-xl py-4">{t.saveConfig}</button>
        </form>
      </Section>

      {/* Logout */}
      <button onClick={handleLogout}
        className="btn-brutal w-full bg-white text-[#F24E1E] mt-4 py-5 text-xl"
      >
        <LogOut size={24} strokeWidth={3} /> {t.logout}
      </button>
    </div>
  );
}
