// Escalating, cheeky "Llama is nagging you" copy — Duolingo-owl-style guilt trips,
// gets more dramatic the longer the user has skipped studying.

// Each welcome message carries a "mood" emoji — paired with 🦙 in the UI to
// give the llama a matching expression (chewing grass when chill, glasses
// when it's being a smartass, side-eye when suspicious, etc).
const welcomeMessages = {
  vi: [
    { text: 'Hôm nay học gì đây? Lên đồ thôi! 🎒', mood: '💪' },
    { text: 'Ôi hello người đẹp, hôm nay học gì nàooo? 💅', mood: '😉' },
    { text: 'Chào chiến binh! Bữa nay múa quiz kiểu gì đây ta? 🥷', mood: '😎' },
    { text: 'Ê, dậy sớm thế để bắn đề hay đi ngắm bình minh đấy? 🌅', mood: '🧐' },
    { text: 'Llama đã mài súng xong xuôi, còn bạn thì sao nào? 🔫✨', mood: '😤' },
    { text: 'Nay đẹp trời, học tí cho đời thêm vui nè bạn ơiii! 🌤️', mood: '🌿' },
    { text: 'Tới giờ cày MOF rồi đó, đừng để Llama đợi lâu nha cưng! 🦙💕', mood: '😏' },
    { text: 'Bạn đến rồi à? Llama tưởng bị bạn cho leo cây tiếp cơ 👀', mood: '👀' }
  ],
  en: [
    { text: 'What are we studying today? Gear up! 🎒', mood: '💪' },
    { text: 'Well hello gorgeous, what are we learning today? 💅', mood: '😉' },
    { text: 'Hey warrior! What quiz moves are we busting out today? 🥷', mood: '😎' },
    { text: 'Whoa, up this early to grind questions or watch the sunrise? 🌅', mood: '🧐' },
    { text: "Llama's already sharpened its guns — what about you? 🔫✨", mood: '😤' },
    { text: 'Gorgeous day out there, learn a little and make life sweeter! 🌤️', mood: '🌿' },
    { text: "Time to grind MOF, don't keep Llama waiting babe! 🦙💕", mood: '😏' },
    { text: "Oh, you showed up? Llama thought you'd stood it up again 👀", mood: '👀' }
  ]
};

export function getRandomWelcomeMessage(lang = 'vi') {
  const list = welcomeMessages[lang] || welcomeMessages.vi;
  const { text, mood } = list[Math.floor(Math.random() * list.length)];
  return { message: text, icon: mood };
}

const nagTiers = {
  vi: [
    {
      min: 1, max: 1, icon: '👀', color: '#F59E0B',
      messages: [
        'Ơ kìa, hôm nay chưa bắn phát súng nào đó nha! Đừng để nguội tay súng! 🔫',
        'Ê ê, bạn quên Llama rồi à? Mới có 1 ngày thôi mà tim Llama đã hẫng một nhịp 💔',
        'Hôm nay chưa học tí nào đó nha! Llama đang liếc đồng hồ chờ bạn nè 👀⏰'
      ]
    },
    {
      min: 2, max: 2, icon: '😢', color: '#EF4444',
      messages: [
        'Llama đang buồn thiu nằm co ro trong góc... 2 ngày rồi không thấy bạn ghé qua đấy!',
        '2 ngày rồi đó nha! Llama đang nhá cỏ giải sầu vì nhớ bạn quá trời 😭🌿',
        'Ủa bạn đi đâu mất 2 ngày rồi? Llama tưởng bị bạn cho leo cây luôn á 🌳😢'
      ]
    },
    {
      min: 3, max: 4, icon: '🙏', color: '#EF4444',
      messages: [
        'Bạn ơi... tôi van xin bạn đấy, xin hãy vào học đi mà! Llama sắp khóc thành sông luôn rồi 😭',
        'Llama quỳ xuống cầu xin bạn vào học đi mòoooo 🙏🦙😭',
        '3-4 ngày rồi đó! Llama đang chắp tay lạy bạn 3 lạy, vào học lẹ đi mà 🙇‍♂️'
      ]
    },
    {
      min: 5, max: 6, icon: '🚨', color: '#DC2626',
      messages: [
        'CẢNH BÁO ĐỎ! Chuỗi ngày học sắp toang trong nay mai! Llama đang run rẩy soạn sẵn đơn xin nghỉ việc vì stress quá độ...',
        'Tại sao hôm nay không học? Llama đang viết email cho sếp bạn đấy nhé... 📧😤',
        '5-6 ngày mất tích luôn rồi đó nha! Llama đã báo công an tìm người thất lạc chưa vậy ta 🚔😅'
      ]
    },
    {
      min: 7, max: Infinity, icon: '📧', color: '#991B1B',
      messages: [
        'Llama đang gõ email report cho sếp của bạn: "Kính gửi Sếp, nhân viên (tên bạn) đã bỏ học 7 ngày liên tiếp..." Vào học NGAY để Llama xoá bản nháp email này!! 😈',
        '7 ngày rồi đó nha! Email đã soạn xong, ngón tay Llama đang lơ lửng trên nút Gửi... 😈📤',
        'Chuỗi ngày học đã toang từ lâu rồi! Llama đang khóc trong vô vọng, quay lại đi bạn êii 💀🦙'
      ]
    }
  ],
  en: [
    {
      min: 1, max: 1, icon: '👀', color: '#F59E0B',
      messages: [
        "Whoa, haven't fired a single shot today! Don't let those trigger fingers go cold! 🔫",
        "Hey hey, did you forget Llama already? Just 1 day and Llama's heart already skipped a beat 💔",
        "Haven't studied a bit today! Llama's watching the clock waiting for you 👀⏰"
      ]
    },
    {
      min: 2, max: 2, icon: '😢', color: '#EF4444',
      messages: [
        "Llama's curled up sulking in the corner... it's been 2 days since you last stopped by!",
        "It's been 2 days! Llama's chewing grass to cope, missing you so much 😭🌿",
        "Wait, where'd you go for 2 whole days? Llama thought you'd ghosted for good 🌳😢"
      ]
    },
    {
      min: 3, max: 4, icon: '🙏', color: '#EF4444',
      messages: [
        "Hey... I'm begging you, please come study! Llama's about to cry a whole river 😭",
        'Llama is on its knees begging you to come studyyyy 🙏🦙😭',
        "It's been 3-4 days! Llama's bowing three times, please come study already 🙇‍♂️"
      ]
    },
    {
      min: 5, max: 6, icon: '🚨', color: '#DC2626',
      messages: [
        "RED ALERT! Your streak is about to collapse any day now! Llama's shaking, already drafting a resignation letter from the stress...",
        "Why haven't you studied today? Llama's writing an email to your boss right now... 📧😤",
        'Missing for 5-6 days straight now! Has Llama filed a missing person report yet? 🚔😅'
      ]
    },
    {
      min: 7, max: Infinity, icon: '📧', color: '#991B1B',
      messages: [
        'Llama is typing a report to your boss: "Dear Boss, employee (your name) has skipped studying for 7 straight days..." Study NOW so Llama can delete this draft!! 😈',
        "It's been 7 days! The email's ready, Llama's finger is hovering over Send... 😈📤",
        "Your streak died a long time ago! Llama's crying in despair, please come back 💀🦙"
      ]
    }
  ]
};

export function getNagTier(daysSince, lang = 'vi') {
  const tiers = nagTiers[lang] || nagTiers.vi;
  const tier = tiers.find((tr) => daysSince >= tr.min && daysSince <= tr.max);
  if (!tier) return null;
  const message = tier.messages[Math.floor(Math.random() * tier.messages.length)];
  return { icon: tier.icon, color: tier.color, message };
}

// Picks a CSS animation class for the dashboard llama mascot: returning after
// a long absence beats a hot streak beats the default time-of-day mood.
export function getLlamaAnimation({ daysAbsent = 0, streak = 0 } = {}) {
  if (daysAbsent >= 7) return 'llama-angry-return';
  if (daysAbsent >= 1) return 'llama-return';
  if (streak >= 3) return 'llama-fire';

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'llama-sleepy';
  if (hour >= 11 && hour < 17) return 'llama-chill';
  if (hour >= 17 && hour < 22) return 'llama-cozy';
  return 'llama-zombie';
}
