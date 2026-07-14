// Escalating, cheeky "Llama is nagging you" copy — Duolingo-owl-style guilt trips,
// gets more dramatic the longer the user has skipped studying.

export const nagTiers = [
  { min: 1, max: 1, icon: '👀', color: '#F59E0B', message: 'Ơ kìa, hôm nay chưa bắn phát súng nào đó nha! Đừng để nguội tay súng! 🔫' },
  { min: 2, max: 2, icon: '😢', color: '#EF4444', message: 'Llama đang buồn thiu nằm co ro trong góc... 2 ngày rồi không thấy bạn ghé qua đấy!' },
  { min: 3, max: 4, icon: '🙏', color: '#EF4444', message: 'Bạn ơi... tôi van xin bạn đấy, xin hãy vào học đi mà! Llama sắp khóc thành sông luôn rồi 😭' },
  { min: 5, max: 6, icon: '🚨', color: '#DC2626', message: 'CẢNH BÁO ĐỎ! Chuỗi ngày học sắp toang trong nay mai! Llama đang run rẩy soạn sẵn đơn xin nghỉ việc vì stress quá độ...' },
  { min: 7, max: Infinity, icon: '📧', color: '#991B1B', message: 'Llama đang gõ email report cho sếp của bạn: "Kính gửi Sếp, nhân viên (tên bạn) đã bỏ học 7 ngày liên tiếp..." Vào học NGAY để Llama xoá bản nháp email này!! 😈' }
];

export function getNagTier(daysSince) {
  return nagTiers.find((t) => daysSince >= t.min && daysSince <= t.max) || null;
}
