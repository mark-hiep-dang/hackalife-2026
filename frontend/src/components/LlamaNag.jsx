import { getNagTier } from '../nagMessages';

export default function LlamaNag({ daysSince, onStudyNow }) {
  const tier = getNagTier(daysSince);
  if (!tier) return null;

  return (
    <div
      className="card-pro flex flex-wrap items-center gap-5 p-6 pop-in bg-white -rotate-1"
      style={{ borderColor: tier.color, borderWidth: '2px' }}
    >
      <span className="text-5xl leading-none shrink-0">🦙{tier.icon}</span>
      <p className="flex-1 min-w-[220px] text-base font-extrabold leading-snug" style={{ color: tier.color }}>
        {tier.message}
      </p>
      <button onClick={onStudyNow} className="btn-pro-primary bg-[#9FE870] px-6 py-3 shrink-0">
        Học ngay! 🎯
      </button>
    </div>
  );
}
