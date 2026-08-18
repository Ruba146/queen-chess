import apiClient from '../../services/apiClient'

/**
 * Learning API — thin wrappers around all AI learning endpoints.
 * Mirrors the legacy frontend/src/routes/aiLearning.js endpoints.
 * Each returns the unwrapped `data` payload from { success, data }.
 */
const unwrap = (res) => res.data?.data ?? res.data

export const learningApi = {
  // Explanations
  explainOpening: (payload) => apiClient.post('/ai/explain/opening', payload).then(unwrap),
  explainTactic: (payload) => {
    const body = { ...payload };
    if (body.theme && !Array.isArray(body.themes)) {
      body.themes = [body.theme];
      delete body.theme;
    }
    return apiClient.post('/ai/explain/tactic', body).then(unwrap);
  },
  explainEndgame: (payload) => apiClient.post('/ai/explain/endgame', payload).then(unwrap),

  // Coach & chat
  coachPlan: (payload) => apiClient.post('/ai/coach/plan', payload).then(unwrap),
  chat: (messages) => apiClient.post('/ai/chat', { messages }).then(unwrap),

  // Search / identify
  searchOpening: (name) => apiClient.post('/ai/search/opening', { name }).then(unwrap),
  identifyOpening: (moves) => apiClient.post('/ai/identify-opening', { moves }).then(unwrap),

  // Recommendations
  recommendPuzzles: (payload) => apiClient.post('/ai/recommend/puzzles', payload).then(unwrap),
  recommendOpenings: (payload) => apiClient.post('/ai/recommend/openings', payload).then(unwrap),
  recommendEndgames: (payload) => apiClient.post('/ai/recommend/endgames', payload).then(unwrap),

  // Explore lists
  exploreOpenings: () => apiClient.post('/ai/explore/openings').then(unwrap),
  exploreEndgames: () => apiClient.post('/ai/explore/endgames').then(unwrap),

  // Learning path / training / quiz / review
  learningPath: (profile) => apiClient.post('/ai/learning-path', { profile }).then(unwrap),
  dailyTraining: (profile) => apiClient.post('/ai/training/daily', { profile }).then(unwrap),
  quizGenerate: (payload) => apiClient.post('/ai/quiz/generate', payload).then(unwrap),
  reviewGame: (payload) => apiClient.post('/ai/review/game', payload).then(unwrap),
}

export default learningApi
