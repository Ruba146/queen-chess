const { Chess } = require("chess.js");
const gameRepository = require("../repositories/gameRepository");
const { performAnalysis, getRankFromRating, determinePlayerLevel } = require("./analysisService");

function classifyMove(loss) {
  if (loss <= 10) return "Best";
  if (loss <= 30) return "Excellent";
  if (loss <= 60) return "Good";
  if (loss <= 100) return "Inaccuracy";
  if (loss <= 250) return "Mistake";
  return "Blunder";
}

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

async function getFullAnalysis(gameId) {
  const gameData = await gameRepository.getGameById(gameId);
  if (!gameData) {
    throw { status: 404, message: "Game not found" };
  }

  const chess = new Chess();
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
    accuracy: analysisResult.accuracy,
    mistakes: analysisResult.mistakes,
    blunders: analysisResult.blunders,
    weakness,
    opening,
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
  };
}

function buildAnalysisResponse(gameData, moves) {
  return {
    result: gameData.result,
    totalMoves: moves.length,
    accuracy: gameData.accuracy,
    mistakes: gameData.mistakes || 0,
    blunders: gameData.blunders || 0,
    weakness: gameData.weaknesses && gameData.weaknesses.length > 0 ? gameData.weaknesses[0] : "Good player",
    opening: gameData.opening || "Unknown Opening",
    analysis: gameData.moveAnalysis || [],
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
      opening: gameData.moveAnalysis ? gameData.moveAnalysis.filter(m => m.phase === "opening").length : 0,
      middlegame: gameData.moveAnalysis ? gameData.moveAnalysis.filter(m => m.phase === "middlegame").length : 0,
      endgame: gameData.moveAnalysis ? gameData.moveAnalysis.filter(m => m.phase === "endgame").length : 0,
    },
  };
}

async function getLegacyAnalysis(gameId) {
  const gameData = await gameRepository.getGameById(gameId);
  if (!gameData) {
    throw { status: 404, message: "Game not found" };
  }

  const chess = new Chess();
  let analysis = [];
  let mistakes = 0;
  let blunders = 0;
  let totalLoss = 0;

  for (let i = 0; i < gameData.moves.length; i++) {
    const move = gameData.moves[i];
    const loss = Math.abs(Math.random() * 100);
    totalLoss += loss;
    const classification = classifyMove(loss);
    if (classification === "Mistake") mistakes++;
    if (classification === "Blunder") blunders++;
    analysis.push({
      moveNumber: i + 1,
      move,
      classification,
      loss: Math.round(loss),
    });
    chess.move(move);
  }

  const avgLoss = totalLoss / gameData.moves.length;
  const accuracy = Math.max(0, Math.round(100 - avgLoss / 2));

  return {
    result: gameData.result,
    totalMoves: gameData.moves.length,
    accuracy,
    mistakes,
    blunders,
    weakness: "Good player",
    opening: gameData.opening || "Unknown Opening",
    analysis,
  };
}

module.exports = {
  getFullAnalysis,
  getLegacyAnalysis,
};