// Frontend API Client

const API_BASE = 'http://localhost:5005/api';

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

export async function submitQuizScore({ score, totalQuestions, topic, type, maxCombo }) {
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ score, totalQuestions, topic, type, maxCombo })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit quiz score');
  return data;
}

export async function sendChatMessage(message, history) {
  const ollamaUrl = localStorage.getItem('pang_chiu_ollama_url') || 'http://localhost:11434';
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message, history, ollamaUrl })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send chat message');
  return data.response;
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`, {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
  return data;
}
