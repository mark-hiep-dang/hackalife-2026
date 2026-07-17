import { useState } from 'react';
import { updateUserPath } from '../utils/api';
import { translations as t } from '../translations';
import llamaLogo from '../assets/llama-logo.png';

export default function PathSelection({ onSelect, isCancellable, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSelect(pathStr) {
    setLoading(true);
    setError('');
    try {
      await updateUserPath(pathStr);
      onSelect(pathStr);
    } catch (err) {
      setError(err.message || 'Lỗi lưu chứng chỉ!');
    } finally {
      setLoading(false);
    }
  }

  const paths = [
    {
      id: 'MOF',
      title: 'Đại lý Cơ bản (MOF)',
      desc: 'Chứng chỉ đại lý bảo hiểm nhân thọ cơ bản do Bộ Tài Chính cấp.',
      icon: '🎓',
      enabled: true
    },
    {
      id: 'UL',
      title: 'Liên kết chung (UL)',
      desc: 'Sản phẩm Bảo hiểm Liên kết chung (Universal Life).',
      icon: '🛡️',
      enabled: false
    },
    {
      id: 'ILP',
      title: 'Liên kết đầu tư (ILP)',
      desc: 'Sản phẩm Bảo hiểm Liên kết đầu tư (Investment-Linked).',
      icon: '📈',
      enabled: false
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F5F6F8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border-4 border-[#101A24]/5 relative">
        
        {isCancellable && (
          <button 
            onClick={onCancel} 
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#EEF0F3] flex items-center justify-center font-extrabold text-[#101A24] transition-transform hover:-translate-y-1"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-10">
          <img src={llamaLogo} alt="LLAMA" className="w-20 h-20 mx-auto mb-4 object-contain wiggle" />
          <h1 className="text-3xl md:text-4xl font-comic font-extrabold text-[#101A24] uppercase tracking-wide">
            Bạn đang luyện thi chứng chỉ nào?
          </h1>
          <p className="mt-3 text-base font-bold text-[#8A8A8A]">
            Hãy chọn mục tiêu học tập của bạn để Llama lên lộ trình phù hợp nhé!
          </p>
        </div>

        {error && (
          <div className="bg-[#F7D2CC] text-[#B4443B] font-bold px-4 py-3 rounded-lg mb-6 text-center uppercase tracking-wider text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paths.map(p => (
            <button
              key={p.id}
              disabled={!p.enabled || loading}
              onClick={() => handleSelect(p.id)}
              className={`relative border-none text-left p-6 rounded-3xl transition-all duration-200 flex flex-col h-full ${
                p.enabled
                  ? 'bg-[#E3D9F5] cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(107,66,191,0.2)]'
                  : 'bg-[#EEF0F3] opacity-60 cursor-not-allowed grayscale'
              }`}
              style={p.enabled ? { boxShadow: '0 8px 0 rgba(107,66,191,0.1)' } : {}}
            >
              {!p.enabled && (
                <div className="absolute top-4 right-4 bg-[#101A24] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  Coming Soon
                </div>
              )}
              
              <div className="text-5xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-comic font-extrabold text-[#101A24] mb-2">
                {p.title}
              </h3>
              <p className="text-sm font-bold text-[#101A24]/70 leading-relaxed flex-1">
                {p.desc}
              </p>
              
              {p.enabled && (
                <div className="mt-6 inline-flex items-center justify-center bg-[#101A24] text-white font-extrabold text-sm uppercase px-5 py-3 rounded-xl">
                  {loading ? 'Đang lưu...' : 'Chọn lộ trình 🚀'}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
