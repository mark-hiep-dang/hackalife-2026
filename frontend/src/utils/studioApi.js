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
export const generateCourseCurriculum = (id, prompt) => req(`/courses/${id}/curriculum/generate`, { method: 'POST', body: { prompt } });
export const createCamp = (courseId, title) => req(`/courses/${courseId}/camps`, { method: 'POST', body: { title } });
export const updateCamp = (campId, fields) => req(`/camps/${campId}`, { method: 'PUT', body: fields });
export const deleteCamp = (campId) => req(`/camps/${campId}`, { method: 'DELETE' });
export const createLesson = (campId, fields) => req(`/camps/${campId}/lessons`, { method: 'POST', body: fields });
export const updateLesson = (lessonId, fields) => req(`/lessons/${lessonId}`, { method: 'PUT', body: fields });
export const deleteLesson = (lessonId) => req(`/lessons/${lessonId}`, { method: 'DELETE' });
export const publishCourse = (id, cohortId) => req(`/courses/${id}/publish`, { method: 'POST', body: { cohortId } });
export const runQualityCheck = (id) => req(`/courses/${id}/quality-check`, { method: 'POST' });
export const getQuality = (id) => req(`/courses/${id}/quality`);
export const suggestQualityFix = (issueId) => req(`/quality-issues/${issueId}/suggest-fix`, { method: 'POST' });
export const ignoreQualityIssue = (issueId, reason) => req(`/quality-issues/${issueId}/ignore`, { method: 'PUT', body: { reason } });

export const generateLessonKit = (lessonId) => req(`/lessons/${lessonId}/kit/generate`, { method: 'POST' });
export const generateContentFromDocument = (lessonId, documentId) => req(`/lessons/${lessonId}/generate-from-document`, { method: 'POST', body: { documentId } });
export const getCourseKnowledge = (courseId) => req(`/courses/${courseId}/knowledge`);
export const deleteCourseKnowledge = (docId) => req(`/knowledge/${docId}`, { method: 'DELETE' });
export async function uploadCourseKnowledge(courseId, file, title) {
  const token = localStorage.getItem('pang_chiu_token');
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  const res = await fetch(`${API_BASE}/studio/courses/${courseId}/knowledge`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Tải tài liệu thất bại');
  return data;
}
export const createContentItem = (lessonId, fields) => req(`/lessons/${lessonId}/content-items`, { method: 'POST', body: fields });
export const getLessonContent = (lessonId) => req(`/lessons/${lessonId}/content`);
export const explainLesson = (lessonId) => req(`/lessons/${lessonId}/explain`, { method: 'POST' });
export const reviewContentItem = (itemId, action, fields = {}) => req(`/content-items/${itemId}`, { method: 'PUT', body: { action, ...fields } });
export const rewriteContentItem = (itemId, flags) => req(`/content-items/${itemId}/rewrite`, { method: 'POST', body: { flags } });
export const deleteContentItem = (itemId) => req(`/content-items/${itemId}`, { method: 'DELETE' });

export const getCohorts = () => req('/cohorts');
export const getCohort = (id) => req(`/cohorts/${id}`);
export const getMockExamAnalytics = (cohortId) => req(`/cohorts/${cohortId}/mock-exam-analytics`);
export const getQuestionAnalytics = (mockExamId) => req(`/mock-exams/${mockExamId}/questions`);
export const getLearnersAtRisk = (cohortId) => req(`/cohorts/${cohortId}/learners-at-risk`);
export const getLearners = () => req('/learners');
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
