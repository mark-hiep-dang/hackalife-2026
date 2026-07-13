const fs = require('fs');
const path = require('path');

const files = [
  'src/App.jsx',
  'src/components/Auth.jsx',
  'src/components/Dashboard.jsx',
  'src/components/Leaderboard.jsx',
  'src/components/Learn.jsx',
  'src/components/Quiz.jsx',
  'src/components/Flashcards.jsx',
  'src/components/Settings.jsx'
].map(f => path.join(__dirname, f));

const replacements = [
  // Catch any remaining hard offset shadows
  { regex: /shadow-\[[^\]]+_#[a-fA-F0-9]+\]/gi, replacement: 'shadow-sm' },
  // Catch border-[#101A24] and change to border-[#101A24]/10 if it's not already
  { regex: /border-\[#101A24\](?![\/])/gi, replacement: 'border-[#101A24]/10' },
  // Change rounded-xl to rounded-2xl for a softer Wise feel
  { regex: /rounded-xl/g, replacement: 'rounded-2xl' },
  // Change bg-[#101A24] text-[#101A24] on borders to something lighter if they are borders
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    replacements.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement);
    });
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
