// Rescue Trail content assembly (spec §11). The trail's factual pieces —
// which flashcard, which questions — are picked deterministically from the
// real content already in the DB. Only the wrapper narration (Llama's
// intro/outro) is fun copy; LlamaAIService may re-word it, but a working
// deterministic version always exists first (see plan §17).

// A small curated set of commonly-confused concept pairs for this exam. Falls
// back to a generic comparison prompt when a topic isn't in this list —
// LlamaAIService.generateRescueTrail can still produce a real comparison from
// the retrieved content in that case.
const CONCEPT_PAIRS = {
  '2. Thuật ngữ & chủ thể hợp đồng': {
    left: { name: 'Bên mua bảo hiểm (BMBH)', desc: 'Người ký hợp đồng và đóng phí bảo hiểm.' },
    right: { name: 'Người được bảo hiểm (NĐBH)', desc: 'Người được hợp đồng bảo vệ (tính mạng/sức khỏe/tài sản).' }
  },
  '7. Đại lý, đạo đức, quyền & nghĩa vụ': {
    left: { name: 'Đại lý bảo hiểm', desc: 'Thực hiện tư vấn, giới thiệu, chào bán theo hợp đồng đại lý.' },
    right: { name: 'Doanh nghiệp bảo hiểm', desc: 'Chịu trách nhiệm phát hành và thực hiện hợp đồng bảo hiểm.' }
  }
};

export function getConceptPair(topic) {
  return CONCEPT_PAIRS[topic] || null;
}

/**
 * @param {import('sqlite').Database} db
 * @param {object} input
 * @param {string} input.topic
 * @param {string} input.mistakeType
 * @param {number[]} [input.excludeQuestionIds] - questions the learner just saw, don't repeat
 */
async function pickQuestion(db, topic, excludeIds, extraWhere = '') {
  const clause = excludeIds.length ? `AND id NOT IN (${excludeIds.map(() => '?').join(',')})` : '';
  return db.get(
    `SELECT * FROM test_questions WHERE topic = ? ${extraWhere} ${clause} ORDER BY RANDOM() LIMIT 1`,
    [topic, ...excludeIds]
  );
}

export async function assembleRescueTrail(db, { topic, mistakeType, excludeQuestionIds = [] }) {
  const flashcard = await db.get(
    `SELECT * FROM flashcards WHERE topic = ? ORDER BY RANDOM() LIMIT 1`,
    [topic]
  );

  const easierQuestion = await pickQuestion(db, topic, excludeQuestionIds, `AND difficulty = 'Dễ'`);

  const seenAfterEasier = easierQuestion ? [...excludeQuestionIds, easierQuestion.id] : excludeQuestionIds;
  const similarQuestion = await pickQuestion(db, topic, seenAfterEasier);

  const seenAfterSimilar = similarQuestion ? [...seenAfterEasier, similarQuestion.id] : seenAfterEasier;
  const checkpointQuestion = await pickQuestion(db, topic, seenAfterSimilar);

  const conceptPair = mistakeType === 'concept_confusion' ? getConceptPair(topic) : null;

  const formatQuestion = (q) =>
    q && {
      id: q.id,
      question: q.question,
      options: [q.optA, q.optB, q.optC, q.optD].filter(Boolean),
      correct_index: ['A', 'B', 'C', 'D'].indexOf(q.answer),
      explanation: q.explanation,
      difficulty: q.difficulty
    };

  return {
    topic,
    mistakeType,
    conceptPair,
    flashcard: flashcard
      ? { id: flashcard.id, front: flashcard.front, back: flashcard.back, keyword: flashcard.keyword }
      : null,
    easierQuestion: formatQuestion(easierQuestion),
    similarQuestion: formatQuestion(similarQuestion),
    checkpointQuestion: formatQuestion(checkpointQuestion)
  };
}
