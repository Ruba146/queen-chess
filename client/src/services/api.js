import apiClient from './apiClient'

const unwrap = (res) => res.data?.data ?? res.data

export const userApi = {
  me: () => apiClient.get('/auth/profile'),
  updateProfile: (payload) => apiClient.put('/auth/profile', payload),
  getExtendedStats: (mode) => apiClient.get(`/auth/extended-stats/${mode}`),
  getRatingHistory: (mode) => apiClient.get(`/auth/rating-history/${mode}`),
  changePassword: (payload) => apiClient.put('/auth/change-password', payload),
  updateProfilePicture: (profilePicture) =>
    apiClient.put('/auth/profile-picture', { profilePicture }),
}

export const gameApi = {
  getStats: (mode) => apiClient.get(`/game/stats/${mode}`),
  save: (payload) => apiClient.post('/game/save', payload),
  listMyGames: (options = {}) => apiClient.get('/game/my-games', { params: options }),
  get: (id) => apiClient.get(`/game/${id}`),
}

export const analysisApi = {
  getFullAnalysis: (id) => apiClient.get(`/analysis/${id}`),
  getGameSummary: (id) => apiClient.post('/ai/game-analysis/game/summary', { gameId: id }),
  getPlayerProfile: () => apiClient.get('/analysis/profile'),
}

export const learningApi = {
  getDashboard: () => apiClient.get('/dashboard'),
  getLearningPath: (profile) => apiClient.post('/ai/learning-path', { profile }),
  getOpeningRecommendations: (profile) => apiClient.post('/ai/recommend/openings', { profile }),
  getEndgameRecommendations: (profile) => apiClient.post('/ai/recommend/endgames', { profile }),
  getPuzzleRecommendations: (payload) => apiClient.post('/ai/recommend/puzzles', payload),
  getCoachPlan: (profile) => apiClient.post('/ai/coach/plan', profile),
  getTrainingDaily: (profile) => apiClient.post('/ai/training/daily', { profile }),
  getDailyMission: () => apiClient.get('/daily-mission'),
  explainOpening: (payload) => apiClient.post('/ai/explain/opening', payload).then(unwrap),
  explainTactic: (payload) => apiClient.post('/ai/explain/tactic', payload).then(unwrap),
  explainEndgame: (payload) => apiClient.post('/ai/explain/endgame', payload).then(unwrap),
  chat: (messages) => apiClient.post('/ai/chat', { messages }).then(unwrap),
  searchOpening: (name) => apiClient.post('/ai/search/opening', { name }).then(unwrap),
  identifyOpening: (moves) => apiClient.post('/ai/identify-opening', { moves }).then(unwrap),
  exploreOpenings: () => apiClient.post('/ai/explore/openings').then(unwrap),
  exploreEndgames: () => apiClient.post('/ai/explore/endgames').then(unwrap),
}

export const quizApi = {
  listCollections: () => apiClient.get('/puzzle/collections').then(unwrap),
  getCategoryProgress: ({ category }) => apiClient.get(`/puzzle/collections/${encodeURIComponent(category)}`).then(unwrap),
  getCategoryPuzzles: ({ category, count }) => apiClient.get(`/puzzle/collections/${encodeURIComponent(category)}/puzzles`, { params: { count } }).then(unwrap),
  getNextPuzzle: ({ category }) => apiClient.get(`/puzzle/collections/${encodeURIComponent(category)}/next`).then(unwrap),
  submitAnswer: (payload) => apiClient.post(`/puzzle/collections/${encodeURIComponent(payload.category)}/submit`, payload).then(unwrap),
  resetCategory: ({ category }) => apiClient.post(`/puzzle/collections/${encodeURIComponent(category)}/reset`).then(unwrap),
  getPuzzle: (puzzleId) => apiClient.get(`/puzzle/puzzles/${encodeURIComponent(puzzleId)}`).then(unwrap),
  getHint: (puzzleId) => apiClient.get(`/puzzle/puzzles/${encodeURIComponent(puzzleId)}/hint`).then(unwrap),
  generateAI: (payload) => apiClient.post('/puzzle/puzzles/generate', payload).then(unwrap),
}

export const aiCoachApi = {
  chat: (messages) => apiClient.post('/ai-coach/chat', { messages }),
  getContext: () => apiClient.get('/ai-coach/context'),
}

export default {
  user: userApi,
  game: gameApi,
  analysis: analysisApi,
  learning: learningApi,
  quiz: quizApi,
  aiCoach: aiCoachApi,
}
