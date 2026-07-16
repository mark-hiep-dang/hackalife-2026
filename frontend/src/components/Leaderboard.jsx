import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';

const STAND_STYLE = {
  1: { height: 64, width: 96, color: '#FFD34D', medal: '🥇', emojiSize: 56, bobSpeed: '2.4s' },
  2: { height: 46, width: 88, color: '#D8DEE6', medal: '🥈', emojiSize: 42, bobSpeed: '3s' },
  3: { height: 32, width: 88, color: '#E8B98A', medal: '🥉', emojiSize: 42, bobSpeed: '3s' }
};
const PODIUM_ORDER = [2, 1, 3]; // classic podium visual order: 2nd, 1st, 3rd

export default function Leaderboard({ profile }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('weekly');

  useEffect(() => {
    (async () => {
      try { setData(await getLeaderboard()); }
      catch (e) { setError(e.message || 'Lỗi tải BXH'); }
      finally { setLoading(false); }
    })();
  }, []);

  const mult = tab === 'daily' ? 0.12 : tab === 'monthly' ? 3.4 : 1;
  const rows = data
    .map((r) => ({ ...r, xp: Math.round(r.xp * mult) }))
    .sort((a, b) => b.xp - a.xp)
    .map((r, i) => ({ ...r, rank: i + 1, isMe: r.username === profile?.username }));

  const podium = PODIUM_ORDER.map((rank) => rows.find((r) => r.rank === rank)).filter(Boolean);
  const restRows = rows.filter((r) => r.rank > 3);

  const tabs = [
    { id: 'daily', label: 'Hôm nay' },
    { id: 'weekly', label: 'Tuần này' },
    { id: 'monthly', label: 'Tháng này' }
  ];

  return (
    <div className="pop-in max-w-3xl mx-auto w-full">
      <h2 className="font-comic font-extrabold text-xl text-[#101A24] uppercase tracking-wide mb-1 flex items-center gap-2">
        <span>🏁</span> Đường Đua Llama
      </h2>
      <p className="text-sm font-bold text-[#8A8A8A] mb-4">Ai chạy nhanh nhất tuần này? Cán đích để giành huy chương! 🥇</p>

      <div
        className="relative rounded-[2rem] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #EAF7FA 0%, #EEF0F3 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}
      >
        {/* Tab bar */}
        <div className="flex gap-2 px-5 pt-5">
          {tabs.map((tb) => {
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className="flex-1 border-none cursor-pointer py-2.5 px-3.5 font-comic font-bold text-[13px]"
                style={{
                  borderRadius: '16px 16px 4px 4px',
                  background: active ? '#8A6FC9' : '#fff',
                  color: active ? '#fff' : '#101A24',
                  boxShadow: active ? '0 4px 14px rgba(138,111,201,0.3)' : '0 4px 14px rgba(0,0,0,0.06)'
                }}
              >
                {tb.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="py-16 text-center text-[#101A24] font-comic font-extrabold uppercase tracking-widest">Đang tải BXH...</div>
        )}
        {error && (
          <div className="mx-5 my-6 py-6 text-center text-[#B4443B] bg-[#F7D2CC] rounded-2xl font-bold uppercase tracking-widest">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-4 px-6 pt-6 pb-2.5">
              {podium.map((p) => {
                const stand = STAND_STYLE[p.rank];
                return (
                  <div key={p.rank} className="flex flex-col items-center gap-2">
                    <span className="leading-none" style={{ fontSize: `${stand.emojiSize}px`, animation: `bob ${stand.bobSpeed} ease-in-out infinite` }}>🦙</span>
                    <div className="font-comic font-extrabold text-[13px] text-[#101A24] text-center truncate" style={{ maxWidth: '90px' }}>
                      {p.username}
                    </div>
                    <div className="text-[11px] font-extrabold text-[#3B93A8]">{p.xp.toLocaleString()} XP</div>
                    <div
                      className="flex items-start justify-center pt-2"
                      style={{ width: `${stand.width}px`, height: `${stand.height}px`, background: stand.color, borderRadius: '12px 12px 0 0', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.08)' }}
                    >
                      <span className="text-2xl">{stand.medal}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of the list */}
            <div className="bg-white mx-4 mb-5 rounded-[1.25rem] overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              {restRows.map((row) => (
                <div
                  key={row.rank}
                  className="flex items-center gap-3.5 px-4 py-3 border-b-2 border-[#F3F3F3] last:border-b-0"
                  style={{ background: row.isMe ? '#EEF9EE' : 'transparent' }}
                >
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#EEF0F3] flex items-center justify-center font-comic font-extrabold text-sm text-[#101A24] shrink-0">
                    {row.rank}
                  </div>
                  <span className="text-2xl shrink-0">🦙</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-comic font-bold text-sm text-[#101A24] truncate">{row.username}</span>
                      {row.isMe && (
                        <span className="text-[9px] font-extrabold bg-[#8A6FC9] text-white px-2 py-0.5 rounded-lg uppercase tracking-wide shrink-0">Bạn</span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-[#8A8A8A] mt-0.5">🔥 {row.streak} ngày · Lv {row.level}</div>
                  </div>
                  <div className="font-comic font-extrabold text-base text-[#101A24] shrink-0">
                    {row.xp.toLocaleString()} <span className="text-[10px] text-[#8A8A8A]">XP</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
