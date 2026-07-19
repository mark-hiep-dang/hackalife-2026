import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { askCopilot } from '../../utils/studioApi';
import llamaLogo from '../../assets/llama-logo.png';
import { useT } from '../../translations';

const SUGGESTIONS = [
  'Chủ đề nào học viên yếu nhất?',
  'Câu hỏi nào có tỷ lệ sai cao nhất?',
  'Tóm tắt tiến độ nhóm học tuần này',
  'Có cụm nhầm lẫn nào cần xử lý không?',
  'Giải thích vì sao chặng này bị cảnh báo',
  'Đề xuất cách cải thiện câu hỏi này'
];

export default function TrainerCopilot() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const result = await askCopilot(message, {});
      setMessages((m) => [...m, { role: 'llama', text: result.answer, grounded: result.grounded }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'llama', text: 'Llama vừa gặp trục trặc, thử lại giúp Llama nhé.' }]);
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#101A24] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50">
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-w-[90vw] h-[520px] max-h-[75vh] bg-white rounded-3xl border-3 border-[#101A24]/10 shadow-xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b-3 border-[#101A24]/10">
        <span className="flex items-center gap-2 font-extrabold text-[#101A24]"><img src={llamaLogo} className="w-7 h-7" alt="" /> {t.studioAskLlama}</span>
        <button onClick={() => setOpen(false)} className="text-[#888] hover:text-[#101A24]"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#888]">{t.studioSuggestedQuestions}</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-left text-sm px-3 py-2 rounded-xl bg-[#F5F6F8] hover:bg-[#EEF0F3] text-[#101A24]">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'self-end bg-[#E3D9F5] text-[#101A24]' : 'self-start bg-[#F5F6F8] text-[#101A24]'}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="self-start text-sm text-[#888]">Llama đang suy nghĩ…</div>}
      </div>
      <div className="p-3 border-t-3 border-[#101A24]/10 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t.studioAskPlaceholder} className="flex-1 px-3 py-2 rounded-xl border border-[#101A24]/15 text-sm" />
        <button onClick={() => send()} disabled={busy} className="w-10 h-10 rounded-xl bg-[#101A24] text-white flex items-center justify-center disabled:opacity-40"><Send size={16} /></button>
      </div>
    </div>
  );
}
