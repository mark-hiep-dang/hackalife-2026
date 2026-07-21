export const CAMP_COLORS = ['bg-[#C7EFC4]', 'bg-[#B9E7EF]', 'bg-[#E3D9F5]', 'bg-[#FBE3B0]', 'bg-[#F5C9DA]'];

export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-3xl border-3 border-[#101A24]/10 shadow-sm p-6 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold text-[#101A24]">{children}</h2>
      {subtitle && <p className="text-sm text-[#666] mt-1">{subtitle}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-[#101A24]/10 shadow-sm p-4 flex flex-col gap-1">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{label}</span>
      <span className="text-2xl font-extrabold text-[#101A24]">{value}</span>
      {sub && <span className="text-xs text-[#888]">{sub}</span>}
    </div>
  );
}

const SEVERITY_STYLE = {
  BLOCKER: 'bg-[#F5C9DA] text-[#101A24]',
  WARNING: 'bg-[#FBE3B0] text-[#101A24]',
  SUGGESTION: 'bg-[#B9E7EF] text-[#101A24]',
  INFO: 'bg-[#EEF0F3] text-[#101A24]'
};
export function SeverityBadge({ severity }) {
  return <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md ${SEVERITY_STYLE[severity] || SEVERITY_STYLE.INFO}`}>{severity}</span>;
}

const RISK_STYLE = {
  'Cần hỗ trợ ngay': 'bg-[#F5C9DA] text-[#101A24]',
  'Cần theo dõi': 'bg-[#FBE3B0] text-[#101A24]',
  'Đang cải thiện': 'bg-[#B9E7EF] text-[#101A24]',
  'Ổn định': 'bg-[#C7EFC4] text-[#101A24]',
  'Chưa đủ dữ liệu': 'bg-[#EEF0F3] text-[#101A24]'
};
export function RiskBadge({ status }) {
  return <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md ${RISK_STYLE[status] || RISK_STYLE['Chưa đủ dữ liệu']}`}>{status}</span>;
}

const PATTERN_STYLE = {
  'Chăm nhưng chưa lên': 'bg-[#FBE3B0] text-[#101A24]',
  'Lên xuống thất thường': 'bg-[#E3D9F5] text-[#101A24]',
  'Nghi đoán may rủi': 'bg-[#F5C9DA] text-[#101A24]',
  'Học rồi nghỉ, nghỉ rồi học lại': 'bg-[#B9E7EF] text-[#101A24]',
  'Im lặng, ít tương tác hỗ trợ': 'bg-[#EEF0F3] text-[#101A24]'
};
export function PatternBadge({ type, title }) {
  return <span title={title} className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md ${PATTERN_STYLE[type] || PATTERN_STYLE['Im lặng, ít tương tác hỗ trợ']}`}>{type}</span>;
}

export function Sparkline({ points = [], width = 100, height = 28, className = '' }) {
  if (points.length < 2) return <span className="text-xs text-[#888]">—</span>;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => `${i * stepX},${height - (Math.max(0, Math.min(100, p)) / 100) * height}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className}>
      <polyline points={coords} fill="none" stroke="#101A24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-[#101A24] text-white hover:opacity-90',
    secondary: 'bg-white text-[#101A24] border border-[#101A24]/15 hover:bg-[#F5F6F8]',
    success: 'bg-[#C7EFC4] text-[#101A24] hover:opacity-90',
    danger: 'bg-[#F5C9DA] text-[#101A24] hover:opacity-90'
  };
  return (
    <button {...props} className={`px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Spinner({ label = 'Đang tải…' }) {
  return <div className="flex items-center gap-2 text-sm text-[#888] py-8 justify-center">{label}</div>;
}

export function EmptyState({ children }) {
  return <div className="text-center py-12 text-sm text-[#888]">{children}</div>;
}
