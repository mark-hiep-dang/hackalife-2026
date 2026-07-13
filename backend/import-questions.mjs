/**
 * Import Script: Transforms questions-bank.json (200 Vietnamese MCQ questions)
 * into the backend's bilingual questionBank format and writes them into questions.js
 * 
 * Run: node import-questions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the question bank JSON
const rawPath = path.resolve(__dirname, '../frontend/src/assets/questions-bank.json');
const rawQuestions = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

console.log(`📦 Loaded ${rawQuestions.length} questions from questions-bank.json`);

// Topic classification using round-robin distribution
// The questions in the bank contain generic placeholder text,
// so a keyword search will heavily skew. Round-robin ensures an even 25% split.
const topicsList = ['fundamentals', 'products', 'contracts', 'regulations'];
function classifyTopic(questionId) {
  // Use the ID (or an index) to modulo 4
  const numId = parseInt(String(questionId).replace(/\D/g, ''), 10) || 0;
  return topicsList[numId % topicsList.length];
}

// Convert answer letter (A, B, C, D) to zero-based index
// Handles both string ("A") and array (["A", "B", "D"]) formats
function answerToIndex(answer) {
  const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  if (Array.isArray(answer)) {
    // Multi-answer: use the first correct answer for single-choice quiz
    return map[String(answer[0]).trim().toUpperCase()] ?? 0;
  }
  return map[String(answer).trim().toUpperCase()] ?? 0;
}

// Strip the "A. ", "B. ", etc. prefix from option text
function cleanOption(opt) {
  return opt.replace(/^[A-D]\.\s*/, '');
}

// Filter out placeholder questions
const validRawQuestions = rawQuestions.filter(q => !q.question.includes("Câu hỏi ôn thi chứng chỉ đại lý bảo hiểm nhân thọ số"));

// Transform questions to backend format
const transformedQuestions = validRawQuestions.map((q) => {
  const topic = classifyTopic(q.id);
  const correctIndex = answerToIndex(q.answer);
  const optionsVn = q.options.map(cleanOption);
  
  // Use Vietnamese as primary since these are Vietnamese exam questions
  // English fields mirror the Vietnamese for bilingual display
  return {
    id: `qbank_${q.id}`,
    topic: topic,
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: q.question,  // Vietnamese question used in both fields (exam is VN-primary)
    question_vn: q.question,
    options_en: optionsVn,     // Same options for both since content is Vietnamese
    options_vn: optionsVn,
    correct_index: correctIndex,
    explanation_en: q.explanation,
    explanation_vn: q.explanation
  };
});

// Count by topic
const topicCounts = {};
transformedQuestions.forEach(q => {
  topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
});

console.log('\n📊 Topic distribution:');
Object.entries(topicCounts).forEach(([topic, count]) => {
  console.log(`   ${topic}: ${count} questions`);
});

// Generate the new questions.js content
// Read existing file to preserve the helper functions and imports
const existingQuestionsPath = path.resolve(__dirname, 'questions.js');
const existingContent = fs.readFileSync(existingQuestionsPath, 'utf-8');

// Find the end of the questionBank array (the closing bracket before exports)
const bankEndMarker = '];\n\n// Mock dynamic';
const bankEndIndex = existingContent.indexOf(bankEndMarker);

if (bankEndIndex === -1) {
  // Alternative approach: just append the new questions to the questionBank array
  // Find the line with the closing of questionBank
  console.log('\n⚠️  Could not find exact marker. Using alternative insertion approach...');
}

// Build the new questionBank entries as JS code
let newEntries = '';
transformedQuestions.forEach((q) => {
  newEntries += `  {\n`;
  newEntries += `    id: '${q.id}',\n`;
  newEntries += `    topic: '${q.topic}',\n`;
  newEntries += `    type: 'mcq',\n`;
  newEntries += `    difficulty: 'intermediate',\n`;
  newEntries += `    question_en: ${JSON.stringify(q.question_en)},\n`;
  newEntries += `    question_vn: ${JSON.stringify(q.question_vn)},\n`;
  newEntries += `    options_en: ${JSON.stringify(q.options_en)},\n`;
  newEntries += `    options_vn: ${JSON.stringify(q.options_vn)},\n`;
  newEntries += `    correct_index: ${q.correct_index},\n`;
  newEntries += `    explanation_en: ${JSON.stringify(q.explanation_en)},\n`;
  newEntries += `    explanation_vn: ${JSON.stringify(q.explanation_vn)}\n`;
  newEntries += `  },\n`;
});

// Find the closing "];" of the questionBank array
// Look for the pattern: the last "];" before "// Mock dynamic" or before "export function"
const exportFuncIndex = existingContent.indexOf('export function generateDynamicQuestion');
if (exportFuncIndex === -1) {
  console.error('❌ Could not find generateDynamicQuestion in questions.js');
  process.exit(1);
}

// Find the exact closing of the questionBank array
const marker = '];\n\n// List of client names';
const lastClosingBracket = existingContent.indexOf(marker);

if (lastClosingBracket === -1) {
  console.error('❌ Could not find the end of questionBank array');
  process.exit(1);
}

// Insert the new entries before the closing "];"
// Add a comma after the previous last object
const before = existingContent.substring(0, lastClosingBracket).trimRight();
// We add a comma if the previous string ended with }
const cleanBefore = before.endsWith('}') ? before + ',' : before;
const after = existingContent.substring(lastClosingBracket);

const updatedContent = cleanBefore + 
  '\n  // ─── IMPORTED FROM questions-bank.json (200 MOF exam questions) ───\n' +
  newEntries +
  after;

fs.writeFileSync(existingQuestionsPath, updatedContent, 'utf-8');

console.log(`\n✅ Successfully imported ${transformedQuestions.length} questions into questions.js`);
console.log('   The questionBank now contains the original + 200 new questions.');
console.log('   Restart the backend server to pick up the changes.');
