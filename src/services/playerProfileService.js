const gameRepository = require("../repositories/gameRepository");
const { classifyMove } = require("./analysisService");

function analyzeGameWeaknesses(game) {
  const weaknesses = []
  const moveAnalysis = game.moveAnalysis || []

  const blunders = moveAnalysis.filter(m => m.classification === 'Blunder')
  const mistakes = moveAnalysis.filter(m => m.classification === 'Mistake')
  const inaccuracies = moveAnalysis.filter(m => m.classification === 'Inaccuracy')

  if (blunders.length >= 2) {
    weaknesses.push({ type: 'blunders', severity: 'high', count: blunders.length, description: 'Frequent critical blunders' })
  }
  if (mistakes.length >= 3) {
    weaknesses.push({ type: 'mistakes', severity: 'medium', count: mistakes.length, description: 'Recurring positional mistakes' })
  }
  if (inaccuracies.length >= 4) {
    weaknesses.push({ type: 'inaccuracies', severity: 'low', count: inaccuracies.length, description: 'Many inaccuracies reducing position quality' })
  }

  const openingScore = game.openingScore || 0
  if (openingScore < 50) {
    weaknesses.push({ type: 'opening', severity: 'medium', description: 'Weak opening preparation' })
  }

  const middleGameScore = game.middleGameScore || 0
  if (middleGameScore < 50) {
    weaknesses.push({ type: 'middlegame', severity: 'medium', description: 'Struggles in middlegame complexity' })
  }

  const endgameScore = game.endgameScore || 0
  if (endgameScore < 50) {
    weaknesses.push({ type: 'endgame', severity: 'medium', description: 'Endgame technique needs work' })
  }

  const tacticalScore = game.tacticalAbilityScore || 0
  if (tacticalScore < 50) {
    weaknesses.push({ type: 'tactical', severity: 'high', description: 'Tactical awareness needs development' })
  }

  const positionalScore = game.positionalPlayScore || 0
  if (positionalScore < 50) {
    weaknesses.push({ type: 'positional', severity: 'medium', description: 'Positional understanding needs improvement' })
  }

  const kingSafetyScore = game.kingSafetyScore || 0
  if (kingSafetyScore < 50) {
    weaknesses.push({ type: 'king_safety', severity: 'high', description: 'King safety is a concern' })
  }

  return weaknesses
}

async function analyzePlayerProfile(userId, limit = 20) {
  const games = await gameRepository.listUserGames(userId, { excludeTraining: true, take: limit })
  if (!games || games.length === 0) {
    return {
      totalGames: 0,
      weaknesses: [],
      recurringThemes: [],
      recommendations: [],
      strengths: [],
    }
  }

  const allWeaknesses = []
  const weaknessCounts = {}
  let totalAccuracy = 0
  let totalCpl = 0
  let totalBlunders = 0
  let totalMistakes = 0
  let totalBestMoves = 0
  let totalBrilliant = 0

  for (const game of games) {
    const gameWeaknesses = analyzeGameWeaknesses(game)
    allWeaknesses.push(...gameWeaknesses)

    for (const w of gameWeaknesses) {
      weaknessCounts[w.type] = (weaknessCounts[w.type] || 0) + 1
    }

    totalAccuracy += game.accuracy || 0
    totalCpl += game.averageCentipawnLoss || 0
    totalBlunders += game.blunders || 0
    totalMistakes += game.mistakes || 0
    totalBestMoves += game.bestMoves || 0
    totalBrilliant += game.brilliantMoves || 0
  }

  const totalGames = games.length
  const avgAccuracy = totalGames > 0 ? Math.round(totalAccuracy / totalGames) : 0
  const avgCpl = totalGames > 0 ? Math.round(totalCpl / totalGames) : 0

  const recurringThemes = Object.entries(weaknessCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      severity: count >= totalGames * 0.5 ? 'high' : count >= totalGames * 0.3 ? 'medium' : 'low',
      description: getWeaknessDescription(type),
    }))

  const strengths = []
  if (avgAccuracy >= 80) strengths.push('Consistently high accuracy')
  if (avgCpl < 20) strengths.push('Low average centipawn loss')
  if (totalBrilliant >= totalGames * 0.3) strengths.push('Finds creative brilliant moves')
  if (totalBestMoves >= totalGames * 0.4) strengths.push('Regularly finds the best moves')
  if (totalBlunders === 0) strengths.push('No blunders in recent games')

  const recommendations = []
  if (recurringThemes.some(t => t.type === 'blunders' || t.type === 'tactical')) {
    recommendations.push('Practice tactical puzzles daily to improve calculation')
  }
  if (recurringThemes.some(t => t.type === 'opening')) {
    recommendations.push('Study opening principles and build a repertoire')
  }
  if (recurringThemes.some(t => t.type === 'middlegame')) {
    recommendations.push('Analyze master games to improve middlegame planning')
  }
  if (recurringThemes.some(t => t.type === 'endgame')) {
    recommendations.push('Study basic endgame techniques')
  }
  if (recurringThemes.some(t => t.type === 'king_safety')) {
    recommendations.push('Prioritize castling and king safety')
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue playing and analyzing your games')
  }

  return {
    totalGames,
    avgAccuracy,
    avgCpl,
    totalBlunders,
    totalMistakes,
    totalBestMoves,
    totalBrilliant,
    weaknesses: allWeaknesses,
    recurringThemes,
    recommendations: recommendations.slice(0, 5),
    strengths: strengths.slice(0, 5),
  }
}

function getWeaknessDescription(type) {
  const descriptions = {
    blunders: 'Frequent critical blunders',
    mistakes: 'Recurring positional mistakes',
    inaccuracies: 'Many inaccuracies reducing position quality',
    opening: 'Weak opening preparation',
    middlegame: 'Struggles in middlegame complexity',
    endgame: 'Endgame technique needs work',
    tactical: 'Tactical awareness needs development',
    positional: 'Positional understanding needs improvement',
    king_safety: 'King safety is a concern',
  }
  return descriptions[type] || 'Area needs improvement'
}

module.exports = {
  analyzePlayerProfile,
  analyzeGameWeaknesses,
  getWeaknessDescription,
}
