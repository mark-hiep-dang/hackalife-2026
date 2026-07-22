import { useState, useEffect } from 'react';
import { getLearnerProfile } from '../../utils/studioApi';
import { Card, Spinner, RiskBadge, PatternBadge, Sparkline, TopicBarList, EmptyState } from '../components/ui';
import { GaugeChart, RoundScoreChart } from '../components/charts';
import RescueExpeditionFlow from '../components/RescueExpeditionFlow';
import { ArrowLeft, X } from 'lucide-react';
import { useT } from '../../translations';

function initials(name) {
  return (name || '').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// The AI-generated insight occasionally signs off with its own emoji, which
// would double up on the 🦙 icon we render ourselves — strip one from either
// edge before displaying.
function stripEdgeEmoji(text) {
  if (!text) return text;
  return text.replace(/^\p{Extended_Pictographic}️?\s*|\s*\p{Extended_Pictographic}️?$/gu, '').trim();
}

const INTERVENTION_STYLE = { inProgress: 'bg-[#B9E7EF] text-[#101A24]', completed: 'bg-[#C7EFC4] text-[#101A24]' };

export default function LearnerProfile({ learnerId, cohortId, onBack }) {
  const t = useT();
  const TREND_LABEL = {
    high_stable: t.studioTrendHighStable, improving: t.studioTrendImproving, plateauing: t.studioTrendPlateauing,
    declining: t.studioTrendDeclining, inconsistent: t.studioTrendInconsistent, insufficient_data: t.studioTrendInsufficientData
  };
  const [data, setData] = useState(null);
  const [rescueTopic, setRescueTopic] = useState(null);
  useEffect(() => { setData(null); getLearnerProfile(learnerId).then(setData); }, [learnerId]);
  if (!data) return <Spinner label={t.studioLoading} />;

  const targetScore = data.targetScore ?? 70;
  const history = data.mockExamHistory || [];
  const passCount = history.filter((s) => s >= targetScore).length;
  const passRate = history.length ? Math.round((passCount / history.length) * 100) : null;
  const latestPass = data.latestScore != null && data.latestScore >= targetScore;
  const rounds = history.map((score, i) => ({ round: i + 1, score }));

  const topics = data.topicPerformance || [];
  const weakChips = topics.slice(0, 3);
  const strongTopic = topics[topics.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-comic font-extrabold text-[#101A24] w-fit"><ArrowLeft size={16} /> {t.studioBack}</button>

      <Card className="flex items-start justify-between gap-5 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-[#E3D9F5] flex items-center justify-center font-comic font-extrabold text-xl text-[#101A24] shrink-0">
            {initials(data.learner.username)}
          </div>
          <div className="min-w-0">
            <h2 className="font-comic font-extrabold text-2xl text-[#101A24] mb-1.5">{data.learner.username}</h2>
            <p className="text-sm font-bold text-[#666] leading-relaxed max-w-xl">🦙 {stripEdgeEmoji(data.insight)}</p>
          </div>
        </div>
        <RiskBadge status={data.riskStatus} />
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center gap-1 !p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888] self-start">🎯 {t.studioPassRate}</span>
          <GaugeChart value={passRate} label={t.studioExamsPassedCaption.replace('{passCount}', passCount).replace('{total}', history.length)} size={140} />
        </Card>
        <Card className="!p-4 flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{t.studioLatestScore}</span>
          <span className="font-comic font-extrabold text-[32px] text-[#101A24]">{data.latestScore ?? '—'}{data.latestScore != null && <span className="text-base text-[#B4B4B4]">%</span>}</span>
          {data.latestScore != null && (
            <span className="text-[11px] font-bold" style={{ color: latestPass ? '#1E9E5A' : '#D14343' }}>
              {latestPass ? t.studioPassedLabel : t.studioBelowPassMarkLabel}
            </span>
          )}
        </Card>
        <Card className="!p-4 flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{t.studioTrendLabel}</span>
          <Sparkline points={history} width={100} height={30} />
          <span className="text-[13px] font-comic font-extrabold text-[#101A24]">{TREND_LABEL[data.scoreTrend] || data.scoreTrend}</span>
        </Card>
        <Card className="!p-4 flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#888]">{t.studioCommonMistake}</span>
          <span className="font-comic font-bold text-[15px] text-[#101A24] leading-snug mt-1">{data.commonMistakeType || '—'}</span>
        </Card>
      </div>

      {(data.outlierPatterns || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.outlierPatterns.map((p) => <PatternBadge key={p.type} type={p.type} title={p.reason} />)}
        </div>
      )}

      <Card>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
          <h3 className="font-comic font-extrabold text-[#101A24]">📈 {t.studioExamHistory}</h3>
          <span className="text-xs font-bold text-[#888]">{t.studioPassMarkCaption.replace('{score}', targetScore)}</span>
        </div>
        <RoundScoreChart rounds={rounds} targetScore={targetScore} emptyMessage={t.studioNoTrendData} />
      </Card>

      <Card>
        <h3 className="font-comic font-extrabold text-[#101A24] mb-1">{t.studioStrengthsWeaknessesTitle}</h3>
        <p className="text-xs font-bold text-[#888] mb-4">{t.studioStrengthsWeaknessesSubtitle}</p>
        {topics.length === 0 ? <EmptyState>{t.studioNoWeakTopics}</EmptyState> : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-[11px] font-extrabold text-[#888] mr-0.5">{t.studioWeakChipsLabel}</span>
              {weakChips.map((w) => (
                <span key={w.topic} className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-[#F5C9DA] text-[#101A24]">{w.topic.replace(/^\d+\.\s*/, '')}</span>
              ))}
              {strongTopic && (
                <>
                  <span className="text-[11px] font-extrabold text-[#888] ml-2 mr-0.5">{t.studioStrongChipLabel}</span>
                  <span className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-[#FBE3B0] text-[#101A24]">{strongTopic.topic.replace(/^\d+\.\s*/, '')}</span>
                </>
              )}
            </div>
            <TopicBarList
              topics={topics}
              bandLabels={{ weak: t.studioTopicBandWeak, fair: t.studioTopicBandFair, good: t.studioTopicBandGood }}
            />
          </>
        )}
      </Card>

      <Card>
        <h3 className="font-comic font-extrabold text-[#101A24] mb-4">📋 {t.studioAssignedInterventions}</h3>
        {data.interventions.length === 0 ? (
          <EmptyState>{t.studioNoInterventionsYet}</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {data.interventions.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#F9FAFB]">
                <span className="font-comic font-bold text-sm text-[#101A24]">{iv.title}</span>
                <span className={`text-[11px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-lg shrink-0 ${iv.completed_at ? INTERVENTION_STYLE.completed : INTERVENTION_STYLE.inProgress}`}>
                  {iv.completed_at ? t.studioCompleted : t.studioInProgress}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {cohortId && topics[0] && (
        <button onClick={() => setRescueTopic(topics[0])}
          className="self-start flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#E3D9F5] text-[#101A24] font-comic font-extrabold text-sm hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: '0 4px 0 #B7A3DE' }}
        >
          {t.studioCreateRescueForWeakest}
        </button>
      )}

      {rescueTopic && (
        <div className="fixed inset-0 z-50 bg-[#101A24]/40 flex items-center justify-center p-4" onClick={() => setRescueTopic(null)}>
          <div className="bg-[#F4F1FB] rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setRescueTopic(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <X size={16} />
            </button>
            <RescueExpeditionFlow cohortId={cohortId} topic={rescueTopic} t={t} onClose={() => setRescueTopic(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
