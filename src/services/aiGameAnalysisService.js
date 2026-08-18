const { performAnalysis, detectOpening } = require("./analysisService");
const { generateTacticsExplanation } = require("../ai/aiExplanationService");
const gameRepository = require("../repositories/gameRepository");

async function explainMove(gameId, moveNumber, questionType, userId) {
  const game = await gameRepository.getGameById(gameId)
  if (!game) {
    return { explanation: 'Game not found.', moveData: { moveNumber, questionType } }
  }

  const moveAnalysis = game.moveAnalysis || []
  const moveData = moveAnalysis.find(m => m.moveNumber === moveNumber)

  if (!moveData) {
    return { explanation: 'Move not found in analysis.', moveData: { moveNumber, questionType } }
  }

  const explanation = generateMoveExplanation(moveData, questionType)

  return {
    explanation,
    moveData: {
      moveNumber,
      move: moveData.move,
      classification: moveData.classification,
      loss: moveData.loss,
      evalBefore: moveData.evalBefore,
      evalAfter: moveData.evalAfter,
      why: moveData.why,
    },
  }
}

function generateMoveExplanation(moveData, questionType) {
  if (!moveData) return 'Move data not available.'

  const parts = [`Move ${moveData.moveNumber}: ${moveData.move}`]

  parts.push(`Classification: ${moveData.classification}`)
  parts.push(`Centipawn loss: ${moveData.loss}`)

  if (moveData.why) {
    parts.push(`Why: ${moveData.why}`)
  }

  if (questionType === 'best') {
    parts.push('This move was evaluated against the engine best move.')
  } else if (questionType === 'tactic') {
    parts.push('Tactical opportunities were analyzed for this position.')
  } else if (questionType === 'position') {
    parts.push('Positional factors considered: development, center control, king safety.')
  }

  return parts.join('\n')
}

async function generateGameSummary(gameId, userId) {
  const game = await gameRepository.getGameById(gameId)
  if (!game) {
    return { gameId, summary: 'Game not found.', bestMove: null, worstMove: null, criticalMoment: null, strengths: [], weaknesses: [], improvementPlan: [] }
  }

  const moves = game.moves || []
  const moveAnalysis = game.moveAnalysis || []

  const bestMove = moveAnalysis.find(m => m.classification === 'Brilliant' || m.classification === 'Best')
  const worstMove = moveAnalysis.find(m => m.classification === 'Blunder')
  const criticalMoment = worstMove || moveAnalysis.find(m => m.classification === 'Mistake')

  const strengths = game.strengths || []
  const weaknesses = game.weaknesses || []
  const coachRecommendations = game.coachRecommendations || []

  const summary = generateSummaryText(game, moveAnalysis, strengths, weaknesses)

  return {
    gameId,
    summary,
    bestMove: bestMove ? { moveNumber: bestMove.moveNumber, move: bestMove.move, classification: bestMove.classification } : null,
    worstMove: worstMove ? { moveNumber: worstMove.moveNumber, move: worstMove.move, classification: worstMove.classification, loss: worstMove.loss } : null,
    criticalMoment: criticalMoment ? { moveNumber: criticalMoment.moveNumber, move: criticalMoment.move, classification: criticalMoment.classification, reason: criticalMoment?.why } : null,
    strengths,
    weaknesses,
    improvementPlan: coachRecommendations,
  }
}

function generateSummaryText(game, moveAnalysis, strengths, weaknesses) {
  const parts = []

  parts.push(`Game result: ${game.result || 'unknown'}`)
  parts.push(`Accuracy: ${game.accuracy || 0}%`)
  parts.push(`Average CPL: ${game.averageCentipawnLoss || 0}`)

  if (strengths.length > 0) {
    parts.push(`Key strength: ${strengths[0]}`)
  }
  if (weaknesses.length > 0) {
    parts.push(`Area to improve: ${weaknesses[0]}`)
  }

  const blunders = moveAnalysis.filter(m => m.classification === 'Blunder').length
  if (blunders > 0) {
    parts.push(`You had ${blunders} blunder${blunders > 1 ? 's' : ''} in this game.`)
  }

  return parts.join('\n')
}

async function askAboutGame(gameId, question, userId) {
  const game = await gameRepository.getGameById(gameId)
  if (!game) {
    return { response: 'Game not found.', chatId: null }
  }

  const response = `Based on your game analysis: ${game.coachRecommendations?.[0] || 'Continue practicing to improve your chess skills.'}`

  return { response, chatId: null }
}

async function getGameChatSessions(userId) {
  return []
}

async function getGameChatMessages(chatId) {
  return []
}

module.exports = {
  explainMove,
  generateGameSummary,
  askAboutGame,
  getGameChatSessions,
  getGameChatMessages,
  MOVE_QUESTION_TYPES: {
    best: 'Best move analysis',
    tactic: 'Tactical opportunities',
    position: 'Positional evaluation',
    general: 'General analysis',
  },
};
