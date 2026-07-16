// Escalating, cheeky "Llama is nagging you" copy — Duolingo-owl-style guilt trips,
// gets more dramatic the longer the user has skipped studying.

// Each welcome message carries a "mood" emoji — paired with 🦙 in the UI to
// give the llama a matching expression (chewing grass when chill, glasses
// when it's being a smartass, side-eye when suspicious, etc).
const welcomeMessages = [
  { text: 'Hôm nay học gì đây? Lên đồ thôi! 🎒', mood: '💪' },
  { text: 'Ôi hello người đẹp, hôm nay học gì nàooo? 💅', mood: '😉' },
  { text: 'Chào chiến binh! Bữa nay múa quiz kiểu gì đây ta? 🥷', mood: '😎' },
  { text: 'Ê, dậy sớm thế để bắn đề hay đi ngắm bình minh đấy? 🌅', mood: '🧐' },
  { text: 'Llama đã mài súng xong xuôi, còn bạn thì sao nào? 🔫✨', mood: '😤' },
  { text: 'Nay đẹp trời, học tí cho đời thêm vui nè bạn ơiii! 🌤️', mood: '🌿' },
  { text: 'Tới giờ cày MOF rồi đó, đừng để Llama đợi lâu nha cưng! 🦙💕', mood: '😏' },
  { text: 'Bạn đến rồi à? Llama tưởng bị bạn cho leo cây tiếp cơ 👀', mood: '👀' }
];

export function getRandomWelcomeMessage() {
  const { text, mood } = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  return { message: text, icon: mood };
}

const nagTiers = [
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
];

export function getNagTier(daysSince) {
  const tier = nagTiers.find((t) => daysSince >= t.min && daysSince <= t.max);
  if (!tier) return null;
  const message = tier.messages[Math.floor(Math.random() * tier.messages.length)];
  return { icon: tier.icon, color: tier.color, message };
}
