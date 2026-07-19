// Frontend API Client

// In dev, Vite proxies '/api' to the local backend. In production (Hostinger
// static build), the backend runs on a separate host (Render), so the build
// needs VITE_API_URL set to that backend's public URL — see deploy docs.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('pang_chiu_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  
  localStorage.setItem('pang_chiu_token', data.token);
  return data.user;
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  
  localStorage.setItem('pang_chiu_token', data.token);
  return data.user;
}

export function logout() {
  localStorage.removeItem('pang_chiu_token');
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: getHeaders()
  });
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error('Session expired');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
  return data;
}

export async function updateUserPath(path) {
  const res = await fetch(`${API_BASE}/profile/path`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ path })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update path');
  return data;
}

export async function getLessons() {
  const res = await fetch(`${API_BASE}/lessons`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch lessons');
  return data;
}

export async function completeLesson(lessonId) {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to complete lesson');
  return data;
}

export async function getFlashcardTopics() {
  const res = await fetch(`${API_BASE}/flashcards/topics`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch flashcard topics');
  return data;
}

export async function getFlashcards(topic) {
  const query = topic ? `?topic=${encodeURIComponent(topic)}` : '';
  const res = await fetch(`${API_BASE}/flashcards${query}`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch flashcards');
  return data;
}

export async function markFlashcardProgress(id, known) {
  const res = await fetch(`${API_BASE}/flashcards/${id}/progress`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ known })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save flashcard progress');
  return data;
}

export async function generateQuiz(topic, difficulty, type) {
  const ollamaUrl = localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434';
  const query = new URLSearchParams({ topic, difficulty, type, ollamaUrl }).toString();
  
  const res = await fetch(`${API_BASE}/quiz/generate?${query}`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');
  return data;
}

export async function submitQuizScore({ score, totalQuestions, topic, type, maxCombo, answers }) {
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ score, totalQuestions, topic, type, maxCombo, answers })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit quiz score');
  return data;
}

export async function getQuizHistory() {
  const res = await fetch(`${API_BASE}/quiz/history`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch quiz history');
  return data;
}

export async function getQuizHistoryDetail(id) {
  const res = await fetch(`${API_BASE}/quiz/history/${id}`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch quiz history detail');
  return data;
}

// `context` (spec §16, contextual Ask Llama) can carry { question, topic, mistakeLabel }
// so Llama's answer is grounded in whatever the learner is currently looking at.
export async function sendChatMessage(message, history, context) {
  const ollamaUrl = localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434';
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message, history, ollamaUrl, context })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send chat message');
  return { response: data.response, sources: data.sources || [] };
}

export async function getKnowledgeDocs() {
  const res = await fetch(`${API_BASE}/knowledge`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch knowledge documents');
  return data;
}

export async function uploadKnowledgeFile(file, title) {
  const token = localStorage.getItem('pang_chiu_token');
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);

  const res = await fetch(`${API_BASE}/knowledge/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload document');
  return data;
}

export async function pasteKnowledgeText(title, text) {
  const res = await fetch(`${API_BASE}/knowledge/paste`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, text })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save document');
  return data;
}

export async function deleteKnowledgeDoc(id) {
  const res = await fetch(`${API_BASE}/knowledge/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete document');
  return data;
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
  return data;
}

// --- Personalized Expedition ---

export async function getPreferences() {
  const res = await fetch(`${API_BASE}/preferences`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch preferences');
  return data;
}

export async function updatePreferences(prefs) {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(prefs)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save preferences');
  return data;
}

export async function getMastery() {
  const res = await fetch(`${API_BASE}/mastery`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch mastery');
  return data;
}

export async function getSummitReadiness() {
  const res = await fetch(`${API_BASE}/summit-readiness`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch summit readiness');
  return data;
}

export async function getDailyExpedition() {
  const res = await fetch(`${API_BASE}/expedition/daily`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch daily expedition');
  return data;
}

export async function completeDailyExpedition() {
  const res = await fetch(`${API_BASE}/expedition/complete`, { method: 'POST', headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to complete expedition');
  return data;
}

export async function getRescueTrail(topic, mistakeType) {
  const query = new URLSearchParams({ topic, mistakeType: mistakeType || '' }).toString();
  const res = await fetch(`${API_BASE}/rescue-trail?${query}`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch rescue trail');
  return data;
}

export async function completeRescueTrail() {
  const res = await fetch(`${API_BASE}/rescue-trail/complete`, { method: 'POST', headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to complete rescue trail');
  return data;
}

export async function previewAnswerMistake({ question, topic, difficulty, isCorrect, confidence, responseTimeMs }) {
  const res = await fetch(`${API_BASE}/quiz/answer-preview`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ question, topic, difficulty, isCorrect, confidence, responseTimeMs })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to preview answer');
  return data.mistakeDNA;
}

export async function explainMistake({ mistakeLabel, explanation, question }) {
  const res = await fetch(`${API_BASE}/llama/explain-mistake`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ mistakeLabel, explanation, question })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to explain mistake');
  return data;
}
