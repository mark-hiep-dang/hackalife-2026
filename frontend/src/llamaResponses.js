// Llama's persona: sarcastic, teasing, funny — used for quiz answer feedback.
// Templates support {streak}, {chapter}, {term}, {correct_answer}, {wrong_answer} placeholders.

const CORRECT_POOL = {
  vi: {
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
  },
  en: {
    basic_praise: [
      'BANG! 🎉 Nailed it! This one was easy, of course you got it!',
      'BANG! ✨ Oh, you know your stuff! Llama is nodding furiously!',
      'BANG! 💪 Correct as it gets! Moving on!',
      "BANG! 🦙 Llama's clapping! Missing this one would've made Llama cry!",
      'BANG! 🎯 Bullseye! Your basics are solid!',
      'BANG! 😎 Easy peasy! Llama knew you had it!',
      'BANG! 🌟 Correct! This one is fundamental, remember it well!',
      'BANG! 👏 OK OK! Llama approves! Keep it up!',
      "BANG! 🔥 Hot! Right from the start! Llama's impressed!",
      'BANG! ✅ Check! Another one in the bag! Keep going!'
    ],
    impressive_praise: [
      'BANG! 🤯 Whoa WOW! That was a hard one and you nailed it? Llama is genuinely impressed!',
      "BANG! 🧠 Brain's working great! A lot of people miss this one!",
      "BANG! 🏆 Top of the class! Even the trick question didn't fool you!",
      "BANG! 💎 Rare one! Llama doesn't see many people get this right!",
      'BANG! 🎓 Whoa whoa whoa! At this level the MOF certificate is a walk in the park for you!',
      'BANG! 🦙✨ Llama wants to spit... happily! Hard question, correct answer, respect!',
      'BANG! 🔥🔥 On fire! That was deep knowledge! Been studying hard?',
      'BANG! 💪🧠 Big brain energy! This one was advanced level!',
      'BANG! 🌟🌟 Double star! Llama has to acknowledge, that was extremely hard!',
      'BANG! 🎯💯 Perfect shot! You were born to be an insurance agent!'
    ],
    streak_praise: [
      "BANG! 🔥 COMBO x{streak}! You're on fire! Llama can barely keep up!",
      'BANG! ⚡ {streak} in a row! Are you a correct-answer machine?!',
      "BANG! 🚀 STREAK x{streak}! At this rate you'll pass MOF in 10 minutes!",
      "BANG! 💥 UNSTOPPABLE! {streak} in a row! Llama's starting to get scared of you!",
      'BANG! 🦙🔥 COMBO x{streak}! Llama is considering... a celebratory spit?!',
      "BANG! ⭐ {streak} in a row! Are you speedrunning the MOF certificate?!",
      "BANG! 🏃‍♂️💨 Nothing can stop you! {streak} correct! Llama can only watch!",
      "BANG! 🎰 JACKPOT x{streak}! If this were a casino you'd be rich!",
      'BANG! 🌊 WAVE x{streak}! Knowledge is flowing like a river! Keep going!',
      "BANG! 👑 LEGENDARY STREAK x{streak}! Llama crowns you 'Insurance King'!"
    ],
    sarcastic_praise: [
      'BANG! 😏 Oh, correct? Llama thought you were just guessing! Kidding, nice job!',
      "BANG! 🦙 Hmm... that's right. But don't celebrate yet, the next one's harder!",
      'BANG! 🤔 Interesting... you knew this one but missed an easier one yesterday?',
      "BANG! 😤 Correct! But Llama's a little sad it didn't get to spit...",
      "BANG! 🙄 OK fine, that's right. Llama admits it. This time. Just this once.",
      "BANG! 😏 Finally correct! Llama had the spit ready and didn't get to use it!",
      "BANG! 🦙💭 *Llama thinks: 'Hmm, this human has potential...'*",
      "BANG! 🎭 Plot twist: You're right! Llama is shocked! Not how the script went!",
      "BANG! 📊 According to Llama's stats, you're right... more than expected. Suspicious 🧐",
      "BANG! 🦙 Nicely done! But Llama warns: don't let it get to your head, next one's harder!"
    ],
    educational_praise: [
      'BANG! 📚 Correct! Fun fact: this question shows up in the MOF exam almost EVERY time!',
      'BANG! 💡 Right! Pro tip: remember this number, the exam loves to swap it for another!',
      "BANG! 🎯 Exact! Llama bonus: this relates to {chapter}, review it more!",
      "BANG! 🧠 Correct! Memory tip: linking '{term}' to a real image helps it stick longer!",
      "BANG! ✅ Perfect! Heads up: the exam usually has 2-3 questions on this topic, you're ready!",
      "BANG! 📝 Correct! Llama's note: this one is in the 'must get 100%' category for the exam!",
      "BANG! 🔗 Right! Remember to connect it with {chapter} knowledge, they're related!",
      "BANG! 🎓 Excellent! You'll actually use this knowledge when advising real clients!",
      "BANG! 💪 Correct! You just mastered another concept. Progress: very good!",
      "BANG! 🏅 Perfect! This one is 'must-know' for the exam. Check ✓ off the list!"
    ]
  }
};

const WRONG_POOL = {
  vi: {
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
  },
  en: {
    gentle_roast: [
      "SPLAT! 💦 Oh no... Wrong one! Llama sheds a single tear... er, a single spit 🦙",
      "SPLAT! 🌧️ Hmm... not quite. But that's fine, mistakes are how we learn!",
      "SPLAT! 💦 Ooh! So close... but 'close' doesn't score points on the real MOF exam! 😅",
      "SPLAT! 🦙 *Llama shakes head gently* Not this one. Let Llama explain!",
      "SPLAT! 💧 Wrong! But don't worry, tons of candidates miss this one too! You're not alone!",
      "SPLAT! 😬 Hey... not quite. Llama noticed you hesitated, right? Trust your first instinct next time!",
      "SPLAT! 💦 Oops! This one trips people up a lot. Llama won't blame you, but remember it well!",
      "SPLAT! 🦙💭 *Llama thinks: 'Should I spit now...'* Alright, pardoned this time, but remember the right answer!",
      "SPLAT! 😅 Hehe... not this one. But thanks for trying! Read the explanation below!",
      "SPLAT! 💦 Wrong! But Llama respects the guts to pick an answer! Now go read the correct one!"
    ],
    medium_roast: [
      "SPLAT! 💦💦 Oh come on... this one was basic! Llama is a little disappointed! 😤",
      "SPLAT! 🌊 Hey... this one's in the TOP easiest questions! Go re-read the flashcard!",
      "SPLAT! 💦 Whoa! '{wrong_answer}'? Did you even read the question or just tap randomly?! 🤨",
      "SPLAT! 🦙😤 Llama's getting heated! Missing a basic question?!",
      "SPLAT! 💦 Way off! Llama already covered this in the flashcards! Did you even read them?!",
      "SPLAT! 😱 WHAT?! You missed THIS one? Llama needs a moment to calm down...",
      "SPLAT! 🌧️ Light spit shower! Llama emphasized this one multiple times!",
      "SPLAT! 💦 Buddy... if this were the real exam room, Llama would be worried for you! Go review!",
      "SPLAT! 🦙 *Llama spits a light drop* This is a warning! Basic questions must be right!",
      "SPLAT! 😅 Wait... you actually picked '{wrong_answer}'? Llama thought you were joking!"
    ],
    heavy_roast: [
      "SPLAT! 💦💦💦 {streak_wrong} wrong in a row! Llama is loading up the spit! CAREFUL! 🦙😈",
      "SPLAT! 🌊🌊 Oh no! Wrong again! {streak_wrong} times now, Llama's patience is running out! 💀",
      "SPLAT! 💦💦 Buddy... {streak_wrong} times now! Llama's chewing grass, getting ready to spit! Focus up! 🦙🌿",
      "SPLAT! ⚠️⚠️ DANGER ZONE! {streak_wrong} wrong in a row! Llama's warming up the jaw muscles! Get the next one right!",
      "SPLAT! 🦙💢 Llama's stressed! {streak_wrong} wrong! Are you even focusing?!",
      "SPLAT! 💦💦 *Llama takes a deep breath* OK... {streak_wrong} misses. One last chance. ONE MORE AND IT'S SPIT TIME!",
      "SPLAT! 🚨 RED ALERT! Wrong combo x{streak_wrong}! The spit system is charging up! Be careful!",
      "SPLAT! 💦💦 Are you testing Llama?! {streak_wrong} wrong now! Llama is NOT joking!",
      "SPLAT! 🦙🔥 Llama's heating up! {streak_wrong} wrong in a row! Read carefully! One more miss and... 🌊💦💦💦",
      "SPLAT! ⚡ Wrong combo x{streak_wrong}! Llama's advice: Stop, read the flashcards, then come back!"
    ],
    tricky_question_roast: [
      "SPLAT! 💦 Hey, this one's a TRAP! The MOF exam loves to trick people here! Llama understands!",
      "SPLAT! 🪤 Caught in the trap! Don't worry, plenty of candidates miss this one too! Remember it well!",
      "SPLAT! 💦 Classic trap question! Llama knew you'd miss it! The exam is designed to trick you here!",
      "SPLAT! 🦙 Hmm... this one's tricky! Lots of people confuse '{wrong_answer}' with the correct answer!",
      "SPLAT! 💡 Wrong, but Llama gets it! This one has 2 answers that 'look right'. The trick is in the details!",
      "SPLAT! 🎭 Got tricked! The MOF exam specializes in questions like this. Remember it so you don't fall for it next time!",
      "SPLAT! 💦 Classic trap! Llama already warned about this in the flashcards! Go back and re-read!",
      "SPLAT! 🧠 This one needs CAREFUL reading, word by word! One wrong word changes the whole meaning! Llama explains:",
      "SPLAT! 🦙 Don't blame yourself! This is an 'advanced trap' question. But now you know, you'll get it right next time!",
      "SPLAT! 💦 Classic numbers trap! The exam loves swapping dates/figures to trick you. Read carefully!"
    ],
    motivational_roast: [
      "SPLAT! 💦 Wrong... but HEY! Every mistake is a lesson! Llama believes you'll remember next time!",
      "SPLAT! 🦙 It's okay! Thomas Edison failed 1000 times before succeeding. You've only missed a few questions!",
      "SPLAT! 💪 Wrong, but knowing where you went wrong is already progress! Read the explanation and move on!",
      "SPLAT! 🌱 Every wrong answer = a seed of knowledge! Water it (review) and it'll grow!",
      "SPLAT! 💦 Wrong, but Llama sees you trying! That effort is what matters! Keep going!",
      "SPLAT! 🦙❤️ Llama spits... with love! Mistakes are fine, just don't make it TWICE!",
      "SPLAT! 📈 Fun fact: people who miss more during practice tend to score HIGHER on the real exam! Keep missing!",
      "SPLAT! 💦 Wrong! But did you know? Your brain remembers wrong answers BETTER than right ones! This is progress!",
      "SPLAT! 🦙 Llama also messed up a lot too (back when Llama was a baby). Now Llama's a pro! You will be too!",
      "SPLAT! 🌟 Getting this wrong = Learning this = Getting it RIGHT next time! Simple logic! Moving on!"
    ]
  }
};

const FLASHCARD_TIPS = {
  vi: [
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
  ],
  en: [
    "🦙 Memory tip: Say '{term}' out loud 3 times, imagine a client nodding along!",
    "🦙 Llama's secret: Link '{term}' to a real sales scenario, it'll stick like glue!",
    "🦙 Want to remember '{term}'? Explain it to a coworker, fun and memorable at once!",
    "🦙 Quick note: '{term}' is the kind of thing clients love to grill agents about, learn it solid!",
    "🦙 Llama's tip: Stick '{term}' on your screen, keep glancing at it and it'll sink in!",
    "🦙 Pro tip: Try explaining '{term}' to your cat — if you can explain it, you understand it!",
    "🦙 Quick recall: '{term}' + a funny story = permanent memory. Try it!",
    "🦙 Llama whispers: don't memorize '{term}' by rote, understand the core and it sticks naturally!",
    "🦙 Sales tip: Knowing '{term}' by heart scores instant points with tough clients!",
    "🦙 Secret: Repeat '{term}' in the mirror every morning, memorize it and build confidence talking to clients!",
    "🦙 Fun fact: The brain remembers better with emotion — find '{term}' funny and it'll stick longer!",
    "🦙 Llama's trick: Fit '{term}' into a silly rhyme, read it a few times and it's memorized!"
  ]
};

export function pickFlashcardTip({ term = '', lang = 'vi' } = {}) {
  const pool = FLASHCARD_TIPS[lang] || FLASHCARD_TIPS.vi;
  return fill(pickFrom(pool), { term: term || (lang === 'en' ? 'this one' : 'cái này') });
}

export function topicLabel(topic, lang = 'vi') {
  const fallback = lang === 'en' ? 'this chapter' : 'chương này';
  if (!topic) return fallback;
  // Question topics are stored as "3. Nguyên tắc & phân loại bảo hiểm" — drop the leading index.
  return topic.replace(/^\d+\.\s*/, '') || fallback;
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

function pickFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickCorrectResponse({ streak = 0, difficulty = 'intermediate', topic = '', lang = 'vi' } = {}) {
  const POOL = CORRECT_POOL[lang] || CORRECT_POOL.vi;
  let pool;
  if (streak >= 3) pool = POOL.streak_praise;
  else if (difficulty === 'advanced') pool = POOL.impressive_praise;
  else pool = pickFrom([POOL.basic_praise, POOL.sarcastic_praise, POOL.educational_praise]);

  const chapter = topicLabel(topic, lang);
  return fill(pickFrom(pool), { streak, chapter, term: chapter });
}

export function pickWrongResponse({ wrongStreak = 1, difficulty = 'intermediate', correct_answer = '', wrong_answer = '', lang = 'vi' } = {}) {
  const POOL = WRONG_POOL[lang] || WRONG_POOL.vi;
  let pool;
  if (wrongStreak >= 2) pool = POOL.heavy_roast;
  else if (difficulty === 'beginner') pool = POOL.medium_roast;
  else pool = pickFrom([POOL.gentle_roast, POOL.tricky_question_roast, POOL.motivational_roast]);

  return fill(pickFrom(pool), { streak_wrong: wrongStreak, correct_answer, wrong_answer });
}

const REPORT_OPENERS_HIGH = {
  vi: [
    'PẰNG! 🏆 Nhìn phong độ này Llama chỉ biết đứng dậy vỗ tay thôi!',
    'PẰNG! 🎓 Xuất sắc! Đề này mà rớt thì chắc lỗi ở đề chứ không phải ở bạn!',
    'PẰNG! 😎 Quá đỉnh! Sếp tương lai của bạn đang xếp hàng chờ tuyển đó!'
  ],
  en: [
    "BANG! 🏆 Seeing this form, Llama can only stand up and applaud!",
    "BANG! 🎓 Excellent! If you failed this exam it'd be the exam's fault, not yours!",
    'BANG! 😎 Absolutely top-tier! Your future boss is lining up to hire you!'
  ]
};
const REPORT_OPENERS_MID = {
  vi: [
    'CHÍU! 😐 Tạm ổn... nhưng "tạm ổn" không có trong từ điển của chứng chỉ MOF đâu nha!',
    'CHÍU! 🤔 Được đó, nhưng Llama cảm giác bạn học kiểu "hôm nay chăm, mai lười" đúng không?',
    'CHÍU! 📖 Nửa vời rồi bạn ơi! Cố thêm chút nữa là ngon lành cành đào!'
  ],
  en: [
    'SPLAT! 😐 Not bad... but "not bad" isn\'t in the MOF certificate\'s dictionary!',
    'SPLAT! 🤔 Decent, but Llama has a feeling you study in a "diligent today, lazy tomorrow" pattern, right?',
    "SPLAT! 📖 Halfway there! Push a little more and you'll be golden!"
  ]
};
const REPORT_OPENERS_LOW = {
  vi: [
    'CHÍU! 💦💦💦 Ôi trời... Llama phải ngồi xuống hít thở sâu trước khi nói tiếp đây.',
    'CHÍU! 😭 Bài này mà nộp thi thật chắc Llama phải nhổ nước bọt cả tuần liền!',
    'CHÍU! 🚨 Báo động đỏ! Cần cấp cứu kiến thức GẤP trước khi đụng đề thi thật!'
  ],
  en: [
    'SPLAT! 💦💦💦 Oh my... Llama needs to sit down and take a deep breath before continuing.',
    "SPLAT! 😭 If you submitted this on the real exam, Llama would be spitting for a whole week!",
    'SPLAT! 🚨 Red alert! You need an URGENT knowledge rescue before facing the real exam!'
  ]
};

const WEAK_TOPIC_REMARKS = {
  vi: [
    'Llama nghĩ bạn chưa từng mở sách chương này thì phải? 😏',
    'Chương này mà Llama hỏi vấn đáp chắc bạn đoán mò luôn quá!',
    'Đọc lại chương này đi, không là Llama khóc thật đó!'
  ],
  en: [
    "Llama thinks you never even opened the book for this chapter? 😏",
    "If Llama quizzed you orally on this chapter, you'd be guessing blind!",
    'Go re-read this chapter, or Llama really will cry!'
  ]
};
const MID_TOPIC_REMARKS = {
  vi: [
    'Gần được rồi, đừng chủ quan nha!',
    'Ôn thêm chút xíu nữa là chắc kèo!',
    'Biết sơ sơ vậy thôi hả? Đào sâu thêm đi bạn ơi!'
  ],
  en: [
    "Almost there, don't get overconfident!",
    "A little more review and you've got it locked in!",
    'Only know it superficially? Dig deeper!'
  ]
};
const STRONG_TOPIC_REMARKS = {
  vi: [
    'Quá vững! Llama an tâm phần này!',
    'Chuẩn không cần chỉnh, qua môn ngon ơ!',
    'Đỉnh! Cứ đà này mà phát huy nha!'
  ],
  en: [
    'Rock solid! Llama is at ease about this part!',
    "Correct as it gets, you'll pass this section easily!",
    'Top-tier! Keep it up at this pace!'
  ]
};

function tierFor(pct) {
  if (pct < 40) return 'weak';
  if (pct < 70) return 'mid';
  return 'strong';
}

function remarkFor(tier, lang = 'vi') {
  const weak = WEAK_TOPIC_REMARKS[lang] || WEAK_TOPIC_REMARKS.vi;
  const mid = MID_TOPIC_REMARKS[lang] || MID_TOPIC_REMARKS.vi;
  const strong = STRONG_TOPIC_REMARKS[lang] || STRONG_TOPIC_REMARKS.vi;
  if (tier === 'weak') return pickFrom(weak);
  if (tier === 'mid') return pickFrom(mid);
  return pickFrom(strong);
}

/**
 * Builds a study report from per-topic exam stats: an opening remark scaled to
 * overall score, a tiered (weak/mid/strong) remark per topic, and an ordered
 * roadmap of chapters to review (weakest first) — all in Llama's teasing persona.
 */
export function generateExamReport(topicStatsInput, overallPct, lang = 'vi') {
  const topicStats = topicStatsInput.map((t) => ({ ...t, tier: tierFor(t.pct) }));
  const lines = topicStats.map((t) => ({ ...t, remark: remarkFor(t.tier, lang) }));

  const high = REPORT_OPENERS_HIGH[lang] || REPORT_OPENERS_HIGH.vi;
  const mid = REPORT_OPENERS_MID[lang] || REPORT_OPENERS_MID.vi;
  const low = REPORT_OPENERS_LOW[lang] || REPORT_OPENERS_LOW.vi;

  let opener;
  if (overallPct >= 70) opener = pickFrom(high);
  else if (overallPct >= 40) opener = pickFrom(mid);
  else opener = pickFrom(low);

  // Roadmap: weak topics first, then mid-tier — both already sorted weakest-first upstream.
  const roadmap = topicStats.filter((t) => t.tier === 'weak' || t.tier === 'mid');

  return { opener, lines, roadmap };
}
