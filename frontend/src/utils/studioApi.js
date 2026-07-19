// Llama Studio API client — mirrors utils/api.js conventions.
import { getHeaders } from './api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}/studio${path}`, {
    ...options,
    headers: getHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Studio request failed: ${path}`);
  return data;
}

export const switchRole = (role) => fetch(`${API_BASE}/profile/role`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role }) }).then(r => r.json());

export const getOverview = () => req('/overview');

export const getCourses = () => req('/courses');
export const createCourse = (course) => req('/courses', { method: 'POST', body: course });
export const getCourse = (id) => req(`/courses/${id}`);
export const generateCourseCurriculum = (id) => req(`/courses/${id}/curriculum/generate`, { method: 'POST' });
export const publishCourse = (id, cohortId) => req(`/courses/${id}/publish`, { method: 'POST', body: { cohortId } });
export const runQualityCheck = (id) => req(`/courses/${id}/quality-check`, { method: 'POST' });
export const getQuality = (id) => req(`/courses/${id}/quality`);
export const suggestQualityFix = (issueId) => req(`/quality-issues/${issueId}/suggest-fix`, { method: 'POST' });
export const ignoreQualityIssue = (issueId, reason) => req(`/quality-issues/${issueId}/ignore`, { method: 'PUT', body: { reason } });

export const generateLessonKit = (lessonId) => req(`/lessons/${lessonId}/kit/generate`, { method: 'POST' });
export const getLessonContent = (lessonId) => req(`/lessons/${lessonId}/content`);
export const explainLesson = (lessonId) => req(`/lessons/${lessonId}/explain`, { method: 'POST' });
export const reviewContentItem = (itemId, action, fields = {}) => req(`/content-items/${itemId}`, { method: 'PUT', body: { action, ...fields } });
export const rewriteContentItem = (itemId, flags) => req(`/content-items/${itemId}/rewrite`, { method: 'POST', body: { flags } });

export const getCohorts = () => req('/cohorts');
export const getCohort = (id) => req(`/cohorts/${id}`);
export const getMockExamAnalytics = (cohortId) => req(`/cohorts/${cohortId}/mock-exam-analytics`);
export const getQuestionAnalytics = (mockExamId) => req(`/mock-exams/${mockExamId}/questions`);
export const getLearnersAtRisk = (cohortId) => req(`/cohorts/${cohortId}/learners-at-risk`);
export const getLearnerProfile = (learnerId) => req(`/learners/${learnerId}/profile`);

export const getMisconceptionClusters = (cohortId) => req(`/cohorts/${cohortId}/misconception-clusters`);
export const detectClusters = (cohortId) => req(`/cohorts/${cohortId}/detect-clusters`, { method: 'POST' });
export const getClusterDetail = (clusterId) => req(`/misconception-clusters/${clusterId}`);
export const generateInterventionForCluster = (clusterId, durationMinutes) => req(`/misconception-clusters/${clusterId}/intervention`, { method: 'POST', body: { durationMinutes } });
export const getIntervention = (id) => req(`/interventions/${id}`);
export const approveIntervention = (id) => req(`/interventions/${id}/approve`, { method: 'PUT' });
export const assignIntervention = (id, learnerIds) => req(`/interventions/${id}/assign`, { method: 'POST', body: { learnerIds } });
export const getInterventionResults = (id) => req(`/interventions/${id}/results`);

export const askCopilot = (message, context) => req('/copilot/ask', { method: 'POST', body: { message, context } });
