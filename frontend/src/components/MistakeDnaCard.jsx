import { useT } from '../translations';
import { Sparkles } from 'lucide-react';

// Inline Mistake DNA reveal (spec §7) — merged into the existing answer
// feedback popup rather than a second popup, per "avoid showing too many
// popups" (spec §14).
export default function MistakeDnaCard({ mistakeDNA, aiExplanation }) {
  const t = useT();
  if (!mistakeDNA) return null;

  return (
    <div className="text-left bg-[#F4EDFA] rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} strokeWidth={3} className="text-[#8A6FC9]" />
        <span className="text-xs font-extrabold text-[#8A6FC9] uppercase tracking-widest">{t.mistakeDnaTitle}</span>
      </div>
      <p className="text-sm font-extrabold text-[#101A24] mb-1">
        {t.mistakeTypeLabel} <span className="text-[#8A6FC9]">{mistakeDNA.label}</span>
      </p>
      {aiExplanation && <p className="text-sm font-bold text-[#5C5C5C] leading-relaxed">{aiExplanation}</p>}
    </div>
  );
}
