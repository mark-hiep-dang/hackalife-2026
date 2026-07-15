import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getKnowledgeDocs, uploadKnowledgeFile, pasteKnowledgeText, deleteKnowledgeDoc } from '../utils/api';
import { translations as t } from '../translations';
import { Send, BookOpen, Upload, FileText, Trash2, X, Loader2 } from 'lucide-react';
import llamaWalk from '../assets/llama-walk.webp';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const [showKnowledge, setShowKnowledge] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function loadDocs() {
    setDocsLoading(true); setDocsError('');
    try { setDocs(await getKnowledgeDocs()); }
    catch (e) { setDocsError(e.message || 'Lỗi tải danh sách tài liệu'); }
    finally { setDocsLoading(false); }
  }

  function toggleKnowledge() {
    const next = !showKnowledge;
    setShowKnowledge(next);
    if (next) loadDocs();
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput(''); setLoading(true); setError('');

    try {
      const reply = await sendChatMessage(text, history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message || 'Llama không trả lời được, thử lại nhé');
    } finally {
      setLoading(false);
    }
  }

  async function handleFilePicked(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true); setDocsError('');
    try { await uploadKnowledgeFile(file); await loadDocs(); }
    catch (err) { setDocsError(err.message || 'Lỗi tải file'); }
    finally { setSaving(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function handlePasteSave() {
    if (!pasteText.trim()) return;
    setSaving(true); setDocsError('');
    try {
      await pasteKnowledgeText(pasteTitle, pasteText);
      setPasteTitle(''); setPasteText('');
      await loadDocs();
    } catch (err) { setDocsError(err.message || 'Lỗi lưu tài liệu'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteKnowledgeDoc(id); await loadDocs(); }
    catch (err) { setDocsError(err.message || 'Lỗi xóa tài liệu'); }
  }

  return (
    <div className="flex flex-col gap-6 pop-in max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#101A24] uppercase tracking-tighter">{t.chatTitle}</h2>
          <p className="text-sm font-bold text-[#888] mt-1">{t.chatSubtitle}</p>
        </div>
        <button onClick={toggleKnowledge} className="btn-pro-secondary py-3 px-4 shrink-0">
          <BookOpen size={18} strokeWidth={3} /> {t.knowledgeTitle}
        </button>
      </div>

      {/* Knowledge panel */}
      {showKnowledge && (
        <div className="card-pro p-6 md:p-8 bg-white scale-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-extrabold text-[#101A24] uppercase tracking-tight">{t.knowledgeTitle}</h3>
            <button onClick={() => setShowKnowledge(false)} className="text-[#888] hover:text-[#101A24]">
              <X size={22} strokeWidth={3} />
            </button>
          </div>
          <p className="text-sm font-bold text-[#888] mb-6">{t.knowledgeSubtitle}</p>

          {docsError && (
            <div className="bg-[#EF4444] border border-[#101A24]/10 text-white text-sm font-bold px-4 py-3 rounded-lg mb-4 shadow-sm">
              {docsError}
            </div>
          )}

          {/* Upload */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFilePicked} className="hidden" id="knowledge-file-input" />
            <label htmlFor="knowledge-file-input" className="btn-pro-primary bg-[#00B4D8] py-3 flex-1 cursor-pointer">
              <Upload size={18} strokeWidth={3} /> {t.knowledgeUploadFile}
            </label>
          </div>

          {/* Paste text */}
          <div className="bg-[#F9FAFB] border border-[#101A24]/10 rounded-2xl p-5 mb-6">
            <p className="text-xs font-extrabold text-[#888] uppercase tracking-widest mb-3">{t.knowledgePasteText}</p>
            <input
              type="text" value={pasteTitle} onChange={e => setPasteTitle(e.target.value)}
              placeholder={t.knowledgePasteTitlePlaceholder}
              className="input-pro mb-3 py-3"
            />
            <textarea
              value={pasteText} onChange={e => setPasteText(e.target.value)}
              placeholder={t.knowledgePasteTextPlaceholder}
              rows={4}
              className="input-pro mb-3 resize-none"
            />
            <button onClick={handlePasteSave} disabled={saving || !pasteText.trim()} className="btn-pro-primary bg-[#9FE870] w-full py-3">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} strokeWidth={3} />} {t.knowledgeSaveBtn}
            </button>
          </div>

          {/* Document list */}
          {docsLoading ? (
            <div className="text-center py-6 text-[#101A24] font-extrabold uppercase tracking-widest text-sm">Đang tải...</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-6 text-[#888] font-bold text-sm">{t.knowledgeEmptyState}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between gap-3 bg-white border border-[#101A24]/10 rounded-xl px-4 py-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#101A24] truncate">{doc.title}</p>
                    <p className="text-xs font-bold text-[#888] uppercase tracking-widest">{doc.source_type} • {doc.chunk_count} đoạn</p>
                  </div>
                  <button onClick={() => handleDelete(doc.id)} className="text-[#EF4444] hover:text-[#991B1B] shrink-0" title={t.knowledgeDeleteBtn}>
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat window */}
      <div className="card-pro bg-white flex flex-col" style={{ height: '520px' }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
              <img src={llamaWalk} alt="Llama đang đi dạo chờ bạn hỏi" className="w-full max-w-xs rounded-2xl border border-[#101A24]/10 shadow-sm wiggle" />
              <p className="text-[#888] font-bold">{t.chatEmptyState}</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && <span className="text-2xl mr-2 shrink-0">🦙</span>}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm font-bold leading-relaxed whitespace-pre-wrap shadow-sm border border-[#101A24]/10 ${
                  m.role === 'user' ? 'bg-[#101A24] text-white' : 'bg-[#F9FAFB] text-[#101A24]'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <span className="text-2xl mr-2 shrink-0">🦙</span>
              <div className="bg-[#F9FAFB] border border-[#101A24]/10 rounded-2xl px-5 py-3 text-sm font-extrabold text-[#888] uppercase tracking-widest shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> {t.chatThinking}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-3 bg-[#EF4444] border border-[#101A24]/10 text-white text-sm font-bold px-4 py-3 rounded-lg shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-3 p-4 border-t-3 border-[#101A24]/10">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder={t.chatPlaceholder}
            disabled={loading}
            className="input-pro flex-1 py-3"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-pro-primary bg-[#2563EB] text-white py-3 px-5 shrink-0">
            <Send size={20} strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  );
}
