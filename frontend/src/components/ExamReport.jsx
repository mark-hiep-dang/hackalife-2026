import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { generateExamReport, topicLabel, pickFlashcardTip } from '../llamaResponses';
import { useT, useLanguage } from '../translations';

function computeTopicStats(answers, lang) {
  const byTopic = {};
  answers.forEach((a) => {
    const key = a.question.topic || '';
    if (!byTopic[key]) byTopic[key] = { correct: 0, total: 0 };
    byTopic[key].total += 1;
    if (a.isCorrect) byTopic[key].correct += 1;
  });
  return Object.entries(byTopic)
    .map(([key, { correct, total }]) => ({ topicKey: key, topic: topicLabel(key, lang), correct, total, pct: Math.round((correct / total) * 100) }))
    .sort((a, b) => a.pct - b.pct);
}

// Renders the full exam study report (ratio, topic chart, Llama assessment,
// clickable roadmap, per-question detail) — used both right after finishing
// an exam and when reopening a past attempt from "Lịch sử thi thử".
export default function ExamReport({ examAnswers, onStudyTopic }) {
  const t = useT();
  const { lang } = useLanguage();
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  const TIER_COLORS = {
    weak: { bar: '#E4897E', label: t.tierWeak, emoji: '🔴' },
    mid: { bar: '#F0C468', label: t.tierMid, emoji: '🟡' },
    strong: { bar: '#7C9AE0', label: t.tierStrong, emoji: '🟢' }
  };

  if (!examAnswers || examAnswers.length === 0) return null;

  const fs = examAnswers.filter((a) => a.isCorrect).length;
  const wrongCount = examAnswers.length - fs;
  const pct = Math.round((fs / examAnswers.length) * 100);
  const topicStats = computeTopicStats(examAnswers, lang);
  const report = generateExamReport(topicStats, pct, lang);

  return (
    <div className="text-left">
      <p className="text-xl font-extrabold uppercase tracking-widest text-[#101A24] mb-5">{t.reportTitle}</p>

      {/* Correct/wrong ratio */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-2 text-sm font-extrabold text-[#101A24]">
          <span>{t.reportCorrectCount.replace('{n}', fs)}</span>
          <span>{t.reportWrongCount.replace('{n}', wrongCount)}</span>
        </div>
        <div className="h-6 rounded-full overflow-hidden flex bg-[#F3ECDD]" style={{ boxShadow: 'inset 0 2px 4px rgba(16,26,36,0.06)' }}>
          {fs > 0 && <div style={{ width: `${(fs / examAnswers.length) * 100}%`, background: '#7C9AE0' }} />}
          {wrongCount > 0 && <div style={{ width: `${(wrongCount / examAnswers.length) * 100}%`, background: '#E4897E', marginLeft: fs > 0 ? '2px' : 0 }} />}
        </div>
      </div>

      {/* Per-topic strength/weakness chart */}
      <p className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] mb-3">{t.reportStrengthChart}</p>
      <div className="flex flex-col gap-3 mb-4">
        {topicStats.map((ts) => {
          const tier = ts.pct < 40 ? 'weak' : ts.pct < 70 ? 'mid' : 'strong';
          const c = TIER_COLORS[tier];
          return (
            <div key={ts.topic}>
              <div className="flex items-center justify-between text-xs font-bold text-[#101A24] mb-1 gap-2">
                <span className="truncate">{ts.topic}</span>
                <span className="shrink-0 font-comic font-extrabold">{ts.correct}/{ts.total} ({ts.pct}%)</span>
              </div>
              <div className="h-5 rounded-full overflow-hidden bg-[#F3ECDD]" style={{ boxShadow: 'inset 0 1px 3px rgba(16,26,36,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${ts.pct}%`, background: c.bar }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 flex-wrap mb-7 text-xs font-bold text-[#5C5C5C]">
        {Object.values(TIER_COLORS).map((c) => (
          <span key={c.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.bar }} />
            {c.label}
          </span>
        ))}
      </div>

      {/* Llama's assessment */}
      <div className="bg-[#E3D9F5] rounded-2xl p-6 text-[#101A24] mb-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <p className="font-comic font-extrabold text-base mb-4 leading-relaxed">{report.opener}</p>
        <div className="flex flex-col gap-2">
          {report.lines.map((line) => (
            <p key={line.topic} className="text-sm font-bold leading-relaxed">
              {TIER_COLORS[line.tier].emoji} <strong>{line.topic}</strong> ({line.correct}/{line.total} - {line.pct}%): {line.remark}
            </p>
          ))}
        </div>
      </div>

      {/* Roadmap — separate, ordered, clickable straight into the matching flashcard deck */}
      <div className="mb-7">
        <p className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] mb-1">{t.reportRoadmapTitle}</p>
        {report.roadmap.length === 0 ? (
          <p className="text-sm font-bold text-[#5C5C5C] mt-2">{t.reportRoadmapEmpty}</p>
        ) : (
          <>
            <p className="text-xs font-bold text-[#8A8A8A] mb-3">{t.reportRoadmapHint}</p>
            <ol className="flex flex-col gap-2.5">
              {report.roadmap.map((item, i) => {
                const c = TIER_COLORS[item.tier];
                return (
                  <li key={item.topicKey}>
                    <button
                      onClick={() => onStudyTopic?.(item.topicKey)}
                      className="w-full flex items-center gap-3.5 text-left border-none cursor-pointer bg-white rounded-2xl py-3.5 px-4 transition-transform hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center font-comic font-extrabold text-xs text-white shrink-0"
                        style={{ background: c.bar }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-comic font-extrabold text-sm text-[#101A24] truncate">{item.topic}</p>
                        <p className="text-xs font-bold" style={{ color: c.bar }}>{c.label} · {item.correct}/{item.total} ({item.pct}%)</p>
                      </div>
                      <ArrowRight size={20} strokeWidth={3} className="shrink-0 text-[#8A8A8A]" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {/* Detailed per-question report */}
      <button
        onClick={() => setShowDetailedReport((v) => !v)}
        className="w-full border-none cursor-pointer bg-white rounded-2xl py-3.5 font-comic font-extrabold text-sm text-[#101A24] mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      >
        {showDetailedReport ? t.reportHideDetail : t.reportShowDetail}
      </button>

      {showDetailedReport && (
        <div className="flex flex-col gap-4">
          {examAnswers.map((a, i) => {
            const tip = pickFlashcardTip({ term: a.question.options[a.question.correct_index], lang });
            return (
              <div key={i} className={`p-6 rounded-2xl border border-[#101A24]/10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${a.isCorrect ? 'bg-[#E7F5E5]' : 'bg-[#FBEAE6]'}`}>
                <p className="font-comic font-extrabold text-sm text-[#101A24] mb-1">{t.reportQuestionLabel.replace('{n}', i + 1)}</p>
                <p className="font-bold text-base text-[#101A24] leading-snug mb-3">{a.question.question}</p>
                {a.isCorrect ? (
                  <p className="text-sm font-extrabold text-[#4F9A5A] mb-3">{t.reportYourCorrectAnswer.replace('{answer}', a.question.options[a.question.correct_index])}</p>
                ) : (
                  <>
                    <p className="text-sm font-extrabold text-[#C46A4F] mb-1">{t.reportYourWrongAnswer.replace('{answer}', a.question.options[a.selected])}</p>
                    <p className="text-sm font-extrabold text-[#4F9A5A] mb-3">{t.reportCorrectAnswer.replace('{answer}', a.question.options[a.question.correct_index])}</p>
                  </>
                )}
                <div className="bg-white rounded-xl p-4 mb-3">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#101A24] mb-1">{t.reportExplanation}</p>
                  <p className="text-sm font-bold text-[#3A3A3A] leading-relaxed">{a.question.explanation}</p>
                </div>
                <div className="flex items-start gap-2 bg-[#FCEFD0] rounded-xl px-4 py-3">
                  <span className="text-lg shrink-0">🦙</span>
                  <p className="text-xs font-bold text-[#8A6D1F] leading-relaxed">{tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
