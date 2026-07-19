import { Sparkles, Brain, HandHelping, AlertTriangle, PartyPopper, ClipboardCheck, ThumbsUp } from 'lucide-react';
import { getStudioLlamaReaction } from '../../studioPersonality';

const MOOD_STYLE = {
  welcoming: { icon: Sparkles, bg: 'bg-[#E3D9F5]' },
  thinking: { icon: Brain, bg: 'bg-[#B9E7EF]' },
  helpful: { icon: HandHelping, bg: 'bg-[#C7EFC4]' },
  concerned: { icon: AlertTriangle, bg: 'bg-[#FBE3B0]' },
  celebrating: { icon: PartyPopper, bg: 'bg-[#F5C9DA]' },
  reviewing: { icon: ClipboardCheck, bg: 'bg-[#B9E7EF]' },
  encouraging: { icon: ThumbsUp, bg: 'bg-[#C7EFC4]' }
};

export default function StudioLlamaBubble({ event, context, className = '' }) {
  const { message, mood, secondaryMessage } = getStudioLlamaReaction(event, context);
  if (!message) return null;
  const style = MOOD_STYLE[mood] || MOOD_STYLE.helpful;
  const Icon = style.icon;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border border-[#101A24]/10 shadow-sm ${style.bg} ${className}`}>
      <div className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center shrink-0 border border-[#101A24]/10">
        <Icon size={18} strokeWidth={2.5} className="text-[#101A24]" />
      </div>
      <div className="text-sm font-semibold text-[#101A24] leading-snug">
        <p>{message}</p>
        {secondaryMessage && <p className="mt-1 opacity-80">{secondaryMessage}</p>}
      </div>
    </div>
  );
}
