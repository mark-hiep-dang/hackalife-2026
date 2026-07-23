import { useEffect, useState } from 'react';
import { getOverview } from '../../utils/studioApi';
import { Card, Spinner, CAMP_COLORS } from '../components/ui';
import { TrendChart, MountainJourney } from '../components/charts';
import { getStudioLlamaReaction } from '../../studioPersonality';
import { useT, useLanguage } from '../../translations';
import mascotIllustration from '../../assets/mascot-illustration.png';

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

const MISTAKE_TYPE_LABEL_KEYS = {
  knowledge_gap: 'studioMistakeKnowledgeGap',
  concept_confusion: 'studioMistakeConceptConfusion',
  exception_error: 'studioMistakeExceptionError',
  reading_error: 'studioMistakeReadingError',
  memory_decay: 'studioMistakeMemoryDecay',
  time_pressure: 'studioMistakeTimePressure'
};

const ACTION_ITEM_STYLE = {
  urgent: { bg: 'bg-brand-coral', shadow: '#D9695F', icon: '🔥', priorityKey: 'studioPriorityUrgent' },
  courseReview: { bg: 'bg-brand-gold', shadow: '#B8912E', icon: '📊', priorityKey: 'studioPriorityReview' },
  aiDrafts: { bg: 'bg-brand-lavender', shadow: '#8A6FC9', icon: '📝', priorityKey: 'studioPriorityAiDrafts' }
};

// "Needs your attention" — up to 3 real, actionable items (never filler; the
// backend only sends a kind when its underlying data exists). Priority is
// never color-alone: every card also carries an explicit text pill.
function ActionQueueCard({ item, t, onNavigate }) {
  const style = ACTION_ITEM_STYLE[item.kind];
  let title, explanation, cta, onCta;

  if (item.kind === 'urgent') {
    const topicLabel = item.topic.replace(/^\d+\.\s*/, '');
    title = t.studioActionUrgentTitle.replace('{count}', item.learnerCount).replace('{topic}', topicLabel);
    explanation = t.studioActionUrgentDesc
      .replace('{percent}', item.confidentWrongPercent)
      .replace('{mistakeType}', t[MISTAKE_TYPE_LABEL_KEYS[item.mistakeType]] || item.mistakeType);
    cta = t.studioActionCreateRescue;
    onCta = () => onNavigate('learners-exams', item.cohortId);
  } else if (item.kind === 'courseReview') {
    title = t.studioActionCourseReviewTitle.replace('{title}', item.courseTitle).replace('{score}', item.healthScore);
    explanation = item.topIssueMessage || t.studioActionCourseReviewFallback;
    cta = t.studioActionReviewCourse;
    onCta = () => onNavigate('courses');
  } else {
    title = t.studioActionAiDraftsTitle.replace('{count}', item.count);
    explanation = t.studioActionAiDraftsDesc;
    cta = t.studioActionReviewDrafts;
    onCta = () => onNavigate('courses');
  }

  return (
    <div className={`rounded-[24px] p-5 flex flex-col gap-2.5 ${style.bg}`} style={{ boxShadow: `0 5px 0 ${style.shadow}` }}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{style.icon}</span>
        <span className="font-comic font-extrabold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-lg bg-white/60 text-[#101A24]">{t[style.priorityKey]}</span>
      </div>
      <div className="font-comic font-extrabold text-[14.5px] text-[#101A24] leading-snug">{title}</div>
      <div className="text-[12.5px] font-bold text-[#101A24]/70 leading-snug flex-1">{explanation}</div>
      <button
        onClick={onCta}
        className="mt-1 self-start bg-[#101A24] text-white font-comic font-extrabold text-xs px-4 py-2.5 rounded-2xl"
        style={{ boxShadow: '0 3px 0 rgba(0,0,0,0.25)' }}
      >
        {cta} →
      </button>
    </div>
  );
}

export default function Overview({ onNavigate }) {
  const t = useT();
  const { lang } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOverview().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Card className="text-sm text-red-600">{error}</Card>;
  if (!data) return <Spinner label={t.studioLoading} />;

  const event = data.activeCourses === 0 ? 'EMPTY_COURSE' : 'STUDIO_GREETING';
  const { message: heroMessage } = getStudioLlamaReaction(event, {}, lang);

  const trend = data.mockExamTrend || [];
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const scoreDelta = last && prev ? Math.round(last.averageScore - prev.averageScore) : null;

  // Short, real-data recap under the hero heading (spec: "18 học viên mới,
  // điểm trung bình tăng 4 điểm") — only mentions whichever of the two
  // actually happened this round, never a fabricated number.
  const heroSummarySegments = [];
  if (data.newLearnersThisWeek > 0) heroSummarySegments.push(t.studioHeroSummaryNewLearners.replace('{n}', data.newLearnersThisWeek));
  if (scoreDelta) {
    heroSummarySegments.push((scoreDelta > 0 ? t.studioHeroSummaryScoreUp : t.studioHeroSummaryScoreDown).replace('{n}', Math.abs(scoreDelta)));
  }
  const heroSummary = heroSummarySegments.length
    ? `${t.studioHeroSummaryPrefix} ${heroSummarySegments.join(` ${t.studioHeroSummaryAnd} `)}. ${t.studioHeroSummaryCta}`
    : '';

  const statCards = [
    { icon: '🎓', label: t.studioStatActiveCourses, value: data.activeCourses, bg: 'bg-brand-green', ink: 'text-brand-green-ink', shadow: '#4F9A5A', sub: null, nav: 'courses' },
    { icon: '🙋', label: t.studioStatActiveLearners, value: data.activeLearners, bg: 'bg-brand-cyan', ink: 'text-brand-cyan-ink', shadow: '#3B93A8', sub: null, nav: 'learners-exams' },
    { icon: '🎯', label: t.studioStatAvgScore, value: data.averageMockExamScore ?? '—', bg: 'bg-brand-lavender', ink: 'text-brand-lavender-ink', shadow: '#8A6FC9', sub: deltaLabel(scoreDelta, t), nav: 'learners-exams' },
    { icon: '🚨', label: t.studioStatNeedsAttention, value: data.learnersNeedingAttention ?? '—', bg: 'bg-brand-gold', ink: 'text-brand-gold-ink', shadow: '#B8912E', sub: null, nav: 'learners-exams' }
  ];

  const journey = data.cohortJourney;
  const journeyStages = journey ? journey.stages : [];
  const hasJourney = journey && journey.total > 0;
  let journeyInsight = '';
  if (hasJourney) {
    const modeStage = journeyStages.find((s) => s.key === journey.modeStageKey);
    journeyInsight = t.studioJourneyInsightMode.replace('{stage}', modeStage?.label ?? '');
    const nearSummitStage = journeyStages[journeyStages.length - 2];
    if (nearSummitStage && nearSummitStage.count > 0) {
      journeyInsight += ' ' + t.studioJourneyInsightNearSummit.replace('{count}', nearSummitStage.count);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[32px] p-8 md:p-9"
        style={{ background: 'linear-gradient(120deg, #2563EB 0%, #6D5DD3 55%, #8B7BAE 100%)', boxShadow: '0 10px 0 #17408F, 0 20px 40px -16px rgba(37,99,235,0.4)' }}
      >
        <span className="absolute top-2 right-36 text-3xl hidden md:inline" style={{ animation: 'sparkle 3.2s ease-in-out infinite' }}>✨</span>
        <img src={mascotIllustration} alt="" className="absolute -bottom-3 right-6 w-28 md:w-36 object-contain" style={{ animation: 'bob 3.4s ease-in-out infinite' }} />
        <span className="absolute top-5 right-20 w-3.5 h-3.5 rounded-full bg-white/50 hidden md:inline-block" style={{ animation: 'floatCloud 4s ease-in-out infinite' }} />
        <div className="relative max-w-[62%]">
          <span className="inline-block bg-white/20 text-white font-comic font-bold text-[11px] uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3">
            🎉 {t.studioHeroBadge}
          </span>
          <p className="font-comic font-extrabold text-2xl md:text-[28px] text-white leading-snug">{heroMessage}</p>
          {heroSummary && <p className="text-[13.5px] font-bold text-white/80 leading-snug mt-2.5">{heroSummary}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <button
            key={s.label} onClick={() => onNavigate(s.nav)}
            className={`relative overflow-hidden rounded-[26px] p-5 text-left hover:-translate-y-0.5 transition-transform ${s.bg}`}
            style={{ boxShadow: `0 6px 0 ${s.shadow}` }}
          >
            <span className="absolute -top-2 -right-1 text-5xl opacity-20">{s.icon}</span>
            <div className={`relative text-[11px] font-extrabold uppercase tracking-wide mb-2 ${s.ink}`}>{s.label}</div>
            <div className="relative font-comic font-extrabold text-[28px] md:text-[30px] text-[#101A24]">{s.value}</div>
            {s.sub && <div className={`relative text-xs font-extrabold mt-1 ${s.ink}`}>{s.sub}</div>}
          </button>
        ))}
      </div>

      {/* Trend + Cohort Summit Journey, side by side */}
      <div className={`grid grid-cols-1 gap-6 items-stretch ${hasJourney ? 'lg:grid-cols-2' : ''}`}>
        <Card>
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

        {hasJourney && (
          <div
            className="rounded-[28px] p-6 md:p-7 flex flex-col"
            style={{ background: 'linear-gradient(160deg,#101A24 0%, #1E3A5F 55%, #2B5D6B 100%)', boxShadow: '0 6px 0 rgba(16,26,36,0.2)' }}
          >
            <div className="flex items-start justify-between gap-3.5 flex-wrap mb-1">
              <div>
                <div className="font-comic font-extrabold text-[17px] text-white">🏔️ {t.studioJourneyTitle}</div>
                <div className="text-[12.5px] font-bold text-white/65 mt-1">{t.studioJourneySubtitle} · {t.studioLearnerCountShort.replace('{n}', journey.total)}</div>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-2xl">
                  <span className="text-sm">🚀</span>
                  <span className="font-comic font-extrabold text-xs text-[#9FE870]">{journey.movedForwardCount}</span>
                  <span className="text-[10.5px] font-bold text-white/75">{t.studioJourneyMovedForward}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-2xl">
                  <span className="text-sm">😴</span>
                  <span className="font-comic font-extrabold text-xs text-[#F5C9DA]">{journey.noProgressCount}</span>
                  <span className="text-[10.5px] font-bold text-white/75">{t.studioJourneyNoProgress}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-2xl">
                  <span className="text-sm">🆘</span>
                  <span className="font-comic font-extrabold text-xs text-[#FBE3B0]">{journey.needsInterventionCount}</span>
                  <span className="text-[10.5px] font-bold text-white/75">{t.studioJourneyNeedsIntervention}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex-1">
              <MountainJourney stages={journeyStages} medianStageKey={journey.medianStageKey} />
            </div>

            <div className="mt-4 bg-white/[0.08] rounded-2xl px-4.5 py-3.5 flex items-center gap-2.5">
              <span className="text-xl shrink-0">💡</span>
              <div className="text-[13px] font-bold text-white/90 leading-snug">{journeyInsight}</div>
            </div>
          </div>
        )}
      </div>

      {/* Trainer Action Queue */}
      {data.actionQueue && data.actionQueue.length > 0 && (
        <div>
          <h3 className="font-comic font-extrabold text-[#101A24] mb-3">✅ {t.studioActionQueueTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.actionQueue.map((item) => (
              <ActionQueueCard key={item.kind} item={item} t={t} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}

      {/* Cohort results */}
      <Card>
        <h3 className="font-comic font-extrabold text-[#101A24] mb-4">📊 {t.studioCohortResultsTitle}</h3>
        {data.cohortResults.length === 0 ? (
          <p className="text-sm text-[#888]">{t.studioNoCohortResultsShort}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.cohortResults.map((c, i) => {
              const tier = healthTierStyle(c.passRate);
              return (
                <button
                  key={c.id} onClick={() => onNavigate('learners-exams', c.id)}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F9FAFB] hover:translate-x-0.5 transition-transform text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${CAMP_COLORS[i % CAMP_COLORS.length]}`}>👥</span>
                    <div className="min-w-0">
                      <div className="font-comic font-extrabold text-sm text-[#101A24] truncate">{c.name}</div>
                      <div className="text-xs font-bold text-[#8A8A8A] mt-0.5 truncate">
                        {c.courseTitle} · {t.studioLearnerCountShort.replace('{n}', c.learnerCount)}
                      </div>
                    </div>
                  </div>
                  <span className={`font-comic font-extrabold text-xs px-3.5 py-1.5 rounded-2xl shrink-0 ${tier.bg} ${tier.text}`}>
                    {c.passRate != null ? `${t.studioAvgScore} ${c.averageScore} · ${t.studioPassRate} ${c.passRate}%` : t.studioCohortResultsNoData}
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
