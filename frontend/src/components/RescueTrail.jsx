import { useState, useEffect } from 'react';
import { useT } from '../translations';
import { getRescueTrail, completeRescueTrail } from '../utils/api';
import { ArrowRight, Lightbulb } from 'lucide-react';
import llamaCheer from '../assets/llama-cheer.webp';

function stripTopicIndex(topic) {
  return topic ? topic.replace(/^\d+\.\s*/, '') : '';
}

// A short, focused remediation flow (spec §11): explanation → concept
// comparison → 1 flashcard → 1 easier question → 1 similar question →
// checkpoint. Reuses the existing question/flashcard content, just
// reassembled — not a separate large module.
export default function RescueTrail({ topic, mistakeType, onDone }) {
  const t = useT();
  const [trail, setTrail] = useState(null);
  const [step, setStep] = useState(0); // 0: intro, 1: flashcard, 2: easier, 3: similar, 4: checkpoint, 5: done
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    getRescueTrail(topic, mistakeType).then(setTrail).catch(() => {});
  }, [topic, mistakeType]);

  if (!trail) return null;

  const steps = ['intro', 'flashcard', 'easierQuestion', 'similarQuestion', 'checkpointQuestion', 'done'].filter(
    (s) => s === 'intro' || s === 'done' || trail[s]
  );
  const currentKey = steps[step];

  function advance() {
    setSelected(null); setAnswered(false); setFlipped(false);
    if (step < steps.length - 1) setStep((s) => s + 1);
  }

  async function handleFinish() {
    try { await completeRescueTrail(); } catch { /* non-fatal */ }
    onDone?.();
  }

  function renderQuestion(q) {
    return (
      <div className="bg-white rounded-[2rem] p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <h3 className="font-comic font-extrabold text-lg text-[#101A24] leading-snug mb-6">{q.question}</h3>
        <div className="flex flex-col gap-3 mb-4">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct_index;
            let style = 'bg-[#EEF0F3] text-[#101A24]';
            if (answered) {
              if (isCorrect) style = 'bg-[#6B8AD6] text-white';
              else if (i === selected) style = 'bg-[#D9695F] text-white';
              else style = 'bg-[#F3ECDD] text-[#A69B87]';
            }
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => { setSelected(i); setAnswered(true); }}
                className={`text-left rounded-2xl py-3.5 px-5 font-bold text-sm transition-transform hover:-translate-y-0.5 border-none cursor-pointer ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <>
            <p className="text-sm font-bold text-[#5C5C5C] mb-4">{q.explanation}</p>
            <button onClick={advance} className="btn-pro bg-[#B9E7EF] text-[#20606E] w-full py-3.5">
              {t.nextQuestionBtn} <ArrowRight size={18} strokeWidth={3} className="inline ml-1" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pop-in max-w-2xl mx-auto w-full">
      <h2 className="font-comic font-extrabold text-2xl text-[#101A24] uppercase tracking-wide mb-1">
        🧗 {t.rescueTrailTitle}: {stripTopicIndex(topic)}
      </h2>

      {currentKey === 'intro' && (
        <div className="bg-white rounded-[2rem] p-8 mt-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-5">
            <img src={llamaCheer} alt="" className="w-14 h-14 rounded-full object-cover" />
            <p className="font-comic font-bold text-base text-[#101A24]">{trail.introduction}</p>
          </div>

          {trail.conceptPair && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#EFF6FF] rounded-2xl p-4">
                <p className="font-comic font-extrabold text-sm text-[#4C6FC4] mb-1">{trail.conceptPair.left.name}</p>
                <p className="text-xs font-bold text-[#101A24]">{trail.conceptPair.left.desc}</p>
              </div>
              <div className="bg-[#FFF3E9] rounded-2xl p-4">
                <p className="font-comic font-extrabold text-sm text-[#C2703F] mb-1">{trail.conceptPair.right.name}</p>
                <p className="text-xs font-bold text-[#101A24]">{trail.conceptPair.right.desc}</p>
              </div>
            </div>
          )}

          <button onClick={advance} className="btn-pro bg-[#101A24] text-white w-full py-4 text-lg">
            {t.expeditionStartBtn}
          </button>
        </div>
      )}

      {currentKey === 'flashcard' && (
        <div className="mt-4">
          <p className="text-xs font-extrabold text-[#8A6D1F] uppercase tracking-widest mb-2">{t.rescueTrailFlashcardLabel}</p>
          <div
            className="relative cursor-pointer bg-white rounded-[2rem] p-8 text-center min-h-[180px] flex items-center justify-center"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            onClick={() => setFlipped((f) => !f)}
          >
            <p className="font-bold text-base text-[#101A24]">{flipped ? trail.flashcard.back : trail.flashcard.front}</p>
          </div>
          {flipped && (
            <button onClick={advance} className="btn-pro bg-[#B9E7EF] text-[#20606E] w-full py-3.5 mt-4">
              {t.nextQuestionBtn} <ArrowRight size={18} strokeWidth={3} className="inline ml-1" />
            </button>
          )}
        </div>
      )}

      {currentKey === 'easierQuestion' && (
        <div className="mt-4">
          <p className="text-xs font-extrabold text-[#8A6D1F] uppercase tracking-widest mb-2">{t.rescueTrailEasierLabel}</p>
          {renderQuestion(trail.easierQuestion)}
        </div>
      )}

      {currentKey === 'similarQuestion' && (
        <div className="mt-4">
          <p className="text-xs font-extrabold text-[#8A6D1F] uppercase tracking-widest mb-2">{t.rescueTrailSimilarLabel}</p>
          {renderQuestion(trail.similarQuestion)}
        </div>
      )}

      {currentKey === 'checkpointQuestion' && (
        <div className="mt-4">
          <p className="text-xs font-extrabold text-[#8A6D1F] uppercase tracking-widest mb-2">{t.rescueTrailCheckpointLabel}</p>
          {renderQuestion(trail.checkpointQuestion)}
        </div>
      )}

      {currentKey === 'done' && (
        <div className="bg-white rounded-[2rem] p-8 mt-4 text-center" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Lightbulb size={28} strokeWidth={3} className="text-[#4F9A5A]" />
            <p className="font-comic font-extrabold text-lg text-[#101A24]">{trail.outro}</p>
          </div>
          <button onClick={handleFinish} className="btn-pro bg-[#C7EFC4] text-[#2F5C37] w-full py-4 text-lg">
            {t.rescueTrailCompleteBtn}
          </button>
        </div>
      )}
    </div>
  );
}
