import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { generateExamReport, topicLabel, pickFlashcardTip } from '../llamaResponses';

const TIER_COLORS = {
  weak: { bar: '#EF4444', shadow: '#B91C1C', label: 'Yếu', emoji: '🔴' },
  mid: { bar: '#FFCF56', shadow: '#E0A82E', label: 'Cần ôn thêm', emoji: '🟡' },
  strong: { bar: '#2563EB', shadow: '#17408F', label: 'Vững', emoji: '🟢' }
};

function computeTopicStats(answers) {
  const byTopic = {};
  answers.forEach((a) => {
    const key = a.question.topic || '';
    if (!byTopic[key]) byTopic[key] = { correct: 0, total: 0 };
    byTopic[key].total += 1;
    if (a.isCorrect) byTopic[key].correct += 1;
  });
  return Object.entries(byTopic)
    .map(([key, { correct, total }]) => ({ topicKey: key, topic: topicLabel(key), correct, total, pct: Math.round((correct / total) * 100) }))
    .sort((a, b) => a.pct - b.pct);
}

// Renders the full exam study report (ratio, topic chart, Llama assessment,
// clickable roadmap, per-question detail) — used both right after finishing
// an exam and when reopening a past attempt from "Lịch sử thi thử".
export default function ExamReport({ examAnswers, onStudyTopic }) {
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  if (!examAnswers || examAnswers.length === 0) return null;

  const fs = examAnswers.filter((a) => a.isCorrect).length;
  const wrongCount = examAnswers.length - fs;
  const pct = Math.round((fs / examAnswers.length) * 100);
  const topicStats = computeTopicStats(examAnswers);
  const report = generateExamReport(topicStats, pct);

  return (
    <div className="text-left">
      <p className="text-xl font-extrabold uppercase tracking-widest text-[#101A24] mb-5">📊 Báo cáo học tập</p>

      {/* Correct/wrong ratio */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-2 text-sm font-extrabold text-[#101A24]">
          <span>✅ Đúng: {fs} câu</span>
          <span>❌ Sai: {wrongCount} câu</span>
        </div>
        <div className="h-6 rounded-full overflow-hidden flex bg-[#F0EFE9]" style={{ boxShadow: 'inset 0 2px 4px rgba(16,26,36,0.1)' }}>
          {fs > 0 && <div style={{ width: `${(fs / examAnswers.length) * 100}%`, background: '#2563EB' }} />}
          {wrongCount > 0 && <div style={{ width: `${(wrongCount / examAnswers.length) * 100}%`, background: '#EF4444', marginLeft: fs > 0 ? '2px' : 0 }} />}
        </div>
      </div>

      {/* Per-topic strength/weakness chart */}
      <p className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] mb-3">Lĩnh vực mạnh / yếu</p>
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
              <div className="h-5 rounded-full overflow-hidden bg-[#F0EFE9]" style={{ boxShadow: 'inset 0 1px 3px rgba(16,26,36,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${ts.pct}%`, background: c.bar, boxShadow: `0 2px 0 ${c.shadow}` }} />
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
      <div className="bg-[#101A24] rounded-2xl p-6 text-white mb-7">
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
        <p className="text-sm font-extrabold uppercase tracking-widest text-[#101A24] mb-1">🗺️ Lộ trình đề xuất</p>
        {report.roadmap.length === 0 ? (
          <p className="text-sm font-bold text-[#5C5C5C] mt-2">Không có lĩnh vực nào đáng lo cả! Ôn lại tổng quan một lượt trước khi thi thật là đủ rồi, xạ thủ ạ! 🎯</p>
        ) : (
          <>
            <p className="text-xs font-bold text-[#8A8A8A] mb-3">Bấm vào từng chương để vào Thẻ bài ôn lại nhé!</p>
            <ol className="flex flex-col gap-2.5">
              {report.roadmap.map((item, i) => {
                const c = TIER_COLORS[item.tier];
                return (
                  <li key={item.topicKey}>
                    <button
                      onClick={() => onStudyTopic?.(item.topicKey)}
                      className="w-full flex items-center gap-3.5 text-left border-none cursor-pointer bg-white rounded-2xl py-3.5 px-4 transition-transform hover:-translate-y-0.5"
                      style={{ boxShadow: `0 3px 0 ${c.shadow}` }}
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
        className="w-full border-none cursor-pointer bg-white rounded-2xl py-3.5 font-comic font-extrabold text-sm text-[#101A24] mb-4"
        style={{ boxShadow: '0 3px 0 rgba(16,26,36,0.1)' }}
      >
        {showDetailedReport ? '▲ Ẩn báo cáo chi tiết' : '📋 Xem báo cáo chi tiết từng câu'}
      </button>

      {showDetailedReport && (
        <div className="flex flex-col gap-4">
          {examAnswers.map((a, i) => {
            const tip = pickFlashcardTip({ term: a.question.options[a.question.correct_index] });
            return (
              <div key={i} className={`p-6 rounded-2xl border border-[#101A24]/10 shadow-sm ${a.isCorrect ? 'bg-[#EFFBEA]' : 'bg-[#FFF1EC]'}`}>
                <p className="font-comic font-extrabold text-sm text-[#101A24] mb-1">Câu {i + 1}</p>
                <p className="font-bold text-base text-[#101A24] leading-snug mb-3">{a.question.question}</p>
                {a.isCorrect ? (
                  <p className="text-sm font-extrabold text-[#4B9A1E] mb-3">✓ Bạn đã trả lời đúng: {a.question.options[a.question.correct_index]}</p>
                ) : (
                  <>
                    <p className="text-sm font-extrabold text-[#D9603F] mb-1">✕ Bạn chọn: {a.question.options[a.selected]}</p>
                    <p className="text-sm font-extrabold text-[#4B9A1E] mb-3">✓ Đáp án đúng: {a.question.options[a.question.correct_index]}</p>
                  </>
                )}
                <div className="bg-white rounded-xl p-4 mb-3">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#101A24] mb-1">Giải thích</p>
                  <p className="text-sm font-bold text-[#3A3A3A] leading-relaxed">{a.question.explanation}</p>
                </div>
                <div className="flex items-start gap-2 bg-[#FFF9E8] rounded-xl px-4 py-3">
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
