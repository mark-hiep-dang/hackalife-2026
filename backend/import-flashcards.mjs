import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const rawPath = path.resolve(__dirname, '../frontend/src/assets/flashcard_100.json');
  const flashcards = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  
  console.log(`📦 Loaded ${flashcards.length} flashcards from flashcard_100.json`);
  
  // Group by category
  const categories = {};
  for (const card of flashcards) {
    const cat = card.category || 'Tổng hợp';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(card);
  }
  
  const db = await getDb();
  
  const currentCountRes = await db.get('SELECT MAX(order_index) as max_order FROM lessons');
  let orderIndex = (currentCountRes.max_order || 0) + 1;
  
  let lessonCount = 0;
  
  for (const [category, cards] of Object.entries(categories)) {
    // split cards into chunks of 5 to avoid overly long lessons
    const chunkSize = 5;
    for (let i = 0; i < cards.length; i += chunkSize) {
      const chunk = cards.slice(i, i + chunkSize);
      
      const lessonId = `fc_lesson_${Date.now()}_${lessonCount}`;
      
      const mappedCards = chunk.map((c, idx) => ({
        id: `${lessonId}_c${idx + 1}`,
        title_en: c.front,
        title_vn: c.front,
        content_en: c.back,
        content_vn: c.back,
        tip_en: `Flashcard #${c.id}`,
        tip_vn: `Thẻ học #${c.id}`
      }));
      
      // Attempt to guess topic for icon/color mapping
      let topic = 'fundamentals';
      const catLower = category.toLowerCase();
      if (catLower.includes('pháp luật') || catLower.includes('quy định')) {
        topic = 'regulations';
      } else if (catLower.includes('sản phẩm')) {
        topic = 'products';
      } else if (catLower.includes('hợp đồng')) {
        topic = 'contracts';
      }
      
      const part = Math.floor(i / chunkSize) + 1;
      const totalParts = Math.ceil(cards.length / chunkSize);
      
      const titleSuffix = totalParts > 1 ? ` (Phần ${part})` : '';
      
      await db.run(
        `INSERT INTO lessons (id, title_en, title_vn, topic, difficulty, cards, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          lessonId,
          `${category}${titleSuffix}`,
          `${category}${titleSuffix}`,
          topic,
          'intermediate',
          JSON.stringify(mappedCards),
          orderIndex++
        ]
      );
      
      lessonCount++;
    }
  }
  
  console.log(`✅ Successfully imported ${flashcards.length} flashcards into ${lessonCount} new lessons in the database.`);
  console.log('   The flashcards are now available in the Learn section.');
}

run().catch(console.error);
