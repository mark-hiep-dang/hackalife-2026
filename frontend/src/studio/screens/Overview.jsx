import { useEffect, useState } from 'react';
import { getOverview } from '../../utils/studioApi';
import { Card, Spinner, CAMP_COLORS } from '../components/ui';
import { TrendChart, CircularGauge } from '../components/charts';
import { getStudioLlamaReaction } from '../../studioPersonality';
import { useT } from '../../translations';

function healthTierStyle(score) {
  if (score == null) return { bg: 'bg-[#EEF0F3]', text: 'text-[#888]' };
  if (score < 50) return { bg: 'bg-[#F5C9DA]', text: 'text-[#8A2F55]' };
  if (score < 75) return { bg: 'bg-[#FBE3B0]', text: 'text-[#8A6414]' };
  return { bg: 'bg-[#C7EFC4]', text: 'text-[#3D7A2E]' };
}

function deltaLabel(delta, t, suffix = '') {
  if (delta == null) return null;
  const arrow = delta >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(delta)}${suffix} ${t.studioVsLastRound}`;
}

export default function Overview({ onNavigate }) {
  const t = useT();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOverview().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Card className="text-sm text-red-600">{error}</Card>;
  if (!data) return <Spinner label={t.studioLoading} />;

  const event = data.activeCourses === 0 ? 'EMPTY_COURSE' : 'STUDIO_GREETING';
  const { message: heroMessage } = getStudioLlamaReaction(event);

  const trend = data.mockExamTrend || [];
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const scoreDelta = last && prev ? Math.round(last.averageScore - prev.averageScore) : null;
  const passDelta = last && prev ? Math.round(last.passRate - prev.passRate) : null;

  const statCards = [
    { icon: '🎓', label: t.studioStatActiveCourses, value: data.activeCourses, bg: 'bg-brand-green', ink: 'text-brand-green-ink', shadow: '#4F9A5A', sub: null },
    { icon: '🙋', label: t.studioStatActiveLearners, value: data.activeLearners, bg: 'bg-brand-cyan', ink: 'text-brand-cyan-ink', shadow: '#3B93A8', sub: null },
    { icon: '🎯', label: t.studioStatAvgScore, value: data.averageMockExamScore ?? '—', bg: 'bg-brand-lavender', ink: 'text-brand-lavender-ink', shadow: '#8A6FC9', sub: deltaLabel(scoreDelta, t) },
    { icon: '🏆', label: t.studioStatPassRate, value: data.estimatedPassRate != null ? `${data.estimatedPassRate}%` : '—', bg: 'bg-brand-gold', ink: 'text-brand-gold-ink', shadow: '#B8912E', sub: deltaLabel(passDelta, t, '%') }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[32px] p-8 md:p-9"
        style={{ background: 'linear-gradient(120deg, #2563EB 0%, #6D5DD3 55%, #8B7BAE 100%)', boxShadow: '0 10px 0 #17408F, 0 20px 40px -16px rgba(37,99,235,0.4)' }}
      >
        <span className="absolute top-2 right-36 text-3xl hidden md:inline" style={{ animation: 'sparkle 3.2s ease-in-out infinite' }}>✨</span>
        <span className="absolute -bottom-5 right-6 text-8xl" style={{ animation: 'bob 3.4s ease-in-out infinite' }}>🦙</span>
        <span className="absolute top-5 right-20 w-3.5 h-3.5 rounded-full bg-white/50 hidden md:inline-block" style={{ animation: 'floatCloud 4s ease-in-out infinite' }} />
        <div className="relative max-w-[62%]">
          <span className="inline-block bg-white/20 text-white font-comic font-bold text-[11px] uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3">
            🎉 {t.studioHeroBadge}
          </span>
          <p className="font-comic font-extrabold text-2xl md:text-[28px] text-white leading-snug">{heroMessage}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-[26px] p-5 ${s.bg}`} style={{ boxShadow: `0 6px 0 ${s.shadow}` }}>
            <span className="absolute -top-2 -right-1 text-5xl opacity-20">{s.icon}</span>
            <div className={`relative text-[11px] font-extrabold uppercase tracking-wide mb-2 ${s.ink}`}>{s.label}</div>
            <div className="relative font-comic font-extrabold text-[28px] md:text-[30px] text-[#101A24]">{s.value}</div>
            {s.sub && <div className={`relative text-xs font-extrabold mt-1 ${s.ink}`}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Trend + gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <h3 className="font-comic font-extrabold text-[#101A24] mb-4">📈 {t.studioMockExamTrendTitle}</h3>
          <TrendChart
            data={data.mockExamTrend}
            series={[
              { key: 'averageScore', label: t.studioTrendSeriesAvgScore, color: '#1E9E5A' },
              { key: 'passRate', label: t.studioTrendSeriesPassRate, color: '#2178C4' }
            ]}
            xKey="round"
            formatX={(v) => t.studioRoundLabel.replace('{n}', v)}
            emptyMessage={t.studioMockExamTrendEmpty}
          />
        </Card>
        <div
          className="rounded-[28px] p-6 flex items-center justify-center overflow-hidden min-h-0"
          style={{ background: 'linear-gradient(160deg, #101A24 0%, #2B3A4A 100%)', boxShadow: '0 6px 0 rgba(16,26,36,0.2)' }}
        >
          <CircularGauge value={data.estimatedPassRate} label={t.studioStatPassRate} />
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[26px] p-6 bg-brand-gold" style={{ boxShadow: '0 6px 0 #B8912E' }}>
          <div className="text-3xl mb-2.5">👀</div>
          <h3 className="font-comic font-extrabold text-base text-[#101A24] mb-1.5">{t.studioNeedsReviewTitle}</h3>
          <p className="text-sm font-bold text-[#8A6414] mb-4">{t.studioNeedsReviewDesc.replace('{count}', data.coursesNeedingReview)}</p>
          <button
            onClick={() => onNavigate('courses')}
            className="bg-[#101A24] text-white font-comic font-extrabold text-sm px-5 py-3 rounded-2xl"
            style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.25)' }}
          >
            {t.studioViewCourses} →
          </button>
        </div>
        <div className="rounded-[26px] p-6 bg-brand-coral" style={{ boxShadow: '0 6px 0 #D9695F' }}>
          <div className="text-3xl mb-2.5">🧩</div>
          <h3 className="font-comic font-extrabold text-base text-[#101A24] mb-1.5">{t.studioClustersOpenTitle}</h3>
          <p className="text-sm font-bold text-[#8A2F55] mb-4">{t.studioClustersOpenDesc.replace('{count}', data.misconceptionClustersOpen)}</p>
          <button
            onClick={() => onNavigate('insights')}
            className="bg-[#101A24] text-white font-comic font-extrabold text-sm px-5 py-3 rounded-2xl"
            style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.25)' }}
          >
            {t.studioViewInsights} →
          </button>
        </div>
      </div>

      {/* Courses */}
      <Card>
        <h3 className="font-comic font-extrabold text-[#101A24] mb-4">📚 {t.studioYourCourses}</h3>
        {data.courses.length === 0 ? (
          <p className="text-sm text-[#888]">{t.studioNoCoursesShort}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.courses.map((c, i) => {
              const tier = healthTierStyle(c.healthScore);
              return (
                <button
                  key={c.id} onClick={() => onNavigate('courses')}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F9FAFB] hover:translate-x-0.5 transition-transform text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${CAMP_COLORS[i % CAMP_COLORS.length]}`}>📘</span>
                    <div className="min-w-0">
                      <div className="font-comic font-extrabold text-sm text-[#101A24] truncate">{c.title}</div>
                      <div className="text-xs font-bold text-[#8A8A8A] mt-0.5">{c.status}</div>
                    </div>
                  </div>
                  <span className={`font-comic font-extrabold text-xs px-3.5 py-1.5 rounded-2xl shrink-0 ${tier.bg} ${tier.text}`}>
                    {t.studioHealthLabel.replace('{score}', c.healthScore ?? '—')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
