import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../utils/api';
import { translations } from '../translations';
import { playPang, playChiu } from '../utils/sound';

export default function Chat({ language }) {
  const t = translations[language];

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: language === 'vn' 
        ? 'Xin chào! Tôi là **Llama Đại Lý** 🦙. Tôi đã nạp đầy đủ kiến thức Luật Kinh doanh Bảo hiểm 2022 và Giáo trình thi đại lý Bộ Tài chính. Bạn cần tôi hỗ trợ giải thích thuật ngữ hay muốn tôi **Đố vui trắc nghiệm**?' 
        : 'Hello! I am **Llama Agent** 🦙. I am fully loaded with the Vietnam Law on Insurance Business 2022 and the MOF exam syllabus. Ask me to explain any term, or click the button below to have me quiz you!'
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434');
  const [showConfig, setShowConfig] = useState(false);
  const [isLlamaOnline, setIsLlamaOnline] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    checkLlamaConnection();
  }, [ollamaUrl]);

  async function checkLlamaConnection() {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
      setIsLlamaOnline(res.ok);
    } catch (err) {
      setIsLlamaOnline(false);
    }
  }

  function handleSaveConfig(e) {
    e.preventDefault();
    localStorage.setItem('pang_chiu_ollama_url', ollamaUrl);
    setShowConfig(false);
    checkLlamaConnection();
  }

  async function handleSendMessage(text) {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const history = messages.slice(-6);
      const reply = await sendChatMessage(text, history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      playPang();
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: Could not retrieve Llama response. Fallback agent message: ${err.message}`
      }]);
      playChiu();
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    { label_en: "⏱️ Grace Period", label_vn: "⏱️ Gia hạn đóng phí", prompt: "Explain the 60-day grace period in Vietnam insurance contract law." },
    { label_en: "👁️ Free Look", label_vn: "👁️ 21 ngày cân nhắc", prompt: "Explain the 21-day free look period for life insurance." },
    { label_en: "🚫 Rebating Rules", label_vn: "🚫 Cấm chiết khấu", prompt: "Is it legal for an agent to rebate commission to clients in Vietnam?" },
    { label_en: "⚖️ Insurable Interest", label_vn: "⚖️ Quyền lợi bảo hiểm", prompt: "What is the Principle of Insurable Interest in simple terms?" }
  ];

  function parseMessageContent(content) {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-dark)', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Connection Indicator */}
      <div className="glass-panel" style={{
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isLlamaOnline ? 'var(--success)' : '#ef4444',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {isLlamaOnline ? t.statusConnected : t.statusFallback}
          </span>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--info)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 700,
            textDecoration: 'underline'
          }}
        >
          ⚙️ {language === 'vn' ? 'Cài Đặt Cổng Llama' : 'Configure Llama'}
        </button>
      </div>

      {/* Config Drawer */}
      {showConfig && (
        <form onSubmit={handleSaveConfig} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {t.connectionConfig}
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="glass-input"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="e.g. http://localhost:11434"
              required
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>
              {t.saveConfig}
            </button>
          </div>
        </form>
      )}

      {/* Chat Frame */}
      <div className="glass-panel" style={{
        height: '420px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                {!isUser && (
                  <span style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(28, 176, 246, 0.1)',
                    border: '2px solid var(--info-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    🦙
                  </span>
                )}
                
                <div style={{
                  maxWidth: '75%',
                  background: isUser ? 'var(--primary)' : '#f1f3f5',
                  border: isUser ? '2px solid var(--primary-dark)' : '2px solid #e5e5e5',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  lineHeight: '1.45',
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap'
                }}>
                  {isUser ? msg.content : parseMessageContent(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(28, 176, 246, 0.1)',
                border: '2px solid var(--info-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                🦙
              </span>
              <div style={{
                background: '#f1f3f5',
                border: '2px solid #e5e5e5',
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                fontWeight: 500
              }}>
                {t.aiThinking}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div style={{
          padding: '10px 12px',
          borderTop: '2px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          background: '#f7f9fa'
        }}>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                borderBottomWidth: '4px'
              }}
            >
              {language === 'vn' ? s.label_vn : s.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Input controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => handleSendMessage(language === 'vn' ? 'Đố tôi một câu hỏi ôn thi chứng chỉ bảo hiểm' : 'Quiz me with an insurance certificate question')}
          className="btn-primary"
          style={{
            whiteSpace: 'nowrap',
            background: 'var(--success)',
            border: '2px solid var(--success-dark)',
            borderBottom: '6px solid var(--success-dark)'
          }}
          disabled={loading}
        >
          {t.quizMeBtn}
        </button>
        
        <input
          type="text"
          className="glass-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t.chatPlaceholder}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage(inputValue);
          }}
        />

        <button
          onClick={() => handleSendMessage(inputValue)}
          className="btn-primary"
          disabled={loading || !inputValue.trim()}
          style={{ padding: '12px 24px' }}
        >
          {t.sendBtn}
        </button>
      </div>

    </div>
  );
}
