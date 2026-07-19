import { useT, useLanguage } from '../translations';
import { getLlamaReaction } from '../llamaPersonality';
import llamaCheer from '../assets/llama-cheer.webp';

function stripTopicIndex(topic) {
  return topic ? topic.replace(/^\d+\.\s*/, '') : '';
}

// Shown only on meaningful adaptive-path moments (spec §10): a mastery-state
// crossing, a new Rescue Trail, or an unlocked camp — never after every
// minor answer.
export default function PathUpdatedModal({ masteryUpdate, onClose, onViewMap }) {
  const t = useT();
  const { lang } = useLanguage();
  const reaction = getLlamaReaction('PATH_UPDATED', { lang });

  return (
    <div className="fixed inset-0 z-[9999] bg-[#101A24]/55 flex items-center justify-center p-5">
      <div className="bounce-in bg-white w-full max-w-md rounded-[2rem] p-8 text-center" style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}>
        <img src={llamaCheer} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
        <h3 className="font-comic font-extrabold text-2xl text-[#101A24] uppercase mb-3">{t.pathUpdatedTitle}</h3>
        <p className="text-sm font-bold text-[#5C5C5C] mb-5 leading-relaxed">{reaction.message}</p>

        {masteryUpdate && (
          <div className="bg-[#EEF9EE] rounded-2xl p-5 mb-6 text-left">
            <p className="text-xs font-extrabold text-[#4F9A5A] uppercase tracking-widest mb-2">
              {stripTopicIndex(masteryUpdate.topic)}
            </p>
            <p className="font-comic font-extrabold text-xl text-[#101A24]">
              {Math.round(masteryUpdate.previousMastery)}% → {Math.round(masteryUpdate.newMastery)}%
            </p>
            <p className="text-xs font-bold text-[#8A8A8A] mt-1">{masteryUpdate.previousState} → {masteryUpdate.newState}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-pro bg-[#EEF0F3] text-[#101A24] py-3.5">
            {t.campCloseBtn}
          </button>
          <button onClick={() => { onViewMap?.(); onClose(); }} className="flex-[2] btn-pro bg-[#4C6FC4] text-white py-3.5">
            {t.pathUpdatedViewMapBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
