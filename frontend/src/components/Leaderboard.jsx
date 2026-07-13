import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';
import { translations as t } from '../translations';
import { Trophy, Flame } from 'lucide-react';

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

  const rows = tab === 'daily'
    ? data.map((r,i) => ({ ...r, xp: Math.round(r.xp*.12), rank: i+1 })).sort((a,b) => b.xp-a.xp)
    : tab === 'monthly'
    ? data.map((r,i) => ({ ...r, xp: Math.round(r.xp*3.4), rank: i+1 })).sort((a,b) => b.xp-a.xp)
    : data;

  const podium = (rank) => {
    if (rank === 1) return <span className="text-3xl font-black">🥇</span>;
    if (rank === 2) return <span className="text-3xl font-black">🥈</span>;
    if (rank === 3) return <span className="text-3xl font-black">🥉</span>;
    return <span className="text-2xl font-black text-[#111]">{rank}</span>;
  };

  return (
    <div className="card-brutal overflow-hidden pop-in bg-white flex flex-col max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="px-6 py-10 bg-[#FFC900] border-b-4 border-[#111] flex flex-col items-center justify-center gap-4">
        <Trophy size={56} strokeWidth={3} className="text-[#111]" />
        <h2 className="text-5xl font-black text-[#111] uppercase tracking-tighter">{t.leaderboardTitle}</h2>
      </div>

      {/* Tab bar */}
      <div className="flex border-b-4 border-[#111] bg-[#F4F4F0]">
        {['daily', 'weekly', 'monthly'].map(v => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-5 text-sm md:text-base font-black uppercase tracking-widest transition-all border-r-3 border-[#111] last:border-r-0 ${tab === v ? 'bg-[#111] text-white shadow-inner' : 'text-[#111] hover:bg-white'}`}
          >{v === 'daily' ? 'Hôm nay' : v === 'weekly' ? 'Tuần này' : 'Tháng này'}</button>
        ))}
      </div>

      {/* Body */}
      <div className="divide-y-3 divide-[#111] bg-white">
        {loading && (
          <div className="py-20 text-center text-[#111] text-lg font-black uppercase tracking-widest">
            Đang tải BXH...
          </div>
        )}
        {error && <div className="py-12 mx-6 my-6 text-center text-white bg-[#F24E1E] border-3 border-[#111] rounded-xl font-black uppercase tracking-widest">{error}</div>}
        
        {!loading && !error && rows.map(row => {
          const isMe = row.username === profile?.username;
          return (
            <div key={row.rank} className={`flex items-center gap-6 px-6 md:px-8 py-6 transition-colors ${isMe ? 'bg-[#FF90E8]' : 'hover:bg-[#F4F4F0]'}`}>
              <div className="w-16 h-16 rounded-full border-4 border-[#111] flex items-center justify-center shrink-0 bg-white shadow-[4px_4px_0_#111]">
                {podium(row.rank)}
              </div>
              
              <div className="flex-1 min-w-0 ml-2">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-black truncate uppercase ${isMe ? 'text-[#111]' : 'text-[#111]'}`}>{row.username}</span>
                  {isMe && <span className="text-[11px] font-black bg-[#111] text-white px-3 py-1 rounded shadow-[2px_2px_0_#fff] uppercase">Bạn</span>}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-[#111] font-bold uppercase tracking-widest bg-white border-2 border-[#111] px-3 py-1 rounded shadow-[2px_2px_0_#111]">Lv {row.level}</span>
                  <span className="text-sm text-[#111] font-bold uppercase tracking-widest flex items-center gap-1.5 bg-white border-2 border-[#111] px-3 py-1 rounded shadow-[2px_2px_0_#111]">
                    <Flame size={16} strokeWidth={3} className="text-[#F24E1E]" /> {row.streak}d
                  </span>
                </div>
              </div>
              
              <div className="text-right shrink-0 bg-white border-4 border-[#111] px-6 py-3 rounded-2xl shadow-[6px_6px_0_#111]">
                <span className="text-4xl font-black text-[#111]">{row.xp.toLocaleString()}</span>
                <span className="text-xs text-[#111] font-black uppercase tracking-widest ml-1">XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
