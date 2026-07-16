// Llama's persona: sarcastic, teasing, funny — used for quiz answer feedback.
// Templates support {streak}, {chapter}, {term}, {correct_answer}, {wrong_answer} placeholders.

const CORRECT_POOL = {
  basic_praise: [
    'PẰNG! 🎉 Ngon lành! Câu này dễ mà đúng là phải rồi!',
    'PẰNG! ✨ Ê, biết đấy! Llama gật đầu lia lịa!',
    'PẰNG! 💪 Chuẩn không cần chỉnh! Đi tiếp thôi!',
    'PẰNG! 🦙 Llama vỗ tay! Câu này mà sai thì Llama khóc đó nha!',
    'PẰNG! 🎯 Bắn trúng đích! Kiến thức cơ bản vững rồi!',
    'PẰNG! 😎 Easy peasy! Llama biết mày làm được mà!',
    'PẰNG! 🌟 Đúng rồi! Câu này là nền tảng, nhớ kỹ nha!',
    'PẰNG! 👏 OK OK! Llama approve! Tiếp tục phát huy!',
    'PẰNG! 🔥 Nóng! Đúng ngay từ đầu! Llama thích!',
    'PẰNG! ✅ Check! Một câu nữa vào túi! Keep going!'
  ],
  impressive_praise: [
    'PẰNG! 🤯 Ơ WOW! Câu này khó mà cũng đúng? Llama nể thật sự!',
    'PẰNG! 🧠 Não bộ hoạt động tốt đấy! Câu này nhiều người sai lắm!',
    'PẰNG! 🏆 Đỉnh của chóp! Câu bẫy mà cũng không lừa được bạn!',
    'PẰNG! 💎 Hiếm lắm! Llama gặp không nhiều người đúng câu này đâu!',
    'PẰNG! 🎓 Ê ê ê! Trình độ này thì MOF certificate chỉ là chuyện nhỏ!',
    'PẰNG! 🦙✨ Llama muốn nhổ nước bọt... vui! Câu khó mà đúng, respect!',
    'PẰNG! 🔥🔥 Cháy! Kiến thức sâu quá! Bạn đọc kỹ lắm hả?',
    'PẰNG! 💪🧠 Big brain energy! Câu này là level advanced đó nha!',
    'PẰNG! 🌟🌟 Double star! Llama phải ghi nhận, câu này cực khó!',
    'PẰNG! 🎯💯 Perfect shot! Bạn sinh ra để làm đại lý BH rồi!'
  ],
  streak_praise: [
    'PẰNG! 🔥 COMBO x{streak}! Đang on fire đấy! Llama phải chạy theo không kịp!',
    'PẰNG! ⚡ {streak} câu liên tiếp! Bạn là máy trả lời đúng à?!',
    'PẰNG! 🚀 STREAK x{streak}! Cứ đà này thì thi MOF xong trong 10 phút!',
    'PẰNG! 💥 UNSTOPPABLE! {streak} câu rồi! Llama bắt đầu sợ bạn rồi đó!',
    'PẰNG! 🦙🔥 COMBO x{streak}! Llama đang cân nhắc... có nên nhổ nước bọt mừng không?!',
    'PẰNG! ⭐ {streak} liên tiếp! Bạn đang speedrun MOF certificate à?!',
    'PẰNG! 🏃‍♂️💨 Không ai cản được! {streak} câu đúng! Llama chỉ biết đứng nhìn!',
    'PẰNG! 🎰 JACKPOT x{streak}! Nếu đây là casino thì bạn giàu rồi!',
    'PẰNG! 🌊 WAVE x{streak}! Kiến thức đang chảy như suối! Đừng dừng lại!',
    'PẰNG! 👑 LEGENDARY STREAK x{streak}! Llama phong bạn làm \'Vua Bảo Hiểm\'!'
  ],
  sarcastic_praise: [
    'PẰNG! 😏 Ơ, đúng hả? Llama tưởng bạn đoán mò chứ! Nói đùa, giỏi lắm!',
    'PẰNG! 🦙 Hmm... đúng rồi. Nhưng đừng vội mừng, câu sau khó hơn đó!',
    'PẰNG! 🤔 Interesting... Bạn biết cái này mà sao hôm qua sai câu dễ hơn?',
    'PẰNG! 😤 Đúng! Nhưng Llama hơi buồn vì không được nhổ nước bọt...',
    'PẰNG! 🙄 OK fine, đúng rồi. Llama thừa nhận. Lần này. Chỉ lần này thôi.',
    'PẰNG! 😏 Cuối cùng cũng đúng! Llama đã chuẩn bị nước bọt rồi mà không được dùng!',
    'PẰNG! 🦙💭 *Llama nghĩ: \'Hừm, con người này có tiềm năng đấy...\'*',
    'PẰNG! 🎭 Plot twist: Bạn đúng! Llama shock! Kịch bản không như dự kiến!',
    'PẰNG! 📊 Theo thống kê của Llama, bạn đúng... nhiều hơn Llama nghĩ. Suspicious 🧐',
    'PẰNG! 🦙 Được lắm! Nhưng Llama cảnh báo: đừng để thành tích lên đầu, câu sau sẽ khó hơn!'
  ],
  educational_praise: [
    'PẰNG! 📚 Chuẩn! Fun fact: Câu này xuất hiện trong đề thi MOF gần như MỌI LẦN đó!',
    'PẰNG! 💡 Đúng rồi! Pro tip: Ghi nhớ con số này, đề thi hay đánh lừa bằng số khác!',
    'PẰNG! 🎯 Chính xác! Llama bonus: Câu này liên quan đến {chapter}, nhớ ôn thêm nha!',
    'PẰNG! 🧠 Đúng! Mẹo nhớ: Liên tưởng \'{term}\' với hình ảnh thực tế sẽ nhớ lâu hơn!',
    'PẰNG! ✅ Perfect! Lưu ý: Đề thi thường có 2-3 câu về chủ đề này, bạn đã sẵn sàng!',
    'PẰNG! 📝 Đúng! Llama note: Câu này thuộc nhóm \'phải đúng 100%\' trong kỳ thi!',
    'PẰNG! 🔗 Chuẩn! Nhớ kết nối với kiến thức {chapter} nha, chúng liên quan đó!',
    'PẰNG! 🎓 Xuất sắc! Kiến thức này sẽ dùng thực tế khi tư vấn khách hàng luôn đó!',
    'PẰNG! 💪 Đúng! Bạn vừa master thêm 1 concept. Tiến độ: đang rất tốt!',
    'PẰNG! 🏅 Hoàn hảo! Câu này là \'must-know\' cho kỳ thi. Check ✓ trong danh sách!'
  ]
};

const WRONG_POOL = {
  gentle_roast: [
    'CHÍU! 💦 Ơ kìa... Sai rồi bạn ơi! Llama buồn 1 giọt nước mắt... à nhầm, nước bọt 🦙',
    'CHÍU! 🌧️ Hmm... không phải đâu bạn ơi. Nhưng không sao, sai là để học mà!',
    'CHÍU! 💦 Ối! Gần đúng rồi mà... nhưng \'gần\' không tính điểm thi MOF đâu nha! 😅',
    'CHÍU! 🦙 *Llama lắc đầu nhẹ* Không phải đáp án này đâu bạn. Để Llama giải thích nha!',
    'CHÍU! 💧 Sai rồi! Nhưng đừng lo, rất nhiều thí sinh cũng sai câu này! Bạn không cô đơn đâu!',
    'CHÍU! 😬 Ê... không phải đâu. Llama thấy bạn do dự đúng không? Tin vào linh cảm đầu tiên đi!',
    'CHÍU! 💦 Oops! Câu này hay bị nhầm lắm. Llama không trách đâu, nhưng nhớ kỹ nha!',
    'CHÍU! 🦙💭 *Llama nghĩ: \'Mình có nên nhổ chưa nhỉ...\'* Thôi lần này tha, nhưng nhớ đáp án đúng nha!',
    'CHÍU! 😅 Hehe... không phải đâu bạn. Nhưng cảm ơn vì đã thử! Đọc giải thích bên dưới nha!',
    'CHÍU! 💦 Sai! Nhưng Llama đánh giá cao tinh thần dám chọn! Giờ đọc đáp án đúng đi!'
  ],
  medium_roast: [
    'CHÍU! 💦💦 Trời ơi... câu này cơ bản lắm mà bạn! Llama hơi thất vọng nha! 😤',
    'CHÍU! 🌊 Bạn ơi... câu này nằm trong TOP câu dễ nhất đó! Đọc lại flashcard đi!',
    'CHÍU! 💦 Ơ kìa! \'{wrong_answer}\' á? Bạn đọc đề chưa hay bấm đại vậy?! 🤨',
    'CHÍU! 🦙😤 Llama bắt đầu nóng mũi rồi đó! Câu cơ bản mà cũng sai!',
    'CHÍU! 💦 Sai bét! Llama đã dạy cái này trong flashcard rồi mà! Bạn có đọc không?!',
    'CHÍU! 😱 WHAT?! Câu này mà sai? Llama cần ngồi xuống bình tĩnh 1 chút...',
    'CHÍU! 🌧️ Mưa nước bọt nhẹ! Câu này Llama đã nhấn mạnh mấy lần rồi mà!',
    'CHÍU! 💦 Bạn à... nếu đây là phòng thi thì Llama đang lo cho bạn đó! Ôn lại nha!',
    'CHÍU! 🦙 *Llama nhổ nhẹ 1 giọt* Đây là cảnh cáo! Câu cơ bản phải đúng chứ!',
    'CHÍU! 😅 Ê... bạn chọn \'{wrong_answer}\' thiệt hả? Llama tưởng bạn đùa!'
  ],
  heavy_roast: [
    'CHÍU! 💦💦💦 {streak_wrong} câu sai liên tiếp! Llama đang tích nước bọt đó nha! CẨN THẬN! 🦙😈',
    'CHÍU! 🌊🌊 Ơ trời! Lại sai! {streak_wrong} lần rồi, Llama sắp hết kiên nhẫn! 💀',
    'CHÍU! 💦💦 Bạn ơi... {streak_wrong} lần rồi! Llama đang nhai cỏ để chuẩn bị nhổ đó! Tập trung đi! 🦙🌿',
    'CHÍU! ⚠️⚠️ DANGER ZONE! {streak_wrong} sai liên tiếp! Llama đang warm up cơ hàm! Lần sau đúng đi!',
    'CHÍU! 🦙💢 Llama stress! {streak_wrong} câu sai! Bạn có đang tập trung không?!',
    'CHÍU! 💦💦 *Llama hít sâu* OK... {streak_wrong} lần sai. Llama cho cơ hội cuối. SAI NỮA LÀ NHỔ!',
    'CHÍU! 🚨 RED ALERT! Combo sai x{streak_wrong}! Hệ thống nhổ nước bọt đang tăng dần! Cẩn thận!',
    'CHÍU! 💦💦 Bạn đang test Llama hả?! {streak_wrong} câu sai rồi! Llama KHÔNG đùa đâu!',
    'CHÍU! 🦙🔥 Llama nóng! {streak_wrong} sai liên tiếp! Đọc kỹ đề đi! Câu sau mà sai là... 🌊💦💦💦',
    'CHÍU! ⚡ Combo sai x{streak_wrong}! Llama khuyên: Dừng lại, đọc flashcard, rồi quay lại!'
  ],
  tricky_question_roast: [
    'CHÍU! 💦 Ê, câu này là BẪY đó! Đề thi MOF hay lừa chỗ này! Llama thông cảm!',
    'CHÍU! 🪤 Dính bẫy rồi! Đừng buồn, rất nhiều thí sinh cũng sai câu này! Nhớ kỹ nha!',
    'CHÍU! 💦 Câu bẫy kinh điển! Llama biết bạn sẽ sai mà! Đề thi cố tình đánh lừa đó!',
    'CHÍU! 🦙 Hmm... câu này tricky lắm! Nhiều người nhầm giữa \'{wrong_answer}\' và đáp án đúng!',
    'CHÍU! 💡 Sai nhưng Llama hiểu! Câu này có 2 đáp án \'trông giống đúng\'. Trick nằm ở chi tiết!',
    'CHÍU! 🎭 Bị lừa rồi! Đề thi MOF chuyên dùng câu kiểu này. Ghi nhớ để lần sau không dính!',
    'CHÍU! 💦 Classic trap! Llama đã cảnh báo trong flashcard rồi mà! Quay lại đọc lại nha!',
    'CHÍU! 🧠 Câu này cần đọc KỸ từng chữ! Sai 1 từ là khác nghĩa hoàn toàn! Llama giải thích:',
    'CHÍU! 🦙 Đừng tự trách! Câu này thuộc dạng \'advanced trap\'. Nhưng giờ bạn biết rồi, lần sau đúng!',
    'CHÍU! 💦 Bẫy số liệu kinh điển! Đề hay đổi mốc thời gian/con số để đánh lừa. Nhớ đọc kỹ!'
  ],
  motivational_roast: [
    'CHÍU! 💦 Sai... nhưng HEY! Mỗi câu sai là 1 bài học! Llama tin bạn sẽ nhớ lần sau!',
    'CHÍU! 🦙 Không sao đâu! Thomas Edison sai 1000 lần mới thành công. Bạn mới sai có... mấy câu thôi!',
    'CHÍU! 💪 Sai rồi, nhưng biết sai ở đâu là đã tiến bộ! Đọc giải thích và đi tiếp!',
    'CHÍU! 🌱 Mỗi câu sai = 1 hạt giống kiến thức! Tưới nước (ôn lại) là nó mọc thôi!',
    'CHÍU! 💦 Sai nhưng Llama thấy bạn đang cố gắng! Tinh thần đó mới quan trọng! Keep going!',
    'CHÍU! 🦙❤️ Llama nhổ nước bọt... yêu thương! Sai không sao, quan trọng là đừng sai LẦN 2!',
    'CHÍU! 📈 Fun fact: Người sai nhiều khi ôn tập thường ĐÚNG nhiều hơn khi thi thật! Cứ sai đi!',
    'CHÍU! 💦 Sai! Nhưng bạn biết không? Não ghi nhớ câu sai TỐT HƠN câu đúng! Đây là progress!',
    'CHÍU! 🦙 Llama từng cũng sai nhiều lắm (hồi còn là Llama con). Giờ thì pro rồi! Bạn cũng sẽ vậy!',
    'CHÍU! 🌟 Sai câu này = Biết câu này = Lần sau ĐÚNG câu này! Logic đơn giản! Đi tiếp!'
  ]
};

const FLASHCARD_TIPS = [
  '🦙 Mẹo nhớ: Đọc to \'{term}\' 3 lần, tưởng tượng khách hàng gật đầu lia lịa!',
  '🦙 Bí kíp Llama: Liên tưởng \'{term}\' với 1 tình huống bán hàng thực tế, nhớ dai như đỉa!',
  '🦙 Muốn nhớ \'{term}\'? Kể lại cho đồng nghiệp nghe, vừa vui vừa nhớ luôn đó!',
  '🦙 Note nhỏ: \'{term}\' là kiểu kiến thức khách hàng hay hỏi vặn đại lý đó, học chắc vào nha!',
  '🦙 Mẹo của Llama: Dán \'{term}\' lên màn hình máy tính, nhìn hoài rồi cũng thuộc thôi!',
  '🦙 Pro tip: Thử giải thích \'{term}\' cho con mèo nhà bạn nghe xem, hiểu thì mới giải thích được!',
  '🦙 Nhớ nhanh: \'{term}\' + 1 câu chuyện hài hước = ghi nhớ vĩnh viễn. Thử đi!',
  '🦙 Llama thì thầm: đừng học vẹt \'{term}\', hiểu bản chất là tự nhiên nhớ luôn á!',
  '🦙 Mẹo bán hàng: Thuộc nằm lòng \'{term}\' là ghi điểm ngay với khách khó tính đó nha!',
  '🦙 Bí quyết: Lặp lại \'{term}\' trước gương mỗi sáng, vừa nhớ vừa tự tin nói chuyện với khách!',
  '🦙 Fun fact: Não nhớ tốt hơn khi có cảm xúc — cứ thấy \'{term}\' buồn cười là tự nhiên nhớ lâu!',
  '🦙 Mẹo Llama: Ghép \'{term}\' vào 1 câu vè tự chế, đọc vài lần là thuộc luôn!'
];

export function pickFlashcardTip({ term = '' } = {}) {
  return fill(pickFrom(FLASHCARD_TIPS), { term: term || 'cái này' });
}

export function topicLabel(topic) {
  if (!topic) return 'chương này';
  // Question topics are stored as "3. Nguyên tắc & phân loại bảo hiểm" — drop the leading index.
  return topic.replace(/^\d+\.\s*/, '') || 'chương này';
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

function pickFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickCorrectResponse({ streak = 0, difficulty = 'intermediate', topic = '' } = {}) {
  let pool;
  if (streak >= 3) pool = CORRECT_POOL.streak_praise;
  else if (difficulty === 'advanced') pool = CORRECT_POOL.impressive_praise;
  else pool = pickFrom([CORRECT_POOL.basic_praise, CORRECT_POOL.sarcastic_praise, CORRECT_POOL.educational_praise]);

  const chapter = topicLabel(topic);
  return fill(pickFrom(pool), { streak, chapter, term: chapter });
}

export function pickWrongResponse({ wrongStreak = 1, difficulty = 'intermediate', correct_answer = '', wrong_answer = '' } = {}) {
  let pool;
  if (wrongStreak >= 2) pool = WRONG_POOL.heavy_roast;
  else if (difficulty === 'beginner') pool = WRONG_POOL.medium_roast;
  else pool = pickFrom([WRONG_POOL.gentle_roast, WRONG_POOL.tricky_question_roast, WRONG_POOL.motivational_roast]);

  return fill(pickFrom(pool), { streak_wrong: wrongStreak, correct_answer, wrong_answer });
}

const REPORT_OPENERS_HIGH = [
  'PẰNG! 🏆 Nhìn phong độ này Llama chỉ biết đứng dậy vỗ tay thôi!',
  'PẰNG! 🎓 Xuất sắc! Đề này mà rớt thì chắc lỗi ở đề chứ không phải ở bạn!',
  'PẰNG! 😎 Quá đỉnh! Sếp tương lai của bạn đang xếp hàng chờ tuyển đó!'
];
const REPORT_OPENERS_MID = [
  'CHÍU! 😐 Tạm ổn... nhưng "tạm ổn" không có trong từ điển của chứng chỉ MOF đâu nha!',
  'CHÍU! 🤔 Được đó, nhưng Llama cảm giác bạn học kiểu "hôm nay chăm, mai lười" đúng không?',
  'CHÍU! 📖 Nửa vời rồi bạn ơi! Cố thêm chút nữa là ngon lành cành đào!'
];
const REPORT_OPENERS_LOW = [
  'CHÍU! 💦💦💦 Ôi trời... Llama phải ngồi xuống hít thở sâu trước khi nói tiếp đây.',
  'CHÍU! 😭 Bài này mà nộp thi thật chắc Llama phải nhổ nước bọt cả tuần liền!',
  'CHÍU! 🚨 Báo động đỏ! Cần cấp cứu kiến thức GẤP trước khi đụng đề thi thật!'
];

const WEAK_TOPIC_REMARKS = [
  'Llama nghĩ bạn chưa từng mở sách chương này thì phải? 😏',
  'Chương này mà Llama hỏi vấn đáp chắc bạn đoán mò luôn quá!',
  'Đọc lại chương này đi, không là Llama khóc thật đó!'
];
const MID_TOPIC_REMARKS = [
  'Gần được rồi, đừng chủ quan nha!',
  'Ôn thêm chút xíu nữa là chắc kèo!',
  'Biết sơ sơ vậy thôi hả? Đào sâu thêm đi bạn ơi!'
];
const STRONG_TOPIC_REMARKS = [
  'Quá vững! Llama an tâm phần này!',
  'Chuẩn không cần chỉnh, qua môn ngon ơ!',
  'Đỉnh! Cứ đà này mà phát huy nha!'
];

function tierFor(pct) {
  if (pct < 40) return 'weak';
  if (pct < 70) return 'mid';
  return 'strong';
}

function remarkFor(tier) {
  if (tier === 'weak') return pickFrom(WEAK_TOPIC_REMARKS);
  if (tier === 'mid') return pickFrom(MID_TOPIC_REMARKS);
  return pickFrom(STRONG_TOPIC_REMARKS);
}

function buildRoadmap(topicStats) {
  const weak = topicStats.filter((t) => t.tier === 'weak').map((t) => t.topic);
  const mid = topicStats.filter((t) => t.tier === 'mid').map((t) => t.topic);
  if (weak.length === 0 && mid.length === 0) {
    return 'Không có lĩnh vực nào đáng lo cả! Ôn lại tổng quan một lượt trước khi thi thật là đủ rồi, xạ thủ ạ! 🎯';
  }
  const parts = [];
  if (weak.length > 0) parts.push(`Ưu tiên học lại NGAY: ${weak.join(', ')}`);
  if (mid.length > 0) parts.push(`Nên ôn thêm cho chắc: ${mid.join(', ')}`);
  return parts.join('. ') + '.';
}

/**
 * Builds a study report from per-topic exam stats: an opening remark scaled to
 * overall score, a tiered (weak/mid/strong) remark per topic, and a suggested
 * review roadmap — all in Llama's teasing persona.
 */
export function generateExamReport(topicStatsInput, overallPct) {
  const topicStats = topicStatsInput.map((t) => ({ ...t, tier: tierFor(t.pct) }));
  const lines = topicStats.map((t) => ({ ...t, remark: remarkFor(t.tier) }));

  let opener;
  if (overallPct >= 70) opener = pickFrom(REPORT_OPENERS_HIGH);
  else if (overallPct >= 40) opener = pickFrom(REPORT_OPENERS_MID);
  else opener = pickFrom(REPORT_OPENERS_LOW);

  return { opener, lines, roadmap: buildRoadmap(topicStats) };
}
