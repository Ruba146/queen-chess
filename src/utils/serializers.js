function omitPassword(user) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

function withLegacyId(record) {
  if (!record) return record;
  return { ...record, _id: record.id };
}

const DEFAULT_MODES = ["rapid", "blitz", "bullet"];

function statsToMaps(userStats = [], ratingHistories = []) {
  const ratings = {};
  const bestRating = {};
  const gamesPlayed = {};
  const winStreak = {};
  const stats = {};
  const ratingHistory = {};

  for (const mode of DEFAULT_MODES) {
    ratings[mode] = 1200;
    bestRating[mode] = 1200;
    gamesPlayed[mode] = 0;
    winStreak[mode] = 0;
    stats[mode] = { wins: 0, losses: 0, draws: 0 };
    ratingHistory[mode] = [];
  }

  for (const row of userStats) {
    ratings[row.mode] = row.rating;
    bestRating[row.mode] = row.bestRating;
    gamesPlayed[row.mode] = row.gamesPlayed;
    winStreak[row.mode] = row.winStreak;
    stats[row.mode] = {
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
    };
  }

  for (const row of ratingHistories) {
    if (!ratingHistory[row.mode]) ratingHistory[row.mode] = [];
    ratingHistory[row.mode].push({
      _id: row.id,
      id: row.id,
      rating: row.rating,
      date: row.date,
    });
  }

  return { ratings, bestRating, gamesPlayed, winStreak, stats, ratingHistory };
}

function serializeUser(user, { includePassword = false } = {}) {
  if (!user) return null;
  const mapped = {
    ...withLegacyId(user),
    ...statsToMaps(user.userStats, user.ratingHistories),
  };
  delete mapped.userStats;
  delete mapped.ratingHistories;
  return includePassword ? mapped : omitPassword(mapped);
}

function userInclude() {
  return {
    userStats: true,
    ratingHistories: { orderBy: { date: "asc" } },
  };
}

function serializeGame(game) {
  if (!game) return null;
  return {
    ...withLegacyId(game),
    user: game.userId,
    moves: game.moves || [],
    ratingsBefore: {
      player1: game.ratingsBeforePlayer1,
      player2: game.ratingsBeforePlayer2,
    },
    ratingsAfter: {
      player1: game.ratingsAfterPlayer1,
      player2: game.ratingsAfterPlayer2,
    },
    labels: {
      outcome: game.labelOutcome,
      color: game.labelColor,
      opening: game.labelOpening,
      difficulty: game.labelDifficulty,
    },
    ratingSnapshot: {
      before: game.snapshotBefore,
      after: game.snapshotAfter,
      change: game.snapshotChange,
    },
    moveAnalysis: (game.moveAnalyses || []).map(withLegacyId),
    moveRecords: (game.moveAnalyses || []).map(withLegacyId),
    evaluationData: (game.evalData || []).map(withLegacyId),
  };
}

function gameInclude() {
  return {
    moveAnalyses: { orderBy: { moveNumber: "asc" } },
    evalData: { orderBy: { moveNumber: "asc" } },
  };
}

function buildGameData(input) {
  return {
    userId: input.userId || input.user,
    mode: input.mode || "rapid",
    result: input.result || "unknown",
    opening: input.opening || "Unknown Opening",
    accuracy: input.accuracy || 0,
    pgn: input.pgn || "",
    playerColor: input.playerColor || "white",
    difficulty: input.difficulty || "intermediate",
    duration: input.duration || 0,
    ratingsBeforePlayer1: input.ratingsBefore?.player1 ?? input.ratingsBeforePlayer1 ?? 1200,
    ratingsBeforePlayer2: input.ratingsBefore?.player2 ?? input.ratingsBeforePlayer2 ?? 1200,
    ratingsAfterPlayer1: input.ratingsAfter?.player1 ?? input.ratingsAfterPlayer1 ?? 1200,
    ratingsAfterPlayer2: input.ratingsAfter?.player2 ?? input.ratingsAfterPlayer2 ?? 1200,
    ratingAfterGame: input.ratingAfterGame ?? 1200,
    rankAfterGame: input.rankAfterGame || "Beginner",
    playerLevelAfterGame: input.playerLevelAfterGame || "Beginner",
    ratingChange: input.ratingChange ?? 0,
    labelOutcome: input.labels?.outcome || input.labelOutcome || input.outcome || "unknown",
    labelColor: input.labels?.color || input.labelColor || input.playerColor || "white",
    labelOpening: input.labels?.opening || input.labelOpening || input.opening || "Unknown",
    labelDifficulty: input.labels?.difficulty || input.labelDifficulty || input.difficulty || "intermediate",
    snapshotBefore: input.ratingSnapshot?.before ?? input.snapshotBefore ?? 1200,
    snapshotAfter: input.ratingSnapshot?.after ?? input.snapshotAfter ?? 1200,
    snapshotChange: input.ratingSnapshot?.change ?? input.snapshotChange ?? 0,
    openingScore: input.openingScore ?? input.metrics?.openingScore ?? 0,
    middleGameScore: input.middleGameScore ?? input.metrics?.middleGameScore ?? 0,
    endgameScore: input.endgameScore ?? input.metrics?.endgameScore ?? 0,
    performanceScore: input.performanceScore ?? input.metrics?.performanceScore ?? 0,
    bestMoves: input.bestMoves ?? input.metrics?.bestMoves ?? 0,
    excellentMoves: input.excellentMoves ?? input.metrics?.excellentMoves ?? 0,
    goodMoves: input.goodMoves ?? input.metrics?.goodMoves ?? 0,
    inaccuracies: input.inaccuracies ?? input.metrics?.inaccuracies ?? 0,
    mistakes: input.mistakes ?? input.metrics?.mistakes ?? 0,
    blunders: input.blunders ?? input.metrics?.blunders ?? 0,
    brilliantMoves: input.brilliantMoves ?? input.metrics?.brilliantMoves ?? 0,
    missedWins: input.missedWins ?? input.metrics?.missedWins ?? 0,
    averageCentipawnLoss: input.averageCentipawnLoss ?? input.metrics?.averageCentipawnLoss ?? 0,
    materialBalance: input.materialBalance ?? input.metrics?.materialBalance ?? 0,
    pieceActivityScore: input.pieceActivityScore ?? 0,
    kingSafetyScore: input.kingSafetyScore ?? 0,
    endgameQualityScore: input.endgameQualityScore ?? 0,
    tacticalAbilityScore: input.tacticalAbilityScore ?? 0,
    positionalPlayScore: input.positionalPlayScore ?? 0,
    decisionMakingScore: input.decisionMakingScore ?? 0,
    consistencyScore: input.consistencyScore ?? 0,
    playingStyle: input.playingStyle || "Balanced",
    isTrainingDataset: Boolean(input.isTrainingDataset),
    parentGameId: input.parentGameId || null,
    totalMoves: input.totalMoves ?? (input.moves || []).length,
    outcome: input.outcome || "unknown",
    moves: input.moves || [],
    strengths: input.strengths || input.metrics?.strengths || [],
    weaknesses: input.weaknesses || input.metrics?.weaknesses || [],
    coachRecommendations: input.coachRecommendations || input.metrics?.coachRecommendations || [],
    createdAt: input.createdAt,
  };
}

function moveAnalysisData(records = []) {
  return records.map((record) => ({
    moveNumber: record.moveNumber,
    move: record.move || "",
    classification: record.classification || "unknown",
    loss: Math.round(record.loss || 0),
    evalBefore: Math.round(record.evalBefore || 0),
    evalAfter: Math.round(record.evalAfter || 0),
    phase: record.phase || "unknown",
  }));
}

function evalData(records = []) {
  return records.map((record) => ({
    moveNumber: record.moveNumber,
    playerEval: Math.round(record.playerEval || 0),
    bestEval: Math.round(record.bestEval || 0),
    diff: Math.round(record.diff || 0),
  }));
}

function serializeDailyMission(mission) {
  if (!mission) return null;
  return {
    ...withLegacyId(mission),
    user: mission.userId,
    missions: (mission.missions || []).map(withLegacyId),
  };
}

function serializeAIMemory(memory) {
  if (!memory) return null;
  return {
    ...withLegacyId(memory),
    user: memory.userId,
    memories: (memory.entries || []).map(withLegacyId),
  };
}

module.exports = {
  omitPassword,
  withLegacyId,
  serializeUser,
  userInclude,
  serializeGame,
  gameInclude,
  buildGameData,
  moveAnalysisData,
  evalData,
  serializeDailyMission,
  serializeAIMemory,
};