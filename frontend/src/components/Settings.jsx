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
      <p className="text-xs font-extrabold text-[#101A24] bg-[#B9E7EF] border border-[#101A24]/10 inline-block px-4 py-1.5 rounded-lg shadow-sm uppercase tracking-widest mb-6 rotate-1">{title}</p>
      <div className="card-pro p-8 md:p-10 bg-white">{children}</div>
    </div>
  );

  return (
    <div className="flex flex-col pop-in max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-16 h-16 bg-[#C7D7F7] border border-[#101A24]/10 rounded-2xl flex items-center justify-center shadow-sm -rotate-3">
          <SettingsIcon size={36} strokeWidth={3} className="text-[#101A24]" />
        </div>
        <h2 className="text-5xl font-extrabold text-[#101A24] uppercase tracking-tighter">{t.settingsTitle}</h2>
      </div>

      {saved && (
        <div className="bg-[#C7EFC4] border border-[#101A24]/10 text-[#2F5C37] text-base font-extrabold uppercase tracking-widest px-5 py-4 rounded-2xl mb-8 shadow-sm">
          ✓ Đã lưu cài đặt!
        </div>
      )}

      {/* Sound */}
      <Section title={t.soundLabel}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-base font-extrabold text-[#101A24] uppercase tracking-widest mb-1">
              {muted ? <VolumeX size={24} strokeWidth={3} /> : <Volume2 size={24} strokeWidth={3} />}
              Hiệu ứng âm thanh
            </div>
            <p className="text-sm text-[#888] font-bold">Tắt để học trong tĩnh lặng</p>
          </div>
          
          <button onClick={toggleMute}
            className={`relative w-20 h-10 rounded-full border transition-all shadow-sm ${muted ? 'bg-gray-300 border-[#101A24]/10' : 'bg-[#7C9AE0] border-[#101A24]/10'}`}
          >
            <span className={`absolute top-0.5 w-7 h-7 rounded-full border border-[#101A24]/10 bg-white transition-all ${muted ? 'left-1' : 'left-10'}`} />
          </button>
        </div>
      </Section>

      {/* Ollama */}
      <Section title={t.connectionConfig}>
        <form onSubmit={handleSave}>
          <div className="flex items-center gap-3 text-base font-extrabold text-[#101A24] uppercase tracking-widest mb-6">
            <Database size={24} strokeWidth={3} /> LLM Địa phương (Ollama)
          </div>
          <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
            className="input-pro mb-6 text-lg py-4" placeholder="http://localhost:11434" />
          <button type="submit" className="btn-pro bg-[#B9E7EF] text-[#20606E] hover:bg-[#A8DEE8] w-full text-xl py-4">{t.saveConfig}</button>
        </form>
      </Section>

      {/* Logout */}
      <button onClick={handleLogout}
        className="btn-pro bg-white text-[#D9695F] border border-[#101A24]/10 w-full mt-4 py-5 text-xl"
      >
        <LogOut size={24} strokeWidth={3} /> {t.logout}
      </button>
    </div>
  );
}
