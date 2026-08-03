const MOVE_QUESTION_TYPES = {
  why: 'Why was this move played?',
  best: 'Was this the best move?',
  alternatives: 'What are the alternatives?',
  strategic: 'What is the strategic idea?',
  tactical: 'What tactical motifs are present?',
  plan: 'What is the plan?',
  whatif: 'What if a different move was played?',
};

async function explainMove(gameId, moveNumber, questionType, userId) {
  return {
    explanation: `Analysis of move ${moveNumber} in game ${gameId}.`,
    moveData: { moveNumber, questionType },
  };
}

async function generateGameSummary(gameId, userId) {
  return {
    gameId,
    summary: 'Game summary generated.',
    bestMove: null,
    worstMove: null,
    criticalMoment: null,
    strengths: [],
    weaknesses: [],
    improvementPlan: [],
  };
}

async function askAboutGame(gameId, question, userId) {
  return {
    response: `Answer to: "${question}" for game ${gameId}.`,
    chatId: null,
  };
}

async function getGameChatSessions(userId) {
  return [];
}

async function getGameChatMessages(chatId) {
  return [];
}

module.exports = {
  explainMove,
  generateGameSummary,
  askAboutGame,
  getGameChatSessions,
  getGameChatMessages,
  MOVE_QUESTION_TYPES,
};