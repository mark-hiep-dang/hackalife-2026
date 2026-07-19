// Centralized Llama personality/reaction service (spec §3). Every UI moment
// that needs Llama to "say something" goes through getLlamaReaction(event,
// context) instead of a component picking its own random string — this is
// what keeps the voice consistent and lets one file own the tone rules:
// playful but not childish, encouraging but honest, never guilt-tripping over
// a lost streak, never promising a pass.
//
// @typedef {"happy"|"excited"|"thinking"|"concerned"|"rescue"|"celebrating"|"sleepy"|"encouraging"} LlamaMood
// @typedef {"GREETING"|"CORRECT_ANSWER"|"WRONG_ANSWER"|"HIGH_CONFIDENCE_MISTAKE"|"MASTERY_IMPROVED"|"PATH_UPDATED"|"DAILY_EXPEDITION_COMPLETED"|"STREAK_CONTINUED"|"STREAK_LOST"|"CAMP_COMPLETED"|"SUMMIT_APPROACHING"|"INACTIVE_RETURN"} LlamaEvent

import { getRandomWelcomeMessage, getNagTier } from './nagMessages';
import { pickCorrectResponse, pickWrongResponse } from './llamaResponses';

function pick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

const HIGH_CONFIDENCE_MISTAKE_POOL = {
  vi: [
    'Bạn chọn rất tự tin, nhưng viên đá này là đá giả đó!',
    'Đây không phải thiếu kiến thức hoàn toàn. Có vẻ hai khái niệm đang đổi áo cho nhau.',
    'Chắc như đinh đóng cột, nhưng đóng nhầm chỗ rồi. Llama gỡ giúp nhé.',
    'Tự tin đó là tốt, chỉ là lần này tự tin nhầm hướng thôi.'
  ],
  en: [
    'You picked that with total confidence — but that rock was a fake!',
    "This isn't a knowledge gap. Looks like two concepts swapped clothes on you.",
    'Confident as can be, just aimed at the wrong spot. Llama will help untangle it.',
    'Confidence is good — just pointed the wrong way this time.'
  ]
};

const MASTERY_IMPROVED_POOL = {
  vi: [
    'Khoan, ai vừa tăng từ {from}% lên {to}% thế này?',
    'Có tiến triển rõ nha. Trại tiếp theo bắt đầu hơi lo rồi đó.',
    '{topic} đang lên tay thấy rõ. Llama ghi nhận!'
  ],
  en: [
    'Wait, who just went from {from}% to {to}%?',
    'Clear progress right there. The next camp is starting to worry.',
    '{topic} is visibly leveling up. Llama takes note!'
  ]
};

const PATH_UPDATED_POOL = {
  vi: [
    'Llama vừa đổi đường! Đường cũ hơi vòng, mình đi lối này nhanh hơn.',
    'Bản đồ đã được cập nhật. Llama thêm một chặng cứu hộ trước khi leo tiếp.'
  ],
  en: [
    "Llama just switched routes! The old path was a detour — this way's faster.",
    "The map's been updated. Llama added a rescue leg before we keep climbing."
  ]
};

const DAILY_EXPEDITION_COMPLETED_POOL = {
  vi: [
    'Chốt sổ hôm nay! Bạn đã leo thêm một đoạn, còn Llama được nghỉ chân.',
    'Daily Expedition hoàn thành. Não đã tập gym đủ buổi hôm nay.'
  ],
  en: [
    "That's a wrap for today! You climbed further, and Llama gets to rest.",
    "Daily Expedition complete. Your brain got its workout in today."
  ]
};

const STREAK_CONTINUED_POOL = {
  vi: [
    'Chuỗi {streak} ngày vẫn đang cháy! Llama theo không kịp luôn.',
    '{streak} ngày liên tiếp rồi đó. Giữ nhịp này là quá ổn!'
  ],
  en: [
    "Your {streak}-day streak is still burning! Llama can barely keep up.",
    "{streak} days in a row now. Keeping this pace is solid!"
  ]
};

// No guilt-tripping — a lost streak is just a fact, not a failure.
const STREAK_LOST_POOL = {
  vi: [
    'Chuỗi ngày reset về 1 rồi, không sao cả. Bắt đầu lại thôi!',
    'Streak cũ đã nghỉ, streak mới bắt đầu từ hôm nay. Đi tiếp nào!'
  ],
  en: [
    "Streak reset to 1 — no big deal. Let's start again!",
    "The old streak took a break, a new one starts today. Onward!"
  ]
};

const CAMP_COMPLETED_POOL = {
  vi: ['Cắm cờ thành công! Trại này chính thức thuộc về bạn.', '{camp} xong xuôi! Llama cắm cờ ăn mừng liền.'],
  en: ['Flag planted! This camp officially belongs to you now.', "{camp} is done! Llama's planting the flag already."]
};

const SUMMIT_APPROACHING_POOL = {
  vi: [
    'Đỉnh ở ngay trước mặt rồi. Đừng nhìn xuống, nhìn điểm Readiness thôi.',
    'Gần tới Summit lắm rồi. Llama chuẩn bị sẵn cờ đây!'
  ],
  en: ["The summit is right there. Don't look down — just watch your Readiness score.", 'Almost at the Summit. Llama has the flag ready!']
};

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

/**
 * @param {LlamaEvent} event
 * @param {object} [context]
 * @returns {{ message: string, mood: LlamaMood, animation?: string }}
 */
export function getLlamaReaction(event, context = {}) {
  const lang = context.lang || 'vi';

  switch (event) {
    case 'GREETING': {
      const nag = getNagTier(context.daysAbsent ?? 0, lang);
      if (nag) return { message: nag.message, mood: (context.daysAbsent ?? 0) >= 7 ? 'concerned' : 'encouraging', animation: 'llama-return' };
      const welcome = getRandomWelcomeMessage(lang);
      return { message: welcome.message, mood: 'happy' };
    }
    case 'INACTIVE_RETURN': {
      const nag = getNagTier(context.daysAbsent ?? 1, lang);
      return { message: nag?.message || getRandomWelcomeMessage(lang).message, mood: 'encouraging', animation: 'llama-return' };
    }
    case 'CORRECT_ANSWER': {
      const message = pickCorrectResponse({
        streak: context.streak ?? 0,
        difficulty: context.difficulty,
        topic: context.topic,
        lang
      });
      return { message, mood: (context.streak ?? 0) >= 3 ? 'excited' : 'happy' };
    }
    case 'WRONG_ANSWER': {
      const message = pickWrongResponse({
        wrongStreak: context.wrongStreak ?? 1,
        difficulty: context.difficulty,
        correct_answer: context.correctAnswer,
        wrong_answer: context.wrongAnswer,
        lang
      });
      return { message, mood: 'concerned' };
    }
    case 'HIGH_CONFIDENCE_MISTAKE':
      return { message: pick(HIGH_CONFIDENCE_MISTAKE_POOL[lang] || HIGH_CONFIDENCE_MISTAKE_POOL.vi), mood: 'rescue' };
    case 'MASTERY_IMPROVED':
      return {
        message: fill(pick(MASTERY_IMPROVED_POOL[lang] || MASTERY_IMPROVED_POOL.vi), {
          from: Math.round(context.previousMastery ?? 0),
          to: Math.round(context.newMastery ?? 0),
          topic: context.topic ?? ''
        }),
        mood: 'celebrating'
      };
    case 'PATH_UPDATED':
      return { message: pick(PATH_UPDATED_POOL[lang] || PATH_UPDATED_POOL.vi), mood: 'thinking' };
    case 'DAILY_EXPEDITION_COMPLETED':
      return { message: pick(DAILY_EXPEDITION_COMPLETED_POOL[lang] || DAILY_EXPEDITION_COMPLETED_POOL.vi), mood: 'celebrating' };
    case 'STREAK_CONTINUED':
      return { message: fill(pick(STREAK_CONTINUED_POOL[lang] || STREAK_CONTINUED_POOL.vi), { streak: context.streak ?? 0 }), mood: 'excited' };
    case 'STREAK_LOST':
      return { message: pick(STREAK_LOST_POOL[lang] || STREAK_LOST_POOL.vi), mood: 'encouraging' };
    case 'CAMP_COMPLETED':
      return { message: fill(pick(CAMP_COMPLETED_POOL[lang] || CAMP_COMPLETED_POOL.vi), { camp: context.camp ?? '' }), mood: 'celebrating' };
    case 'SUMMIT_APPROACHING':
      return { message: pick(SUMMIT_APPROACHING_POOL[lang] || SUMMIT_APPROACHING_POOL.vi), mood: 'excited' };
    default:
      return { message: '', mood: 'happy' };
  }
}
