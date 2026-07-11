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
    { label_en: "Grace Period", label_vn: "Gia hạn đóng phí", prompt: "Explain the 60-day grace period in Vietnam insurance contract law." },
    { label_en: "Free Look", label_vn: "21 ngày cân nhắc", prompt: "Explain the 21-day free look period for life insurance." },
    { label_en: "Rebating Rules", label_vn: "Cấm chiết khấu", prompt: "Is it legal for an agent to rebate commission to clients in Vietnam?" },
    { label_en: "Insurable Interest", label_vn: "Quyền lợi BH", prompt: "What is the Principle of Insurable Interest in simple terms?" }
  ];

  function parseMessageContent(content) {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  return (
    <div className="fade-in" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Connection Status */}
      <div className="glass-panel" style={{
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isLlamaOnline ? 'var(--success)' : '#ef4444',
            display: 'inline-block',
            boxShadow: isLlamaOnline ? '0 0 6px rgba(34,197,94,0.4)' : 'none'
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {isLlamaOnline ? t.statusConnected : t.statusFallback}
          </span>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ⚙️ {language === 'vn' ? 'Cài Đặt' : 'Configure'}
        </button>
      </div>

      {showConfig && (
        <form onSubmit={handleSaveConfig} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t.connectionConfig}
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
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

      {/* Chat Window */}
      <div className="glass-panel" style={{
        height: '420px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                {!isUser && (
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--info-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    flexShrink: 0
                  }}>
                    🦙
                  </span>
                )}
                
                <div style={{
                  maxWidth: '75%',
                  background: isUser ? 'var(--text-dark)' : 'var(--bg-subtle)',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  fontWeight: 450,
                  whiteSpace: 'pre-wrap'
                }}>
                  {isUser ? msg.content : parseMessageContent(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--info-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem'
              }}>
                🦙
              </span>
              <div style={{
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                {t.aiThinking}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          background: 'var(--bg-subtle)'
        }}>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              style={{
                padding: '6px 12px',
                borderRadius: '99px',
                fontSize: '0.725rem',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition)'
              }}
            >
              {language === 'vn' ? s.label_vn : s.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleSendMessage(language === 'vn' ? 'Đố tôi một câu hỏi ôn thi chứng chỉ bảo hiểm' : 'Quiz me with an insurance certificate question')}
          className="btn-success"
          style={{ whiteSpace: 'nowrap', padding: '12px 16px' }}
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
          style={{ padding: '12px 20px' }}
        >
          {t.sendBtn}
        </button>
      </div>

    </div>
  );
}
