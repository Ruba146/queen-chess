const { Chess } = require("chess.js");
const gameRepository = require("../repositories/gameRepository");
const { performAnalysis, getRankFromRating, determinePlayerLevel, classifyMove } = require("./analysisService");

function detectOpening(moves) {
  const firstMoves = moves.slice(0, 8).join(" ");
  if (firstMoves.includes("e4 e5 Nf3 Nc6 Bb5")) return "Ruy Lopez";
  if (firstMoves.includes("e4 e5 Nf3 Nc6 Bc4")) return "Italian Game";
  if (firstMoves.includes("e4 e5 Nf3 Nf6")) return "Petrov's Defense";
  if (firstMoves.includes("e4 e5 f4")) return "King's Gambit";
  if (firstMoves.includes("e4 c5")) return "Sicilian Defense";
  if (firstMoves.includes("e4 e6")) return "French Defense";
  if (firstMoves.includes("e4 c6")) return "Caro-Kann Defense";
  if (firstMoves.includes("e4 d5")) return "Scandinavian Defense";
  if (firstMoves.includes("e4 d6")) return "Pirc Defense";
  if (firstMoves.includes("d4 d5 c4")) return "Queen's Gambit";
  if (firstMoves.includes("d4 Nf6")) return "Indian Defense";
  if (firstMoves.includes("d4 d5 Nf3 Nf6")) return "Queen's Pawn Game";
  if (firstMoves.includes("d4 f5")) return "Dutch Defense";
  if (firstMoves.includes("c4")) return "English Opening";
  if (firstMoves.includes("Nf3")) return "Reti Opening";
  if (firstMoves.includes("g3")) return "King's Fianchetto";
  if (firstMoves.includes("b3")) return "Queen's Fianchetto";
  return "Unknown Opening";
}

function detectCriticalMoments(moveAnalysis) {
  const moments = []
  let maxEvalDrop = 0
  let maxEvalDropMove = null
  let maxEvalGain = 0
  let maxEvalGainMove = null

  for (const m of moveAnalysis) {
    const drop = Math.max(0, m.evalBefore - m.evalAfter)
    const gain = Math.max(0, m.evalAfter - m.evalBefore)
    if (drop > maxEvalDrop) {
      maxEvalDrop = drop
      maxEvalDropMove = m
    }
    if (gain > maxEvalGain) {
      maxEvalGain = gain
      maxEvalGainMove = m
    }
  }

  if (maxEvalDropMove && maxEvalDrop >= 200) {
    moments.push({
      type: 'critical',
      moveNumber: maxEvalDropMove.moveNumber,
      move: maxEvalDropMove.move,
      reason: `Evaluation dropped by ${maxEvalDrop} cp. ${maxEvalDropMove.why || ''}`,
      severity: maxEvalDrop >= 500 ? 'high' : 'medium',
    })
  }

  if (maxEvalGainMove && maxEvalGain >= 200) {
    moments.push({
      type: 'best',
      moveNumber: maxEvalGainMove.moveNumber,
      move: maxEvalGainMove.move,
      reason: `Evaluation improved by ${maxEvalGain} cp. ${maxEvalGainMove.why || ''}`,
      severity: 'positive',
    })
  }

  const missedOpportunities = moveAnalysis.filter(m => m.classification === 'Inaccuracy' || m.classification === 'Mistake' || m.classification === 'Blunder')
  if (missedOpportunities.length > 0) {
    moments.push({
      type: 'missed',
      moveNumber: missedOpportunities[0].moveNumber,
      move: missedOpportunities[0].move,
      reason: missedOpportunities[0].why || 'Move could be improved.',
      severity: missedOpportunities[0].classification === 'Blunder' ? 'high' : 'medium',
    })
  }

  return moments.slice(0, 5)
}

function generateLessons(moveAnalysis, weaknesses, playerLevel) {
  const lessons = []
  const blunders = moveAnalysis.filter(m => m.classification === 'Blunder')
  const mistakes = moveAnalysis.filter(m => m.classification === 'Mistake')
  const inaccuracies = moveAnalysis.filter(m => m.classification === 'Inaccuracy')

  if (blunders.length > 0) {
    lessons.push({
      title: 'Avoid critical blunders',
      detail: 'You had ' + blunders.length + ' blunder' + (blunders.length > 1 ? 's' : '') + '. Before moving, always check for opponent threats and hanging pieces.',
      priority: 'high',
    })
  }

  if (mistakes.length > 0) {
    lessons.push({
      title: 'Reduce positional mistakes',
      detail: mistakes.length + ' mistake' + (mistakes.length > 1 ? 's' : '') + ' detected. Improve your calculation depth and verify candidate moves.',
      priority: 'medium',
    })
  }

  if (inaccuracies.length >= 3) {
    lessons.push({
      title: 'Improve move accuracy',
      detail: inaccuracies.length + ' inaccuracies. Focus on finding stronger moves rather than adequate ones.',
      priority: 'medium',
    })
  }

  const openingWeak = weaknesses.some(w => w.toLowerCase().includes('opening'))
  if (openingWeak) {
    lessons.push({
      title: 'Strengthen opening preparation',
      detail: 'Study opening principles: control the center, develop pieces, and castle early.',
      priority: 'medium',
    })
  }

  const tacticalWeak = weaknesses.some(w => w.toLowerCase().includes('tactical'))
  if (tacticalWeak) {
    lessons.push({
      title: 'Improve tactical vision',
      detail: 'Practice tactical puzzles daily to improve pattern recognition.',
      priority: 'high',
    })
  }

  return lessons.slice(0, 5)
}

function generateTrainingRecommendations(weaknesses, lessons, moveAnalysis) {
  const recommendations = []
  const hasBlunders = moveAnalysis.some(m => m.classification === 'Blunder')
  const hasTacticalIssues = weaknesses.some(w => w.toLowerCase().includes('tactical'))
  const hasPositionalIssues = weaknesses.some(w => w.toLowerCase().includes('positional'))
  const hasOpeningIssues = weaknesses.some(w => w.toLowerCase().includes('opening'))
  const hasEndgameIssues = weaknesses.some(w => w.toLowerCase().includes('endgame'))

  if (hasBlunders || hasTacticalIssues) {
    recommendations.push({ category: 'Tactics Training', reason: 'Your game shows tactical oversights.' })
  }
  if (hasPositionalIssues) {
    recommendations.push({ category: 'Positional Play', reason: 'Focus on piece activity and pawn structure.' })
  }
  if (hasOpeningIssues) {
    recommendations.push({ category: 'Opening Study', reason: 'Build a solid opening repertoire.' })
  }
  if (hasEndgameIssues) {
    recommendations.push({ category: 'Endgame Technique', reason: 'Practice basic endgame principles.' })
  }

  if (recommendations.length === 0) {
    recommendations.push({ category: 'General Improvement', reason: 'Continue playing and analyzing your games.' })
  }

  return recommendations.slice(0, 4)
}

async function getFullAnalysis(gameId) {
  const gameData = await gameRepository.getGameById(gameId);
  if (!gameData) {
    throw { status: 404, message: "Game not found" };
  }

  const moves = gameData.moves || [];
  const playerColor = gameData.playerColor || "white";

  if (gameData.moveAnalysis && gameData.moveAnalysis.length > 0 && gameData.strengths && gameData.strengths.length > 0) {
    return buildAnalysisResponse(gameData, moves);
  }

  const ratingBefore = gameData.ratingsBefore?.player1 || 1200;
  const ratingAfter = gameData.ratingsAfter?.player1 || ratingBefore;
  const duration = gameData.duration || 0;
  const difficulty = gameData.difficulty || "intermediate";

  const analysisResult = performAnalysis(moves, playerColor, null, ratingBefore, ratingAfter, duration, difficulty);
  const detectedOpening = detectOpening(moves);

  const currentSavedOpening = gameData.opening;
  const isSavedValid = typeof currentSavedOpening === 'string' && currentSavedOpening.trim() !== '' && currentSavedOpening !== 'Unknown Opening';
  const opening = isSavedValid ? currentSavedOpening : detectedOpening;

  const criticalMoments = detectCriticalMoments(analysisResult.moveAnalysis)
  const lessons = generateLessons(analysisResult.moveAnalysis, analysisResult.weaknesses, analysisResult.playerLevel)
  const trainingRecommendations = generateTrainingRecommendations(analysisResult.weaknesses, lessons, analysisResult.moveAnalysis)

  await gameRepository.updateGameAnalysis(gameData.id, {
    ...gameData,
    opening,
    strengths: analysisResult.strengths,
    weaknesses: analysisResult.weaknesses,
    openingScore: analysisResult.openingScore,
    middleGameScore: analysisResult.middleGameScore,
    endgameScore: analysisResult.endgameScore,
    coachRecommendations: analysisResult.coachRecommendations,
    performanceScore: analysisResult.performanceScore,
    moveAnalysis: analysisResult.moveAnalysis,
    evaluationData: analysisResult.evaluationData,
    bestMoves: analysisResult.bestMoves,
    excellentMoves: analysisResult.excellentMoves,
    goodMoves: analysisResult.goodMoves,
    inaccuracies: analysisResult.inaccuracies,
    mistakes: analysisResult.mistakes,
    blunders: analysisResult.blunders,
    brilliantMoves: analysisResult.brilliantMoves,
    missedWins: analysisResult.missedWins,
    averageCentipawnLoss: analysisResult.averageCentipawnLoss,
    materialBalance: analysisResult.materialBalance,
    pieceActivityScore: analysisResult.pieceActivityScore,
    kingSafetyScore: analysisResult.kingSafetyScore,
    endgameQualityScore: analysisResult.endgameQualityScore,
    tacticalAbilityScore: analysisResult.tacticalAbilityScore,
    positionalPlayScore: analysisResult.positionalPlayScore,
    decisionMakingScore: analysisResult.decisionMakingScore,
    consistencyScore: analysisResult.consistencyScore,
    playingStyle: analysisResult.playingStyle,
    accuracy: analysisResult.accuracy,
    ratingAfterGame: ratingAfter,
    rankAfterGame: getRankFromRating(ratingAfter),
    playerLevelAfterGame: analysisResult.playerLevel || "Beginner",
    ratingChange: analysisResult.ratingChange,
  });

  const weakness = analysisResult.weaknesses.length > 0 ? analysisResult.weaknesses[0] : "Good player";

  return {
    result: gameData.result,
    totalMoves: moves.length,
    moves: moves,
    accuracy: analysisResult.accuracy,
    mistakes: analysisResult.mistakes,
    blunders: analysisResult.blunders,
    weakness,
    opening: opening || detectOpening(moves) || "Unknown Opening",
    analysis: analysisResult.moveAnalysis,
    strengths: analysisResult.strengths,
    weaknesses: analysisResult.weaknesses,
    openingScore: analysisResult.openingScore,
    middleGameScore: analysisResult.middleGameScore,
    endgameScore: analysisResult.endgameScore,
    coachRecommendations: analysisResult.coachRecommendations,
    performanceScore: analysisResult.performanceScore,
    ratingAfterGame: ratingAfter,
    rankAfterGame: getRankFromRating(ratingAfter),
    playerLevelAfterGame: analysisResult.playerLevel || "Beginner",
    ratingChange: analysisResult.ratingChange,
    evaluationData: analysisResult.evaluationData,
    bestMoves: analysisResult.bestMoves,
    excellentMoves: analysisResult.excellentMoves,
    goodMoves: analysisResult.goodMoves,
    inaccuracies: analysisResult.inaccuracies,
    brilliantMoves: analysisResult.brilliantMoves,
    missedWins: analysisResult.missedWins,
    averageCentipawnLoss: analysisResult.averageCentipawnLoss,
    playingStyle: analysisResult.playingStyle,
    tacticalAbilityScore: analysisResult.tacticalAbilityScore,
    positionalPlayScore: analysisResult.positionalPlayScore,
    decisionMakingScore: analysisResult.decisionMakingScore,
    consistencyScore: analysisResult.consistencyScore,
    pieceActivityScore: analysisResult.pieceActivityScore,
    kingSafetyScore: analysisResult.kingSafetyScore,
    endgameQualityScore: analysisResult.endgameQualityScore,
    materialBalance: analysisResult.materialBalance,
    phaseMoves: analysisResult.phaseMoves,
    criticalMoments,
    lessons,
    trainingRecommendations,
  };
}

function buildAnalysisResponse(gameData, moves) {
  const moveAnalysis = gameData.moveAnalysis || []
  const criticalMoments = detectCriticalMoments(moveAnalysis)
  const lessons = generateLessons(moveAnalysis, gameData.weaknesses || [], gameData.playerLevelAfterGame || 'Beginner')
  const trainingRecommendations = generateTrainingRecommendations(gameData.weaknesses || [], lessons, moveAnalysis)

  const currentOpening = gameData.opening || "Unknown Opening"
  const detectedOpening = moves.length > 0 ? detectOpening(moves) : "Unknown Opening"
  const opening = currentOpening === "Unknown Opening" && detectedOpening !== "Unknown Opening"
    ? detectedOpening
    : currentOpening

  return {
    result: gameData.result,
    totalMoves: moves.length,
    moves: moves,
    accuracy: gameData.accuracy,
    mistakes: gameData.mistakes || 0,
    blunders: gameData.blunders || 0,
    weakness: gameData.weaknesses && gameData.weaknesses.length > 0 ? gameData.weaknesses[0] : "Good player",
    opening,
    analysis: moveAnalysis,
    strengths: gameData.strengths || [],
    weaknesses: gameData.weaknesses || [],
    openingScore: gameData.openingScore || 0,
    middleGameScore: gameData.middleGameScore || 0,
    endgameScore: gameData.endgameScore || 0,
    coachRecommendations: gameData.coachRecommendations || [],
    performanceScore: gameData.performanceScore || 0,
    ratingAfterGame: gameData.ratingAfterGame,
    rankAfterGame: gameData.rankAfterGame,
    playerLevelAfterGame: gameData.playerLevelAfterGame,
    ratingChange: gameData.ratingChange,
    evaluationData: gameData.evaluationData || [],
    bestMoves: gameData.bestMoves || 0,
    excellentMoves: gameData.excellentMoves || 0,
    goodMoves: gameData.goodMoves || 0,
    inaccuracies: gameData.inaccuracies || 0,
    brilliantMoves: gameData.brilliantMoves || 0,
    missedWins: gameData.missedWins || 0,
    averageCentipawnLoss: gameData.averageCentipawnLoss || 0,
    playingStyle: gameData.playingStyle || "Balanced",
    tacticalAbilityScore: gameData.tacticalAbilityScore || 0,
    positionalPlayScore: gameData.positionalPlayScore || 0,
    decisionMakingScore: gameData.decisionMakingScore || 0,
    consistencyScore: gameData.consistencyScore || 0,
    pieceActivityScore: gameData.pieceActivityScore || 0,
    kingSafetyScore: gameData.kingSafetyScore || 0,
    endgameQualityScore: gameData.endgameQualityScore || 0,
    materialBalance: gameData.materialBalance || 0,
    phaseMoves: {
      opening: moveAnalysis.filter(m => m.phase === "opening").length,
      middlegame: moveAnalysis.filter(m => m.phase === "middlegame").length,
      endgame: moveAnalysis.filter(m => m.phase === "endgame").length,
    },
    criticalMoments,
    lessons,
    trainingRecommendations,
  };
}

async function getLegacyAnalysis(gameId) {
  const gameData = await gameRepository.getGameById(gameId);
  if (!gameData) {
    throw { status: 404, message: "Game not found" };
  }

  const moves = gameData.moves || [];
  const playerColor = gameData.playerColor || "white";
  const ratingBefore = gameData.ratingsBefore?.player1 || gameData.snapshotBefore || 1200;
  const ratingAfter = gameData.ratingsAfter?.player1 || gameData.snapshotAfter || ratingBefore;
  const duration = gameData.duration || 0;
  const difficulty = gameData.difficulty || "intermediate";

  const analysisResult = performAnalysis(moves, playerColor, null, ratingBefore, ratingAfter, duration, difficulty);

  return {
    result: gameData.result,
    totalMoves: moves.length,
    moves: moves,
    accuracy: analysisResult.accuracy,
    mistakes: analysisResult.mistakes,
    blunders: analysisResult.blunders,
    weakness: analysisResult.weaknesses.length > 0 ? analysisResult.weaknesses[0] : "Good player",
    opening: gameData.opening || detectOpening(moves) || "Unknown Opening",
    analysis: analysisResult.moveAnalysis,
    strengths: analysisResult.strengths,
    weaknesses: analysisResult.weaknesses,
    openingScore: analysisResult.openingScore,
    middleGameScore: analysisResult.middleGameScore,
    endgameScore: analysisResult.endgameScore,
    coachRecommendations: analysisResult.coachRecommendations,
    performanceScore: analysisResult.performanceScore,
    ratingAfterGame: ratingAfter,
    rankAfterGame: getRankFromRating(ratingAfter),
    playerLevelAfterGame: analysisResult.playerLevel || "Beginner",
    ratingChange: analysisResult.ratingChange,
    evaluationData: analysisResult.evaluationData,
    bestMoves: analysisResult.bestMoves,
    excellentMoves: analysisResult.excellentMoves,
    goodMoves: analysisResult.goodMoves,
    inaccuracies: analysisResult.inaccuracies,
    brilliantMoves: analysisResult.brilliantMoves,
    missedWins: analysisResult.missedWins,
    averageCentipawnLoss: analysisResult.averageCentipawnLoss,
    playingStyle: analysisResult.playingStyle,
    tacticalAbilityScore: analysisResult.tacticalAbilityScore,
    positionalPlayScore: analysisResult.positionalPlayScore,
    decisionMakingScore: analysisResult.decisionMakingScore,
    consistencyScore: analysisResult.consistencyScore,
    pieceActivityScore: analysisResult.pieceActivityScore,
    kingSafetyScore: analysisResult.kingSafetyScore,
    endgameQualityScore: analysisResult.endgameQualityScore,
    materialBalance: analysisResult.materialBalance,
  };
}

module.exports = {
  getFullAnalysis,
  getLegacyAnalysis,
};
