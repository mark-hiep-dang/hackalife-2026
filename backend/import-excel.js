import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Initializing DB...');
  await initDb();
  const db = await getDb();

  // Clear existing data
  await db.exec('DELETE FROM flashcards;');
  await db.exec('DELETE FROM test_questions;');
  console.log('Cleared existing flashcards and test_questions.');

  console.log('Reading flashcards.xlsx...');
  const flashcardsWb = xlsx.readFile(path.resolve(__dirname, '../frontend/src/assets/flashcards.xlsx'));
  const flashcardsSheet = flashcardsWb.Sheets['Flashcards kiến thức'];
  const flashcardsData = xlsx.utils.sheet_to_json(flashcardsSheet);

  let fcCount = 0;
  for (const row of flashcardsData) {
    if (!row['Mặt trước']) continue; // skip empty rows
    await db.run(
      `INSERT INTO flashcards (stt, topic, card_type, difficulty, front, back, keyword, state, wrong_count, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row['STT'] || null,
        row['Chủ đề'] || '',
        row['Loại thẻ'] || '',
        row['Mức độ'] || '',
        row['Mặt trước'] || '',
        row['Mặt sau'] || '',
        row['Từ khóa/Đáp án'] || '',
        row['Trạng thái'] || '',
        row['Số lần sai'] || 0,
        row['Ghi chú'] || ''
      ]
    );
    fcCount++;
  }
  console.log(`Inserted ${fcCount} flashcards.`);

  console.log('Reading test_questions.xlsx...');
  const testQsWb = xlsx.readFile(path.resolve(__dirname, '../frontend/src/assets/test_questions.xlsx'));
  const testQsSheet = testQsWb.Sheets['Ngân hàng 300 câu'];
  const testQsData = xlsx.utils.sheet_to_json(testQsSheet);

  let qCount = 0;
  for (const row of testQsData) {
    if (!row['Câu hỏi']) continue;
    await db.run(
      `INSERT INTO test_questions (stt, topic, difficulty, question, optA, optB, optC, optD, answer, explanation, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row['STT'] || null,
        row['Chủ đề'] || '',
        row['Mức độ'] || '',
        row['Câu hỏi'] || '',
        row['A'] || '',
        row['B'] || '',
        row['C'] || '',
        row['D'] || '',
        row['Đáp án'] || '',
        row['Giải thích'] || '',
        row['Căn cứ/Nguồn'] || ''
      ]
    );
    qCount++;
  }
  console.log(`Inserted ${qCount} test questions.`);

  console.log('Import complete.');
  process.exit(0);
}

run().catch(console.error);
