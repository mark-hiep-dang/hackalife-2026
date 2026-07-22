import { useState } from 'react';

// Dual-line trend chart with hover crosshair + tooltip (spec: every value a
// tooltip shows must also live in the legend/direct labels, never gated).
// `series`: [{ key, label, color }]. `data`: [{ [xKey]: ..., [seriesKey]: number }]
export function TrendChart({ data, series, xKey = 'round', formatX = (v) => v, emptyMessage, height = 200 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 480;
  const padding = { top: 10, right: 12, bottom: 8, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (!data || data.length < 2) {
    return <p className="text-sm text-[#888] py-8 text-center">{emptyMessage}</p>;
  }

  const allValues = data.flatMap((d) => series.map((s) => d[s.key] ?? 0));
  const maxVal = Math.max(...allValues, 10);
  const yScale = (v) => innerH - (v / maxVal) * innerH;
  const xScale = (i) => (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width - padding.left;
    const idx = Math.round((relX / innerW) * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
          <g transform={`translate(${padding.left},${padding.top})`}>
            {[0, 0.5, 1].map((t) => (
              <line key={t} x1={0} y1={innerH * t} x2={innerW} y2={innerH * t} stroke="#101A24" strokeOpacity="0.08" strokeWidth="1" />
            ))}
            {series.map((s) => (
              <g key={s.key}>
                <polyline
                  points={data.map((d, i) => `${xScale(i)},${yScale(d[s.key] ?? 0)}`).join(' ')}
                  fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                {data.map((d, i) => (
                  <circle key={i} cx={xScale(i)} cy={yScale(d[s.key] ?? 0)} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />
                ))}
              </g>
            ))}
            {hoverIndex !== null && (
              <line x1={xScale(hoverIndex)} y1={0} x2={xScale(hoverIndex)} y2={innerH} stroke="#101A24" strokeOpacity="0.2" strokeWidth="1" />
            )}
          </g>
        </svg>
        {hoverIndex !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 bg-[#101A24] text-white rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none z-10"
            style={{ left: `${(hoverIndex / (data.length - 1)) * 100}%` }}
          >
            <div className="font-bold text-white/70 mb-1">{formatX(data[hoverIndex][xKey])}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 inline-block rounded" style={{ background: s.color }} />
                <span className="font-extrabold">{data[hoverIndex][s.key]}</span>
                <span className="text-white/70">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-4 justify-center flex-wrap">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs font-bold text-[#101A24]">
            <span className="w-3 h-0.5 inline-block rounded" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const GAUGE_BANDS = [
  { from: 0, to: 50, color: '#D14343' },
  { from: 50, to: 75, color: '#E8A23A' },
  { from: 75, to: 100, color: '#1E9E5A' }
];

// Semicircle gauge, 0-100. Color bands are fixed status colors (never
// categorical) — the numeric value is always shown too, since "warning"
// alone is sub-3:1 contrast (relief rule: never rely on color alone).
export function GaugeChart({ value, label, size = 160 }) {
  const clamped = value == null ? null : Math.max(0, Math.min(100, value));
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  const angleForValue = (v) => 180 - (v / 100) * 180;
  const polar = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };
  const arcPath = (fromV, toV) => {
    const p1 = polar(angleForValue(fromV));
    const p2 = polar(angleForValue(toV));
    const largeArc = Math.abs(angleForValue(fromV) - angleForValue(toV)) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  const needleTip = clamped == null ? null : polar(angleForValue(clamped));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {GAUGE_BANDS.map((b) => (
          <path key={b.from} d={arcPath(b.from, b.to)} fill="none" stroke={b.color} strokeWidth="14" strokeOpacity={clamped == null ? 0.25 : 1} />
        ))}
        {needleTip && (
          <>
            <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#101A24" strokeWidth="3" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5" fill="#101A24" />
          </>
        )}
      </svg>
      <div className="text-2xl font-extrabold text-[#101A24] -mt-1">{clamped != null ? `${Math.round(clamped)}%` : '—'}</div>
      <div className="text-xs text-[#888] font-bold uppercase tracking-widest text-center">{label}</div>
    </div>
  );
}

function bandColorForValue(v) {
  if (v == null) return '#6B7280';
  const band = GAUGE_BANDS.find((b) => v <= b.to) || GAUGE_BANDS[GAUGE_BANDS.length - 1];
  return band.color;
}

// Full-ring variant of GaugeChart — same fixed red/amber/green status bands
// (never categorical), just a single tier color filling the ring instead of
// three stacked arcs + needle. `dark=false` switches the track/text for use
// on a white card instead of the original dark hero-card background.
export function CircularGauge({ value, label, size = 150, dark = true }) {
  const clamped = value == null ? null : Math.max(0, Math.min(100, value));
  const radius = size / 2 - 13;
  const circumference = 2 * Math.PI * radius;
  const dash = clamped != null ? (clamped / 100) * circumference : 0;
  const color = bandColorForValue(clamped);

  return (
    <div className="flex flex-col items-center w-full min-w-0">
      <div className="relative shrink-0" style={{ width: size, maxWidth: '100%' }}>
        {/* Classic responsive-SVG pattern: intrinsic width/height attributes give
            it a real aspect ratio, `max-width:100%; height:auto` lets it shrink
            with the container — deliberately not using the CSS `aspect-ratio`
            property here, since that depends on how the parent flex/grid resolves
            the box's width first and produced a runaway height in some layouts. */}
        <svg
          width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block', maxWidth: '100%', height: 'auto', transform: 'rotate(-90deg)' }}
        >
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={dark ? 'rgba(255,255,255,0.12)' : '#F0EEF7'} strokeWidth="14" />
          {clamped != null && (
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-comic font-extrabold text-2xl ${dark ? 'text-white' : 'text-[#101A24]'}`}>{clamped != null ? `${Math.round(clamped)}%` : '—'}</span>
        </div>
      </div>
      <div className={`text-[11px] font-extrabold uppercase tracking-widest text-center mt-2 break-words max-w-full px-1 ${dark ? 'text-white/70' : 'text-[#888]'}`}>{label}</div>
    </div>
  );
}

// Single-series line chart for round-by-round scores against a pass mark:
// dashed threshold line + per-round dots colored pass (green) / fail (red),
// matching the Cohort Overview / Learner Detail score-history charts. Not a
// multi-series TrendChart — this always shows the pass/fail read at a glance.
export function RoundScoreChart({ rounds, targetScore, maxScore = 100, emptyMessage }) {
  const width = 560;
  const height = 180;
  const pad = { top: 16, right: 16, bottom: 28, left: 16 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  if (!rounds || rounds.length < 2) {
    return <p className="text-sm text-[#888] py-8 text-center">{emptyMessage}</p>;
  }

  const stepX = innerW / (rounds.length - 1);
  const yFor = (score) => pad.top + innerH - (Math.max(0, Math.min(maxScore, score)) / maxScore) * innerH;
  const dots = rounds.map((r, i) => ({
    cx: pad.left + i * stepX, cy: yFor(r.score), round: r.round,
    pass: r.score >= targetScore, color: r.score >= targetScore ? '#1E9E5A' : '#D14343'
  }));
  const polylinePoints = dots.map((d) => `${d.cx},${d.cy}`).join(' ');
  const passLineY = yFor(targetScore);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <line x1={pad.left} y1={passLineY} x2={width - pad.right} y2={passLineY} stroke="#101A24" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="5 5" />
      <polyline points={polylinePoints} fill="none" stroke="#101A24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {dots.map((d) => (
        <g key={d.round}>
          <circle cx={d.cx} cy={d.cy} r="6" fill={d.color} stroke="#fff" strokeWidth="2" />
          <text x={d.cx} y={height - 16} textAnchor="middle" fontSize="11" fontWeight="800" fill="#8A8A8A">R{d.round}</text>
        </g>
      ))}
    </svg>
  );
}

const JOURNEY_STAGE_COLORS = ['#5B87B8', '#4FA7B8', '#4FB88B', '#8FD673', '#C9EF7A'];

// Cohort Summit Journey — a mountain-range read of where every real learner
// currently sits (Base Camp/Foundation/Practice/Mock Exam/Summit Ready),
// deliberately not a single-number gauge: the whole point is showing the
// *distribution* across stages, which stage is typical (the llama marker),
// and which learners just crossed into a new one this week vs stalled.
// `stages`: [{ key, icon, count, label }] in stage order.
export function MountainJourney({ stages, medianStageKey }) {
  const width = 1000, height = 220;
  const colW = width / stages.length;
  const baseY = 200, minH = 46, maxH = 140;
  const counts = stages.map((s) => s.count);
  const minC = Math.min(...counts), maxC = Math.max(...counts);
  const spread = maxC - minC || 1;

  const peaks = stages.map((s, i) => {
    const h = counts.every((c) => c === 0) ? minH : minH + ((s.count - minC) / spread) * (maxH - minH);
    const xC = colW * i + colW / 2;
    const peakY = baseY - h;
    return { ...s, xC, peakY, color: JOURNEY_STAGE_COLORS[i % JOURNEY_STAGE_COLORS.length] };
  });
  const medianPeak = peaks.find((p) => p.key === medianStageKey) || peaks[0];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block', height: 'auto' }}>
        <line x1="0" y1={baseY} x2={width} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <polyline
          points={peaks.map((p) => `${p.xC},${p.peakY - 22}`).join(' ')}
          fill="none" stroke="#9FE870" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.85"
        />
        {peaks.map((p) => (
          <g key={p.key}>
            <polygon points={`${p.xC - 62},${baseY} ${p.xC - 24},${p.peakY} ${p.xC + 24},${p.peakY} ${p.xC + 62},${baseY}`} fill={p.color} opacity="0.92" />
            <circle cx={p.xC} cy={p.peakY - 34} r="20" fill="#101A24" stroke={p.color} strokeWidth="3" />
            <text x={p.xC} y={p.peakY - 34} textAnchor="middle" dominantBaseline="central" fontFamily="'Baloo 2',sans-serif" fontWeight="800" fontSize="16" fill="#fff">{p.count}</text>
            <text x={p.xC} y={p.peakY + 26} textAnchor="middle" fontSize="20">{p.icon}</text>
          </g>
        ))}
        {medianPeak && <text x={medianPeak.xC} y={medianPeak.peakY - 66} textAnchor="middle" fontSize="28">🦙</text>}
      </svg>
      <div className="grid gap-2 mt-1" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
        {stages.map((s) => (
          <div key={s.key} className="text-center py-2 px-1 rounded-2xl" style={{
            background: s.key === medianStageKey ? 'rgba(159,232,112,0.18)' : 'rgba(255,255,255,0.05)',
            border: s.key === medianStageKey ? '2px solid #9FE870' : '2px solid transparent'
          }}>
            <div className="font-comic font-extrabold text-[12.5px] text-white">{s.label}</div>
            <div className="text-[11px] font-bold text-white/60 mt-0.5">{s.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
