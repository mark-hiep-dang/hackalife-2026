// Tracks the last day the user actually studied (completed a lesson or quiz),
// separate from login streak, so we can nag them if they've been slacking.

const LAST_STUDY_KEY = 'pang_chiu_last_study_date';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function markStudiedToday() {
  localStorage.setItem(LAST_STUDY_KEY, todayStr());
}

// Called once per session start so brand new users aren't nagged immediately.
export function ensureStudyTrackingInitialized() {
  if (!localStorage.getItem(LAST_STUDY_KEY)) {
    markStudiedToday();
  }
}

export function getDaysSinceLastStudy() {
  const last = localStorage.getItem(LAST_STUDY_KEY);
  if (!last) return 0;
  const diffMs = new Date(todayStr()) - new Date(last);
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}
