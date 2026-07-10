# Pằng Chíu Á! 🎯 
## Gamified MOF Insurance Agent Certificate Exam Prep Application

**Pằng Chíu Á!** is a responsive, gamified, bilingual (English/Vietnamese) web application designed to help prospective insurance agents in Vietnam pass the Ministry of Finance (MOF) Insurance Agent Certification exam. 

The application is themed around the gunshot metaphor: answering questions is like shooting at a target. Hit the right answer and score a satisfying **"Pằng" (gunshot hit)**; miss and hear a **"Chíu" (ricochet whistle)**. 

---

## 🚀 Key Features

1. **📖 Bite-sized Lessons (Learn)**:
   - Topic-by-topic flashcard decks covering Insurance Fundamentals, Products, Contracts, and State Regulations.
   - Dual-language parallel text cards with memory tips and vocabulary highlights.
   - Gated progress system (complete one topic to unlock the next, mimicking Duolingo's path).

2. **❓ AI-Generated & Dynamic Quizzes**:
   - **Topic Practice**: 5 questions of customizable difficulty. Employs adaptive difficulty (questions scale in complexity as your combo grows) and immediate explanation feedback.
   - **Timed Mock Exam**: A simulated 30-question, 40-minute official exam with a ticking timer.
   - **Pằng/Chíu Audio-Visual System**:
     - Correct answer triggers a synthetic gunshot sound and a glowing bullseye flash with sparks at the click position.
     - Incorrect answer triggers a ricochet sweep sound and a bullet vector whizzing past the screen.
     - Volume mute toggle in the navigation bar.

3. **🔥 Gamification Engine (Streaks & Badges)**:
   - XP scoring (25 XP per lesson completed, 10 XP per quiz answer corrected + multiplier bonuses).
   - Combo multiplier: Bonus points up to 1.25x for hitting consecutive correct answers.
   - Streak tracker: Tracks consecutive days of logging in and practicing, complete with a glowing flame badge.
   - Achievements cabinet: 6 unlockable badges (e.g. "Pằng Sniper" for a perfect quiz).
   - Global Leaderboard: tabbed Daily, Weekly, and Monthly charts incorporating mock competitive bots.

4. **🦙 Ask Llama AI Chat**:
   - 24/7 bilingual assistant primed with the Vietnam Law on Insurance Business 2022.
   - Configurable settings panel to connect to a local Ollama instance.
   - Quick-prompt suggestion chips for essential exam topics.
   - "Quiz Me" button: Llama asks a customized question directly inside the chat window.
   - Seamless rule-based fallback system if Ollama is not detected, keeping the prototype fully functional out of the box.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, CSS Grid & Flexbox, Web Audio API (for real-time synthetic sound generation, bypassing static asset-loading dependencies).
- **Backend**: Node.js, Express, RESTful APIs, SQLite3 (using the async `sqlite` wrapper for zero-config file storage).
- **Process Manager**: `concurrently` (runs frontend and backend with a single terminal command).

---

## ⚡ Zero-Config Quick Start

### Prerequisites
- Node.js (version 18 or higher recommended).
- Optional: [Ollama](https://ollama.com/) running a Llama model (e.g. `llama3`) on `http://localhost:11434` for AI-powered questions.

### Installation

1. **Clone the repository and enter the directory**:
   ```bash
   git clone <repository-url>
   cd hackalife-2026
   ```

2. **Install all packages** (downloads and resolves dependencies across root, backend, and frontend subfolders):
   ```bash
   npm run install-all
   ```

3. **Run the application**:
   ```bash
   npm run dev
   ```

Once launched:
- **Frontend App**: Accessible at [http://localhost:5173](http://localhost:5173)
- **Backend Server**: Running at [http://localhost:5005](http://localhost:5005)

---

## 🧪 Testing Llama Integration (Ollama)

1. Make sure Ollama is installed and running on your local machine.
2. Pull the Llama model:
   ```bash
   ollama pull llama3
   ```
3. Open the web application and navigate to **Llama Chat**.
4. If Ollama is running on the default port `11434`, it will show **"Connected to Llama"** at the top.
5. If running on a different port or host, click **Configure Llama** and apply your custom endpoint URL.
6. Ask a question or click **Llama, Quiz Me!** to trigger Llama-generated content.
7. If Ollama is not active, the system automatically falls back to an offline rule-based insurance helper, allowing all features to remain functional.
