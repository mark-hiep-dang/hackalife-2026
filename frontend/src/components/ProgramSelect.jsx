import llamaLogo from '../assets/llama-logo.png';

const PROGRAMS = [
  {
    id: 'mof',
    icon: '📜',
    title: 'MOF',
    subtitle: 'Chứng chỉ Đại lý Bảo hiểm',
    bg: '#C7EFC4',
    color: '#2F5C37',
    locked: false,
  },
  {
    id: 'ilp',
    icon: '📈',
    title: 'ILP',
    subtitle: 'Bảo hiểm liên kết đầu tư',
    bg: '#EEF0F3',
    color: '#8A8A8A',
    locked: true,
  },
  {
    id: 'endowment',
    icon: '💰',
    title: 'Endowment',
    subtitle: 'Bảo hiểm hỗn hợp',
    bg: '#EEF0F3',
    color: '#8A8A8A',
    locked: true,
  },
];

// Shown once right after a fresh login/register — lets the user (and future
// programs) know this app can host more than one certification track, even
// though only MOF has real content today.
export default function ProgramSelect({ onSelect }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-16">
      <div className="w-full max-w-2xl pop-in text-center">
        <img src={llamaLogo} alt="LLAMA" className="w-20 h-20 object-contain mx-auto mb-5 -rotate-3" />
        <h1 className="font-comic font-extrabold text-2xl md:text-3xl text-[#101A24] uppercase tracking-tight mb-2">
          Chọn chương trình học
        </h1>
        <p className="text-sm font-bold text-[#8A8A8A] mb-8">
          LLAMA đang mở rộng sang nhiều chứng chỉ khác nhau — chọn chương trình bạn muốn ôn nhé!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROGRAMS.map((p) => (
            <button
              key={p.id}
              onClick={() => !p.locked && onSelect(p.id)}
              disabled={p.locked}
              className={`relative border-none rounded-[1.75rem] py-7 px-4 flex flex-col items-center gap-2 transition-transform ${
                p.locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:-translate-y-1'
              }`}
              style={{
                background: p.bg,
                boxShadow: p.locked ? '0 4px 14px rgba(0,0,0,0.06)' : '0 6px 18px rgba(79,154,90,0.22)'
              }}
            >
              {p.locked && (
                <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-wider bg-white text-[#8A8A8A] px-2 py-1 rounded-full shadow-sm">
                  Sắp ra mắt
                </span>
              )}
              <span className="text-4xl">{p.locked ? '🔒' : p.icon}</span>
              <span className="font-comic font-extrabold text-lg" style={{ color: p.locked ? p.color : '#101A24' }}>
                {p.title}
              </span>
              <span className="text-xs font-bold" style={{ color: p.color }}>{p.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
