// Escalating, cheeky "Llama is nagging you" copy — Duolingo-owl-style guilt trips,
// bilingual, gets more dramatic the longer the user has skipped studying.

export const nagTiers = {
  vn: [
    { min: 1, max: 1, icon: '👀', color: '#f59e0b', message: 'Ơ kìa, hôm nay đại lý chưa bắn phát súng nào đó nha! Đừng để nguội tay súng! 🔫' },
    { min: 2, max: 2, icon: '😢', color: '#f97316', message: 'Llama đang buồn thiu nằm co ro trong góc... 2 ngày rồi không thấy đại lý ghé qua đấy!' },
    { min: 3, max: 4, icon: '🙏', color: '#ef4444', message: 'Bạn ơi... tôi van xin bạn đấy, xin hãy vào học đi mà! Llama sắp khóc thành sông luôn rồi 😭' },
    { min: 5, max: 6, icon: '🚨', color: '#dc2626', message: 'CẢNH BÁO ĐỎ! Chuỗi ngày học sắp toang trong nay mai! Llama đang run rẩy soạn sẵn đơn xin nghỉ việc vì stress quá độ...' },
    { min: 7, max: Infinity, icon: '📧', color: '#991b1b', message: 'Llama đang gõ email report cho sếp của bạn: "Kính gửi Sếp, nhân viên (tên bạn) đã bỏ học 7 ngày liên tiếp..." Vào học NGAY để Llama xoá bản nháp email này!! 😈' }
  ],
  en: [
    { min: 1, max: 1, icon: '👀', color: '#f59e0b', message: "Uh oh, agent hasn't fired a single shot today! Don't let your trigger finger go cold! 🔫" },
    { min: 2, max: 2, icon: '😢', color: '#f97316', message: 'Llama is curled up sad in the corner... 2 days without a visit!' },
    { min: 3, max: 4, icon: '🙏', color: '#ef4444', message: 'Please, I am literally begging you, come study! Llama is about to cry an entire river 😭' },
    { min: 5, max: 6, icon: '🚨', color: '#dc2626', message: 'RED ALERT! Your streak is about to die any minute now! Llama is shaking, already drafting a resignation letter from the stress...' },
    { min: 7, max: Infinity, icon: '📧', color: '#991b1b', message: 'Llama is typing an email to your boss right now: "Dear Boss, employee (your name) has skipped studying for 7 days straight..." Study NOW so Llama deletes this draft!! 😈' }
  ]
};

export function getNagTier(daysSince, language) {
  const tiers = nagTiers[language] || nagTiers.vn;
  return tiers.find((t) => daysSince >= t.min && daysSince <= t.max) || null;
}
