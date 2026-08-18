const prisma = require("../config/prisma");

async function createPuzzle(data) {
  const puzzle = await prisma.puzzle.create({
    data: {
      fen: data.fen,
      solution: data.solution || [],
      theme: data.theme,
      category: data.category,
      difficulty: data.difficulty || "intermediate",
      explanation: data.explanation || null,
      hint: data.hint || null,
      evaluation: data.evaluation || null,
      goal: data.goal || "Find the best move",
      rating: data.rating || 1000,
      generatedByAI: Boolean(data.generatedByAI),
      completed: Boolean(data.completed),
      attempts: data.attempts || 0,
      solvedAt: data.solvedAt || null,
    },
  });
  return puzzle;
}

async function getPuzzleById(id) {
  return prisma.puzzle.findUnique({ where: { id } });
}

async function getPuzzleByFen(fen) {
  return prisma.puzzle.findUnique({ where: { fen } });
}

async function getPuzzleByFenSolutionTheme(fen, solution, theme) {
  const candidates = await prisma.puzzle.findMany({
    where: { fen, theme },
    take: 10,
  });
  return candidates.find((p) => JSON.stringify(p.solution) === JSON.stringify(solution)) || null;
}

async function createPuzzleExplanationCache(puzzleId, explanation) {
  return prisma.aICache.create({
    data: {
      key: `puzzle-explanation:${puzzleId}`,
      data: JSON.stringify(explanation),
      ttl: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

async function getPuzzleExplanationCache(puzzleId) {
  const row = await prisma.aICache.findUnique({
    where: { key: `puzzle-explanation:${puzzleId}` },
  });
  if (!row) return null;
  if (row.ttl < new Date()) {
    await prisma.aICache.delete({ where: { key: `puzzle-explanation:${puzzleId}` } });
    return null;
  }
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

async function getUserPuzzleProfileStats(userId) {
  const [progressItems, collections, user] = await Promise.all([
    prisma.userPuzzleProgress.findMany({
      where: { userId, completed: true },
      include: { puzzle: true },
    }),
    prisma.userPuzzleCollectionProgress.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const totalSolved = progressItems.length;
  const totalAttempts = progressItems.reduce((sum, p) => sum + p.attempts, 0);
  const accuracy = totalSolved > 0 ? Math.round((totalSolved / Math.max(totalAttempts, totalSolved)) * 100) : 0;

  const categoryStats = {};
  for (const col of collections) {
    categoryStats[col.category] = {
      completed: col.completedPuzzles,
      total: col.totalPuzzles,
      accuracy: col.accuracy,
      bestStreak: col.bestStreak,
      xpEarned: col.xpEarned,
      completionPct: col.completionPct,
    };
  }

  let favoriteCategory = null;
  let strongestCategory = null;
  let weakestCategory = null;
  let maxCompleted = 0;
  let maxAccuracy = -1;
  let minAccuracy = 101;

  for (const [cat, stats] of Object.entries(categoryStats)) {
    if (stats.completed > maxCompleted) {
      maxCompleted = stats.completed;
      favoriteCategory = cat;
    }
    if (stats.accuracy > maxAccuracy) {
      maxAccuracy = stats.accuracy;
      strongestCategory = cat;
    }
    if (stats.accuracy < minAccuracy && stats.total > 0) {
      minAccuracy = stats.accuracy;
      weakestCategory = cat;
    }
  }

  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
  for (const p of progressItems) {
    const d = p.puzzle?.difficulty;
    if (d && difficultyCounts[d] !== undefined) {
      difficultyCounts[d]++;
    }
  }

  return {
    totalSolved,
    totalAttempts,
    accuracy,
    currentStreak: user?.puzzleCurrentStreak || 0,
    bestStreak: Math.max(...collections.map(c => c.bestStreak), 0),
    favoriteCategory,
    strongestCategory,
    weakestCategory,
    categoryStats,
    difficultyProgression: difficultyCounts,
    totalXpEarned: collections.reduce((sum, c) => sum + c.xpEarned, 0),
  };
}

async function checkAndUnlockAchievements(userId, puzzleId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  const progress = await prisma.userPuzzleProgress.findMany({
    where: { userId, completed: true },
  });

  const totalSolved = progress.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySolved = progress.filter(p => p.solvedAt && p.solvedAt >= today).length;
  const streak = user.puzzleCurrentStreak || 0;

  const achievements = [...(user.achievements || [])];
  const newAchievements = [];

  const candidateAchievements = [
    { id: 'puzzle-10', check: () => totalSolved >= 10 },
    { id: 'puzzle-100', check: () => totalSolved >= 100 },
    { id: 'streak-10', check: () => streak >= 10 },
    { id: 'perfect-day', check: () => todaySolved >= 10 },
    { id: 'mate-hunter', check: async () => {
      const mateCount = await prisma.puzzle.count({ where: { userId, theme: { in: ['mate-in-1', 'mate-in-2', 'mate-in-3'] }, completed: true } });
      return mateCount >= 10;
    }},
    { id: 'fork-master', check: async () => {
      const forkCount = await prisma.userPuzzleProgress.count({
        where: { userId, completed: true, puzzle: { theme: 'fork' } },
      });
      return forkCount >= 10;
    }},
    { id: 'opening-expert', check: async () => {
      const openingCount = await prisma.userPuzzleProgress.count({
        where: { userId, completed: true, puzzle: { theme: 'opening' } },
      });
      return openingCount >= 10;
    }},
    { id: 'endgame-master', check: async () => {
      const endgameCount = await prisma.userPuzzleProgress.count({
        where: { userId, completed: true, puzzle: { theme: 'endgame' } },
      });
      return endgameCount >= 10;
    }},
  ];

  for (const ach of candidateAchievements) {
    if (!achievements.includes(ach.id)) {
      const unlocked = await ach.check();
      if (unlocked) {
        achievements.push(ach.id);
        newAchievements.push(ach.id);
      }
    }
  }

  if (newAchievements.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { achievements },
    });
  }

  return newAchievements;
}

async function updateUserPuzzleStreak(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  const lastActiveDay = lastActive ? new Date(lastActive) : null;
  lastActiveDay?.setHours(0, 0, 0, 0);

  let currentStreak = user.puzzleCurrentStreak || 0;
  if (!lastActiveDay || lastActiveDay.getTime() !== today.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActiveDay && lastActiveDay.getTime() === yesterday.getTime()) {
      currentStreak += 1;
    } else if (!lastActiveDay) {
      currentStreak = 1;
    } else {
      currentStreak = 1;
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        puzzleCurrentStreak: currentStreak,
        lastActiveDate: today,
      },
    });
  }
}

async function getPuzzlesByCategory(category, options = {}) {
  const { skip = 0, take = 50, difficulty, where } = options;
  return prisma.puzzle.findMany({
    where: {
      category,
      ...(difficulty ? { difficulty } : {}),
      ...where,
    },
    skip,
    take,
    orderBy: { createdAt: "asc" },
  });
}

async function getNextUnsolvedPuzzle(userId, category, excludeIds = [], take = 1) {
  const solvedItems = await prisma.userPuzzleProgress.findMany({
    where: { userId, completed: true, puzzle: { category } },
    select: { puzzleId: true },
  });
  const solvedIds = new Set(solvedItems.map((i) => i.puzzleId));
  const allExcludeIds = new Set([...excludeIds, ...solvedIds]);

  return prisma.puzzle.findFirst({
    where: {
      category,
      id: { notIn: Array.from(allExcludeIds) },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function countPuzzlesByCategory(category) {
  return prisma.puzzle.count({ where: { category } });
}

async function getCategoryTotalCounts() {
  return prisma.puzzle.groupBy({
    by: ['category'],
    _count: { category: true },
  });
}

async function getPuzzlesByCategoryWithProgress(userId, category, options = {}) {
  const { skip = 0, take = 50, difficulty } = options;
  const puzzles = await prisma.puzzle.findMany({
    where: {
      category,
      ...(difficulty ? { difficulty } : {}),
    },
    skip,
    take,
    orderBy: { createdAt: "asc" },
  });

  const puzzleIds = puzzles.map((p) => p.id)
  const progressRecords = await prisma.userPuzzleProgress.findMany({
    where: {
      userId,
      puzzleId: { in: puzzleIds },
    },
  })

  const progressMap = new Map(progressRecords.map((p) => [p.puzzleId, p]))

  return puzzles.map((puzzle) => ({
    ...puzzle,
    completed: progressMap.get(puzzle.id)?.completed || false,
    attempts: progressMap.get(puzzle.id)?.attempts || 0,
  }))
}

async function getRandomPuzzle(category, options = {}) {
  const { difficulty, excludeIds = [] } = options;
  const where = {
    category,
    ...(difficulty ? { difficulty } : {}),
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  };
  const count = await prisma.puzzle.count({ where });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * Math.min(count, 1000));
  return prisma.puzzle.findFirst({
    where,
    skip,
    orderBy: { createdAt: "desc" },
  });
}

async function getUserPuzzleProgress(userId, puzzleId) {
  return prisma.userPuzzleProgress.findUnique({
    where: { userId_puzzleId: { userId, puzzleId } },
  });
}

async function upsertUserPuzzleProgress(userId, puzzleId, data) {
  return prisma.userPuzzleProgress.upsert({
    where: { userId_puzzleId: { userId, puzzleId } },
    update: {
      completed: data.completed ?? false,
      attempts: data.attempts ?? 0,
      solvedAt: data.solvedAt ?? undefined,
    },
    create: {
      userId,
      puzzleId,
      completed: data.completed || false,
      attempts: data.attempts || 0,
      solvedAt: data.solvedAt || null,
    },
  });
}

async function listUserPuzzleProgress(userId, options = {}) {
  const { category, completed, skip = 0, take = 100 } = options;
  const where = {
    userId,
    ...(category ? { puzzle: { category } } : {}),
    ...(completed !== undefined ? { completed } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.userPuzzleProgress.findMany({
      where,
      skip,
      take,
      include: { puzzle: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.userPuzzleProgress.count({ where }),
  ]);

  return { items, total };
}

async function getOrCreateCollectionProgress(userId, category) {
  const existing = await prisma.userPuzzleCollectionProgress.findUnique({
    where: { userId_category: { userId, category } },
  });

  if (existing) {
    return existing;
  }

  const totalPuzzles = await prisma.puzzle.count({ where: { category } });
  return prisma.userPuzzleCollectionProgress.create({
    data: {
      userId,
      category,
      totalPuzzles,
      completedPuzzles: 0,
      currentPuzzleIndex: 0,
      accuracy: 0,
      bestStreak: 0,
      xpEarned: 0,
      completionPct: 0,
    },
  });
}

async function updateCollectionProgress(userId, category, updates) {
  const progress = await getOrCreateCollectionProgress(userId, category);
  const totalPuzzles = updates.totalPuzzles ?? progress.totalPuzzles;
  const completedPuzzles = updates.completedPuzzles ?? progress.completedPuzzles;
  const completionPct = totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0;

  return prisma.userPuzzleCollectionProgress.update({
    where: { userId_category: { userId, category } },
    data: {
      totalPuzzles,
      completedPuzzles,
      currentPuzzleIndex: updates.currentPuzzleIndex ?? progress.currentPuzzleIndex,
      accuracy: updates.accuracy ?? progress.accuracy,
      bestStreak: updates.bestStreak ?? progress.bestStreak,
      xpEarned: updates.xpEarned ?? progress.xpEarned,
      lastPlayed: updates.lastPlayed ?? new Date(),
      completionPct,
    },
  });
}

async function updateCollectionProgressDirect(userId, category, updates) {
  const totalPuzzles = updates.totalPuzzles ?? 0;
  const completedPuzzles = updates.completedPuzzles ?? 0;
  const completionPct = totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0;

  return prisma.userPuzzleCollectionProgress.update({
    where: { userId_category: { userId, category } },
    data: {
      totalPuzzles,
      completedPuzzles,
      currentPuzzleIndex: updates.currentPuzzleIndex ?? 0,
      accuracy: updates.accuracy ?? 0,
      bestStreak: updates.bestStreak ?? 0,
      xpEarned: updates.xpEarned ?? 0,
      lastPlayed: updates.lastPlayed ?? new Date(),
      completionPct,
    },
  });
}

async function listCollectionProgress(userId) {
  return prisma.userPuzzleCollectionProgress.findMany({
    where: { userId },
    orderBy: { lastPlayed: "desc" },
  });
}

async function getSolvedPuzzleIds(userId, category) {
  const items = await prisma.userPuzzleProgress.findMany({
    where: {
      userId,
      completed: true,
      puzzle: category ? { category } : undefined,
    },
    select: { puzzleId: true },
  });
  return items.map((item) => item.puzzleId);
}

async function countSolvedPuzzles(userId, category) {
  return prisma.userPuzzleProgress.count({
    where: {
      userId,
      completed: true,
      puzzle: category ? { category } : undefined,
    },
  });
}

async function getSolvedCountsByCategory(userId) {
  const results = await prisma.userPuzzleProgress.findMany({
    where: { userId, completed: true },
    include: { puzzle: { select: { category: true } } },
  });
  
  const categoryCounts = {};
  for (const r of results) {
    if (r.puzzle?.category) {
      categoryCounts[r.puzzle.category] = (categoryCounts[r.puzzle.category] || 0) + 1;
    }
  }
  return categoryCounts;
}

async function updatePuzzleRating(puzzleId, data) {
  return prisma.puzzle.update({
    where: { id: puzzleId },
    data: {
      solveCount: data.solveCount,
      successRate: data.successRate,
      rating: data.rating,
    },
  });
}

async function updateUserPuzzleRating(userId, rating, change, reason, puzzleId) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { puzzleHighestRating: true } });
  const highestRating = Math.max(rating, existingUser?.puzzleHighestRating || 1000);
  const history = prisma.userPuzzleRatingHistory.create({
    data: { userId, rating, change, reason, puzzleId },
  });
  const updateUser = prisma.user.update({
    where: { id: userId },
    data: {
      puzzleRating: rating,
      puzzleHighestRating: highestRating,
    },
  });
  await Promise.all([history, updateUser]);
}

async function getUserPuzzleRating(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { puzzleRating: true, puzzleHighestRating: true } });
  return { rating: user?.puzzleRating || 1000, highestRating: user?.puzzleHighestRating || 1000 };
}

async function getUserPuzzleRatingHistory(userId, options = {}) {
  const { skip = 0, take = 50 } = options;
  return prisma.userPuzzleRatingHistory.findMany({
    where: { userId },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
}

async function upsertUserPuzzleThemeStats(userId, theme, data) {
  const existing = await prisma.userPuzzleThemeStats.findUnique({
    where: { userId_theme: { userId, theme } },
  });
  if (existing) {
    return prisma.userPuzzleThemeStats.update({
      where: { userId_theme: { userId, theme } },
      data: {
        attempts: (existing.attempts || 0) + (data.attempts || 0),
        solved: (existing.solved || 0) + (data.solved || 0),
        accuracy: data.accuracy || existing.accuracy,
        avgTime: data.avgTime || existing.avgTime,
        mastery: data.mastery ?? existing.mastery,
        lastPlayed: data.lastPlayed || new Date(),
      },
    });
  }
  return prisma.userPuzzleThemeStats.create({
    data: {
      userId,
      theme,
      attempts: data.attempts || 1,
      solved: data.solved || 0,
      accuracy: data.accuracy || 0,
      avgTime: data.avgTime || 0,
      mastery: data.mastery || 0,
      lastPlayed: data.lastPlayed || new Date(),
    },
  });
}

async function getUserPuzzleThemeStats(userId) {
  return prisma.userPuzzleThemeStats.findMany({ where: { userId } });
}

async function getOrCreateDailyChallenge(date) {
  const existing = await prisma.dailyChallenge.findUnique({ where: { date: new Date(date) } });
  if (existing) return existing;
  return null;
}

async function getOrCreateWeeklyChallenge(weekStart) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const existing = await prisma.weeklyChallenge.findFirst({ where: { weekStart: start } });
  if (existing) return existing;
  return null;
}

async function createDailyChallenge(date, puzzleId, theme, difficulty) {
  return prisma.dailyChallenge.create({ data: { puzzleId, date: new Date(date), theme, difficulty } });
}

async function createWeeklyChallenge(weekStart, puzzleId, theme, difficulty, description) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  return prisma.weeklyChallenge.create({ data: { puzzleId, weekStart: start, theme, difficulty, description: description || "Weekly Challenge" } });
}

async function getUserChallengeCompletion(userId, challengeType, challengeId) {
  return prisma.userChallengeCompletion.findUnique({
    where: { userId_challengeType_challengeId: { userId, challengeType, challengeId } },
  });
}

async function upsertUserChallengeCompletion(userId, challengeType, challengeId, data) {
  const existing = await prisma.userChallengeCompletion.findUnique({
    where: { userId_challengeType_challengeId: { userId, challengeType, challengeId } },
  });
  if (existing) {
    return prisma.userChallengeCompletion.update({
      where: { userId_challengeType_challengeId: { userId, challengeType, challengeId } },
      data: {
        completed: data.completed ?? existing.completed,
        attempts: data.attempts ?? existing.attempts,
        solveTime: data.solveTime ?? existing.solveTime,
        completedAt: data.completedAt || existing.completedAt,
      },
    });
  }
  return prisma.userChallengeCompletion.create({
    data: { userId, challengeType, challengeId, ...data },
  });
}

async function getUserSurvivalRecord(userId, category = "survival-mode") {
  return prisma.userSurvivalRecord.findUnique({
    where: { userId_category: { userId, category } },
  });
}

async function getOrCreateSurvivalRecord(userId, category = "survival-mode") {
  const existing = await prisma.userSurvivalRecord.findUnique({
    where: { userId_category: { userId, category } },
  });
  if (existing) return existing;
  return prisma.userSurvivalRecord.create({
    data: { userId, category, streak: 0, bestStreak: 0, totalPuzzles: 0, totalCorrect: 0 },
  });
}

async function upsertUserSurvivalRecord(userId, category, data) {
  const existing = await prisma.userSurvivalRecord.findUnique({
    where: { userId_category: { userId, category } },
  });
  if (existing) {
    return prisma.userSurvivalRecord.update({
      where: { userId_category: { userId, category } },
      data: {
        streak: data.streak ?? existing.streak,
        bestStreak: Math.max(existing.bestStreak, data.streak || existing.streak),
        totalPuzzles: (existing.totalPuzzles || 0) + (data.totalPuzzlesIncrement || 0),
        totalCorrect: (existing.totalCorrect || 0) + (data.totalCorrectIncrement || 0),
        lastPlayed: data.lastPlayed || new Date(),
      },
    });
  }
  return prisma.userSurvivalRecord.create({
    data: {
      userId,
      category,
      streak: data.streak || 0,
      bestStreak: data.bestStreak || data.streak || 0,
      totalPuzzles: data.totalPuzzles || 0,
      totalCorrect: data.totalCorrect || 0,
      lastPlayed: data.lastPlayed || new Date(),
    },
  });
}

async function getPuzzleAnalytics(userId) {
  const progressItems = await prisma.userPuzzleProgress.findMany({
    where: { userId, completed: true },
    include: { puzzle: true },
  });
  const themeStats = await prisma.userPuzzleThemeStats.findMany({ where: { userId } });
  const ratingHistory = await prisma.userPuzzleRatingHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  const totalSolved = progressItems.length;
  const totalAttempts = progressItems.reduce((sum, p) => sum + p.attempts, 0);
  const accuracy = totalSolved > 0 ? Math.round((totalSolved / Math.max(totalAttempts, totalSolved)) * 100) : 0;
  const themeStatsMap = {};
  for (const t of themeStats) {
    themeStatsMap[t.theme] = { attempts: t.attempts, solved: t.solved, accuracy: t.accuracy, mastery: t.mastery };
  }
  const sortedThemes = Object.entries(themeStatsMap)
    .map(([theme, stats]) => ({ theme, ...stats }))
    .sort((a, b) => (b.mastery || 0) - (a.mastery || 0));
  return {
    totalSolved,
    totalAttempts,
    accuracy,
    ratingProgression: ratingHistory.map((r) => ({ rating: r.rating, change: r.change, date: r.createdAt })),
    strongestThemes: sortedThemes.slice(0, 5),
    weakestThemes: [...sortedThemes].reverse().slice(0, 5),
    themeStats: themeStatsMap,
  };
}

module.exports = {
  createPuzzle,
  getPuzzleById,
  getPuzzleByFen,
  getPuzzleByFenSolutionTheme,
  getPuzzlesByCategory,
  countPuzzlesByCategory,
  getCategoryTotalCounts,
  getSolvedCountsByCategory,
  getPuzzlesByCategoryWithProgress,
  getRandomPuzzle,
  getNextUnsolvedPuzzle,
  getUserPuzzleProgress,
  upsertUserPuzzleProgress,
  listUserPuzzleProgress,
  getOrCreateCollectionProgress,
  updateCollectionProgress,
  updateCollectionProgressDirect,
  listCollectionProgress,
  getSolvedPuzzleIds,
  countSolvedPuzzles,
  createPuzzleExplanationCache,
  getPuzzleExplanationCache,
  getUserPuzzleProfileStats,
  checkAndUnlockAchievements,
  updateUserPuzzleStreak,
  updatePuzzleRating,
  updateUserPuzzleRating,
  getUserPuzzleRating,
  getUserPuzzleRatingHistory,
  upsertUserPuzzleThemeStats,
  getUserPuzzleThemeStats,
  getOrCreateDailyChallenge,
  createDailyChallenge,
  getOrCreateWeeklyChallenge,
  createWeeklyChallenge,
  getUserChallengeCompletion,
  upsertUserChallengeCompletion,
  getUserSurvivalRecord,
  getOrCreateSurvivalRecord,
  upsertUserSurvivalRecord,
  getPuzzleAnalytics,
};
