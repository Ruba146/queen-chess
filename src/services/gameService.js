const userRepository = require("../repositories/userRepository");
const gameRepository = require("../repositories/gameRepository");
const { calculateElo } = require("../utils/elo");
const { performAnalysis, getRankFromRating, determinePlayerLevel } = require("./analysisService");
const { buildTrainingDatasetPayload } = require("./trainingDatasetService");
const { detectOpening } = require("./gameAnalysisService");

async function getStats(user, mode) {
  const stats = user.stats?.[mode] || { wins: 0, losses: 0, draws: 0 };
  const rating = user.ratings?.[mode] || 800;
  const games = user.gamesPlayed?.[mode] || 0;
  const streak = user.winStreak?.[mode] || 0;

  const wins = stats.wins;
  const losses = stats.losses;
  const draws = stats.draws;
  const total = wins + losses + draws;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "0%";

  let tier = "Beginner";
  if (rating >= 2400) tier = "Master";
  else if (rating >= 2000) tier = "Platinum";
  else if (rating >= 1600) tier = "Gold";
  else if (rating >= 1200) tier = "Silver";
  else if (rating >= 800) tier = "Bronze";

  return {
    rating,
    tier,
    gamesPlayed: games,
    wins,
    losses,
    draws,
    winRate,
    currentStreak: streak,
  };
}

async function saveGame(userId, body) {
  const user = await userRepository.getUserById(userId, { includePassword: true });

  const mode = body.mode || "rapid";
  const result = body.result || "unknown";
  const moves = body.moves || [];
  const pgn = body.pgn || "";
  const playerColor = body.playerColor || "white";
  const accuracy = body.accuracy || 0;
  const opening = body.opening || detectOpening(moves) || "Unknown Opening";
  const difficulty = body.difficulty || "intermediate";
  const duration = body.duration || 0;

  let isWin = false;
  let isLoss = false;
  let isDraw = false;

  if (result === "draw") {
    isDraw = true;
  } else if (result === "White") {
    isWin = playerColor === "white";
    isLoss = playerColor !== "white";
  } else if (result === "Black") {
    isWin = playerColor === "black";
    isLoss = playerColor !== "black";
  }

  const ratingBefore = user.ratings?.[mode] || 1200;
  let score = 0.5;
  if (isWin) score = 1;
  else if (isLoss) score = 0;

  const aiRatings = {
    beginner: 800,
    intermediate: 1200,
    advanced: 1600,
    master: 2200,
  };
  const opponentRating = aiRatings[difficulty] || 1200;
  const gamesPlayed = user.gamesPlayed?.[mode] || 0;
  const streak = user.winStreak?.[mode] || 0;
  const newRating = calculateElo(ratingBefore, opponentRating, score, gamesPlayed, streak);

  let analysisResult = null;
  if (moves.length > 0) {
    analysisResult = performAnalysis(moves, playerColor, null, ratingBefore, newRating, duration, difficulty);
  }

  const totalAccuracySum = (user.totalAccuracySum || 0) + (accuracy > 0 ? accuracy : 0);
  const totalAccuracyGames = (user.totalAccuracyGames || 0) + (accuracy > 0 ? 1 : 0);
  const totalCentipawnLoss = (user.totalCentipawnLoss || 0) +
    (analysisResult?.averageCentipawnLoss > 0 ? analysisResult.averageCentipawnLoss : 0);
  const totalCentipawnGames = (user.totalCentipawnGames || 0) +
    (analysisResult?.averageCentipawnLoss > 0 ? 1 : 0);
  const consistencyScore = totalCentipawnGames > 0
    ? Math.round(Math.max(0, 100 - (totalCentipawnLoss / totalCentipawnGames) / 3))
    : user.consistencyScore || 50;

  const nextGames = gamesPlayed + 1;
  const nextWins = (user.stats?.[mode]?.wins || 0) + (isWin ? 1 : 0);
  const winRate = nextGames > 0 ? (nextWins / nextGames) * 100 : 0;
  const avgAccuracy = totalAccuracyGames > 0
    ? Math.round(totalAccuracySum / totalAccuracyGames)
    : 0;

  const playerLevel = determinePlayerLevel(newRating, winRate, avgAccuracy, consistencyScore, nextGames);

  const updatedUser = await userRepository.updateUserGameStats(user, mode, {
    newRating,
    isWin,
    isLoss,
    isDraw,
    winStreak: isWin ? (user.winStreak?.[mode] || 0) + 1 : 0,
    totalAccuracySum,
    totalAccuracyGames,
    totalCentipawnLoss,
    totalCentipawnGames,
    consistencyScore,
    playerLevel,
  });

  const gameData = {
    userId,
    mode,
    result,
    moves,
    pgn,
    playerColor,
    accuracy: analysisResult ? analysisResult.accuracy : accuracy,
    opening,
    difficulty,
    duration,
    ratingsBefore: { player1: ratingBefore, player2: opponentRating },
    ratingsAfter: { player1: newRating, player2: opponentRating },
    ratingAfterGame: newRating,
    rankAfterGame: getRankFromRating(newRating),
    playerLevelAfterGame: updatedUser.playerLevel,
    ratingChange: newRating - ratingBefore,
    snapshotBefore: ratingBefore,
    snapshotAfter: newRating,
    snapshotChange: newRating - ratingBefore,
  };

  if (analysisResult) {
    Object.assign(gameData, {
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
    });
  }

  const game = await gameRepository.createGame(gameData);

  const trainingDatasetPayload = buildTrainingDatasetPayload({
    userId,
    mode,
    result,
    moves,
    pgn,
    playerColor,
    accuracy: analysisResult ? analysisResult.accuracy : accuracy,
    opening,
    difficulty,
    duration,
    analysisResult,
    ratingBefore,
    newRating,
    ratingChange: newRating - ratingBefore,
  });

  await gameRepository.createGame({
    ...gameData,
    ...trainingDatasetPayload,
    userId,
    isTrainingDataset: true,
    parentGameId: game.id,
    result,
    moves,
    pgn,
    playerColor,
    accuracy: analysisResult ? analysisResult.accuracy : accuracy,
    opening,
    difficulty,
    duration,
    ratingsBefore: { player1: ratingBefore, player2: opponentRating },
    ratingsAfter: { player1: newRating, player2: opponentRating },
    ratingAfterGame: newRating,
    rankAfterGame: getRankFromRating(newRating),
    playerLevelAfterGame: updatedUser.playerLevel,
    ratingChange: newRating - ratingBefore,
  });

  return {
    success: true,
    game,
    ratingChange: newRating - ratingBefore,
    newRating,
    rankAfterGame: getRankFromRating(newRating),
    playerLevelAfterGame: updatedUser.playerLevel,
    analysis: analysisResult ? {
      accuracy: analysisResult.accuracy,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      openingScore: analysisResult.openingScore,
      middleGameScore: analysisResult.middleGameScore,
      endgameScore: analysisResult.endgameScore,
      coachRecommendations: analysisResult.coachRecommendations,
      performanceScore: analysisResult.performanceScore,
      playingStyle: analysisResult.playingStyle,
      totalMoves: moves.length,
      averageCentipawnLoss: analysisResult.averageCentipawnLoss,
      bestMoves: analysisResult.bestMoves,
      excellentMoves: analysisResult.excellentMoves,
      goodMoves: analysisResult.goodMoves,
      inaccuracies: analysisResult.inaccuracies,
      mistakes: analysisResult.mistakes,
      blunders: analysisResult.blunders,
      brilliantMoves: analysisResult.brilliantMoves,
      missedWins: analysisResult.missedWins,
    } : null,
  };
}

async function listMyGames(userId, options = {}) {
  return gameRepository.listUserGames(userId, { excludeTraining: true, ...options });
}

async function getGameById(gameId) {
  const game = await gameRepository.getGameById(gameId);
  if (!game) {
    throw { status: 404, message: "Game not found" };
  }
  return game;
}

module.exports = {
  getStats,
  saveGame,
  listMyGames,
  getGameById,
};