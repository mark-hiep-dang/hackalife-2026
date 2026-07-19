import { useState, useEffect } from 'react';
import { useT, useLanguage } from '../translations';
import { logout, getPreferences, updatePreferences } from '../utils/api';
import { getMuteState, setMuteState } from '../utils/sound';
import { Settings as SettingsIcon, Volume2, VolumeX, LogOut, Database, Compass, GraduationCap } from 'lucide-react';
import { switchRole } from '../utils/studioApi';

const DAILY_MINUTES_OPTIONS = [10, 15, 20, 30, 45, 60];

export default function Settings({ profile, setSession, onMuteToggled, onRoleChanged }) {
  const t = useT();
  const { lang, setLang } = useLanguage();
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434');
  const [muted, setMuted] = useState(getMuteState());
  const [saved, setSaved] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const [prefs, setPrefs] = useState(null);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    getPreferences().then(setPrefs).catch(() => {});
  }, []);

  function handleSave(e) {
    e.preventDefault();
    localStorage.setItem('pang_chiu_ollama_url', ollamaUrl);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }
  function toggleMute() {
    const n = !muted; setMuted(n); setMuteState(n); onMuteToggled(n);
  }
  function handleLogout() { logout(); setSession(null); }

  async function handleEnterStudio() {
    setSwitchingRole(true);
    try { await switchRole('trainer'); onRoleChanged(); } finally { setSwitchingRole(false); }
  }

  async function handleSavePrefs(e) {
    e.preventDefault();
    try {
      await updatePreferences({
        examDate: prefs.exam_date,
        dailyMinutes: prefs.daily_minutes,
        targetScore: prefs.target_score,
        experienceLevel: prefs.experience_level,
        preferredFormat: prefs.preferred_format,
        goal: prefs.goal
      });
      setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  }

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
          ✓ {t.settingsSaved}
        </div>
      )}

      {/* Language */}
      <Section title={t.languageLabel}>
        <div className="flex gap-3">
          <button
            onClick={() => setLang('vi')}
            className={`flex-1 py-3.5 rounded-xl font-comic font-extrabold text-base transition-all ${lang === 'vi' ? 'bg-[#7C9AE0] text-white shadow-sm' : 'bg-[#EEF0F3] text-[#101A24]'}`}
          >
            🇻🇳 Tiếng Việt
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-3.5 rounded-xl font-comic font-extrabold text-base transition-all ${lang === 'en' ? 'bg-[#7C9AE0] text-white shadow-sm' : 'bg-[#EEF0F3] text-[#101A24]'}`}
          >
            🇬🇧 English
          </button>
        </div>
      </Section>

      {/* Personalized Expedition preferences */}
      {prefs && (
        <Section title={t.expeditionPrefsTitle}>
          <form onSubmit={handleSavePrefs} className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-base font-extrabold text-[#101A24] uppercase tracking-widest mb-1">
              <Compass size={24} strokeWidth={3} />
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest">{t.examDateLabel}</span>
              <input
                type="date"
                value={prefs.exam_date || ''}
                onChange={(e) => setPrefs((p) => ({ ...p, exam_date: e.target.value }))}
                className="input-pro py-3"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest">{t.dailyMinutesLabel}</span>
              <div className="flex flex-wrap gap-2">
                {DAILY_MINUTES_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, daily_minutes: m }))}
                    className={`px-4 py-2.5 rounded-xl font-comic font-extrabold text-sm transition-all ${prefs.daily_minutes === m ? 'bg-[#7C9AE0] text-white' : 'bg-[#EEF0F3] text-[#101A24]'}`}
                  >
                    {t.expeditionMinutesShort.replace('{n}', m)}
                  </button>
                ))}
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest">{t.targetScoreLabel}</span>
              <input
                type="number" min={0} max={100}
                value={prefs.target_score ?? 70}
                onChange={(e) => setPrefs((p) => ({ ...p, target_score: Number(e.target.value) }))}
                className="input-pro py-3"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest">{t.experienceLevelLabel}</span>
              <select
                value={prefs.experience_level || 'new'}
                onChange={(e) => setPrefs((p) => ({ ...p, experience_level: e.target.value }))}
                className="input-pro py-3"
              >
                <option value="new">{t.experience_new}</option>
                <option value="under1">{t.experience_under1}</option>
                <option value="1to3">{t.experience_1to3}</option>
                <option value="over3">{t.experience_over3}</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest">{t.preferredFormatLabel}</span>
              <select
                value={prefs.preferred_format || 'quiz'}
                onChange={(e) => setPrefs((p) => ({ ...p, preferred_format: e.target.value }))}
                className="input-pro py-3"
              >
                <option value="quick">{t.format_quick}</option>
                <option value="flashcard">{t.format_flashcard}</option>
                <option value="quiz">{t.format_quiz}</option>
                <option value="scenario">{t.format_scenario}</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-[#101A24] uppercase tracking-widest">{t.goalLabel}</span>
              <select
                value={prefs.goal || 'pass'}
                onChange={(e) => setPrefs((p) => ({ ...p, goal: e.target.value }))}
                className="input-pro py-3"
              >
                <option value="pass">{t.goal_pass}</option>
                <option value="good">{t.goal_good}</option>
                <option value="mastery">{t.goal_mastery}</option>
              </select>
            </label>

            <button type="submit" className="btn-pro bg-[#C7D7F7] text-[#2E4A9E] hover:bg-[#B5C7F0] w-full text-xl py-4">
              {prefsSaved ? `✓ ${t.settingsSaved}` : t.savePrefsBtn}
            </button>
          </form>
        </Section>
      )}

      {/* Sound */}
      <Section title={t.soundLabel}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-base font-extrabold text-[#101A24] uppercase tracking-widest mb-1">
              {muted ? <VolumeX size={24} strokeWidth={3} /> : <Volume2 size={24} strokeWidth={3} />}
              {t.soundEffectsLabel}
            </div>
            <p className="text-sm text-[#888] font-bold">{t.soundEffectsDesc}</p>
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
            <Database size={24} strokeWidth={3} /> {t.localLlmLabel}
          </div>
          <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
            className="input-pro mb-6 text-lg py-4" placeholder="http://localhost:11434" />
          <button type="submit" className="btn-pro bg-[#B9E7EF] text-[#20606E] hover:bg-[#A8DEE8] w-full text-xl py-4">{t.saveConfig}</button>
        </form>
      </Section>

      {/* Llama Studio access */}
      <Section title="Llama Studio">
        <div className="flex items-center gap-3 text-base font-extrabold text-[#101A24] uppercase tracking-widest mb-3">
          <GraduationCap size={24} strokeWidth={3} /> Chế độ trainer
        </div>
        <p className="text-sm text-[#888] font-bold mb-5">Chuyển sang Llama Studio để dựng giáo trình, soạn nội dung và theo dõi học viên. Đây là chế độ demo, bạn có thể quay lại app học viên bất cứ lúc nào.</p>
        <button onClick={handleEnterStudio} disabled={switchingRole}
          className="btn-pro bg-[#E3D9F5] text-[#101A24] hover:bg-[#D6C7EE] w-full text-lg py-4 disabled:opacity-50"
        >
          {switchingRole ? 'Đang chuyển…' : 'Vào Llama Studio'}
        </button>
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
