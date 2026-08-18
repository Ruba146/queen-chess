const { performAnalysis } = require("./analysisService");
const { generateTacticsExplanation } = require("../ai/aiExplanationService");

async function generateGameReview(game, profile) {
  const moves = game.moves || [];
  const playerColor = game.playerColor || "white";
  const ratingBefore = game.ratingsBefore?.player1 || 1200;
  const ratingAfter = game.ratingsAfter?.player1 || ratingBefore;
  const duration = game.duration || 0;
  const difficulty = game.difficulty || "intermediate";

  let analysisResult;
  try {
    analysisResult = performAnalysis(moves, playerColor, null, ratingBefore, ratingAfter, duration, difficulty);
  } catch {
    analysisResult = {
      strengths: [],
      weaknesses: ["Analysis unavailable"],
      openingScore: 0,
      middleGameScore: 0,
      endgameScore: 0,
      coachRecommendations: [],
      performanceScore: 0,
      moveAnalysis: [],
      evaluationData: [],
      bestMoves: 0,
      excellentMoves: 0,
      goodMoves: 0,
      inaccuracies: 0,
      mistakes: 0,
      blunders: 0,
      brilliantMoves: 0,
      missedWins: 0,
      averageCentipawnLoss: 0,
      materialBalance: 0,
      pieceActivityScore: 0,
      kingSafetyScore: 0,
      endgameQualityScore: 0,
      tacticalAbilityScore: 0,
      positionalPlayScore: 0,
      decisionMakingScore: 0,
      consistencyScore: 0,
      playingStyle: "Balanced",
      accuracy: 0,
      ratingChange: 0,
      phaseMoves: { opening: 0, middlegame: 0, endgame: 0 },
    };
  }

  let summaryExplanation = null;
  try {
    summaryExplanation = await generateTacticsExplanation({
      fen: game.fen || "start",
      solution: [],
      themes: ["game-review"],
      rating: ratingBefore,
      goal: "Game review and improvement plan",
      evalBefore: { score: 0 },
      evalAfter: { score: 0 },
      materialBefore: 0,
      materialAfter: 0,
    });
  } catch {
    summaryExplanation = null;
  }

  const strengths = analysisResult.strengths && analysisResult.strengths.length > 0 ? analysisResult.strengths : ["Completed the game"];
  const weaknesses = analysisResult.weaknesses && analysisResult.weaknesses.length > 0 ? analysisResult.weaknesses : ["Review critical moments"];
  const criticalMoments = (analysisResult.moveAnalysis || [])
    .filter((m) => m.classification === "Blunder" || m.classification === "Mistake")
    .slice(0, 5)
    .map((m) => ({
      moveNumber: m.moveNumber,
      move: m.move,
      classification: m.classification,
      loss: m.loss,
      phase: m.phase,
    }));

  return {
    gameId: game._id || game.id,
    summary: {
      result: game.result || "unknown",
      accuracy: analysisResult.accuracy || 0,
      ratingChange: analysisResult.ratingChange || 0,
      performanceScore: analysisResult.performanceScore || 0,
      explanation: summaryExplanation?.explanation || "Game review generated.",
    },
    strengths,
    weaknesses,
    criticalMoments,
    trainingRecommendations: analysisResult.coachRecommendations || ["Review the game to identify key learning points."],
    statistics: {
      totalMoves: moves.length,
      bestMoves: analysisResult.bestMoves || 0,
      excellentMoves: analysisResult.excellentMoves || 0,
      goodMoves: analysisResult.goodMoves || 0,
      inaccuracies: analysisResult.inaccuracies || 0,
      mistakes: analysisResult.mistakes || 0,
      blunders: analysisResult.blunders || 0,
      brilliantMoves: analysisResult.brilliantMoves || 0,
      missedWins: analysisResult.missedWins || 0,
      averageCentipawnLoss: analysisResult.averageCentipawnLoss || 0,
      openingScore: analysisResult.openingScore || 0,
      middleGameScore: analysisResult.middleGameScore || 0,
      endgameScore: analysisResult.endgameScore || 0,
      tacticalAbilityScore: analysisResult.tacticalAbilityScore || 0,
      positionalPlayScore: analysisResult.positionalPlayScore || 0,
      decisionMakingScore: analysisResult.decisionMakingScore || 0,
      consistencyScore: analysisResult.consistencyScore || 0,
      playingStyle: analysisResult.playingStyle || "Balanced",
    },
  };
}

module.exports = { generateGameReview };
