const { Chess } = require("chess.js");
const puzzleRepository = require("../repositories/puzzleRepository");
const userRepository = require("../repositories/userRepository");
const { generateTacticsExplanation } = require("../ai/aiExplanationService");
const { generateAIPuzzle: generateWithStockfish, ensureCategoryHasPuzzles } = require("./stockfishPuzzleGenerator");
const prisma = require("../config/prisma");

const generationLocks = new Map();

async function triggerBackgroundGeneration(category) {
  const count = await puzzleRepository.countPuzzlesByCategory(category);
  if (count < 20) {
    ensureCategoryHasPuzzles(category, 40).catch(() => {});
  }
}

function classifyDifficulty(rating) {
  if (rating < 800) return "Beginner";
  if (rating < 1200) return "Intermediate";
  if (rating < 1600) return "Advanced";
  return "Expert";
}

function calculatePuzzleAccuracy(attempts, solved) {
  if (solved === true && attempts > 0) {
    return Math.max(0, Math.round((1 / attempts) * 100));
  }
  return 0;
}

function calculateNewRating(currentRating, solved, attempts, puzzleRating) {
  const kFactor = 32;
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - currentRating) / 400));
  const actual = solved ? 1 : 0;
  const score = actual;
  const change = Math.round(kFactor * (score - expected));
  return Math.max(100, currentRating + change);
}

function calculateThemeMastery(accuracy, avgTime) {
  if (accuracy >= 90 && avgTime <= 5000) return 100;
  if (accuracy >= 75 && avgTime <= 10000) return 75;
  if (accuracy >= 60 && avgTime <= 15000) return 50;
  if (accuracy >= 40) return 25;
  return 0;
}

async function createPuzzle(data) {
  return puzzleRepository.createPuzzle(data);
}

async function getPuzzleById(id) {
  return puzzleRepository.getPuzzleById(id);
}

async function getCollectionPuzzles(category, userId, options) {
  options = options || {};
  const { difficulty, count = 20 } = options;

  const puzzlesWithProgress = await puzzleRepository.getPuzzlesByCategoryWithProgress(userId, category, {
    ...(difficulty ? { difficulty } : {}),
    take: 200,
  });

  const unsolved = puzzlesWithProgress.filter((p) => !p.completed);
  const solved = puzzlesWithProgress.filter((p) => p.completed);

  let result = [];
  if (unsolved.length > 0) {
    const unsolvedBatch = unsolved.slice(0, count);
    result = [...unsolvedBatch];
    const remaining = count - result.length;
    if (remaining > 0) {
      result = result.concat(solved.slice(0, remaining));
    }
  } else if (solved.length > 0) {
    result = solved.slice(0, count);
  }

  const totalInDb = await puzzleRepository.countPuzzlesByCategory(category);

  if (result.length === 0 && totalInDb === 0) {
    if (!generationLocks.has(category)) {
      generationLocks.set(category, Promise.resolve());
    }
    generationLocks.set(category, generationLocks.get(category).then(() =>
      ensureCategoryHasPuzzles(category, 20).catch(() => {})
    ));
  } else if (result.length < count && totalInDb < count) {
    if (!generationLocks.has(category)) {
      generationLocks.set(category, Promise.resolve());
    }
    generationLocks.set(category, generationLocks.get(category).then(() =>
      ensureCategoryHasPuzzles(category, Math.max(count, 40)).catch(() => {})
    ));
  }

  return result.slice(0, count);
}

async function getNextPuzzle(category, userId) {
  const progress = await puzzleRepository.getOrCreateCollectionProgress(userId, category);
  const allCategoryPuzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 1000 });
  const existingFens = allCategoryPuzzles.map((p) => p.fen);

  const nextPuzzle = await puzzleRepository.getNextUnsolvedPuzzle(userId, category);
  if (nextPuzzle) {
    return { puzzle: nextPuzzle, isNew: false, progress };
  }

  const aiPuzzle = await generateAIPuzzle(category, null, existingFens);
  if (aiPuzzle) {
    try {
      triggerBackgroundGeneration(category);
    } catch {
      // ignore
    }
    return { puzzle: aiPuzzle, isNew: true, progress };
  }
  return { puzzle: null, isNew: false, progress };
}

async function submitPuzzleAnswer(userId, puzzleId, userMoveSan, attempts, solveTimeMs) {
  const puzzle = await puzzleRepository.getPuzzleById(puzzleId);
  if (!puzzle) {
    throw { status: 404, message: "Puzzle not found" };
  }

  const category = puzzle.category;

  const [existingProgress, collectionProgress, totalPuzzles] = await Promise.all([
    puzzleRepository.getUserPuzzleProgress(userId, puzzleId),
    puzzleRepository.getOrCreateCollectionProgress(userId, category),
    puzzleRepository.countPuzzlesByCategory(category),
  ]);

  if (existingProgress && existingProgress.completed) {
    const completedPuzzles = await puzzleRepository.countSolvedPuzzles(userId, category);
    return {
      success: true,
      data: {
        correct: true,
        attempts: existingProgress.attempts,
        explanation: null,
        xp: null,
        userRating: null,
        progress: {
          completedPuzzles,
          totalPuzzles,
          accuracy: calculatePuzzleAccuracy(existingProgress.attempts, true),
          streak: collectionProgress.bestStreak,
        },
      },
    };
  }

  const previousAttempts = existingProgress ? existingProgress.attempts : 0;
  const totalAttempts = previousAttempts + (attempts || 1);
  const solution = puzzle.solution.map((s) => s.replace(/[+#]/g, "").trim());
  const cleanMove = userMoveSan.replace(/[+#]/g, "").trim();
  const isCorrect = solution.includes(cleanMove);
  const completed = Boolean(isCorrect);
  const solvedAt = completed ? new Date() : null;

  await puzzleRepository.upsertUserPuzzleProgress(userId, puzzleId, {
    completed,
    attempts: totalAttempts,
    solvedAt,
  });

  const completedPuzzles = await puzzleRepository.countSolvedPuzzles(userId, category);
  const accuracy = calculatePuzzleAccuracy(totalAttempts, completed);
  const newStreak = completed ? (collectionProgress.bestStreak || 0) + 1 : (collectionProgress.bestStreak || 0);
  const xpEarned = completed ? 10 : 0;

  await puzzleRepository.updateCollectionProgressDirect(userId, category, {
    totalPuzzles,
    completedPuzzles,
    currentPuzzleIndex: completed ? (collectionProgress.currentPuzzleIndex || 0) + 1 : (collectionProgress.currentPuzzleIndex || 0),
    accuracy: Math.max(collectionProgress.accuracy || 0, accuracy),
    bestStreak: Math.max(collectionProgress.bestStreak || 0, newStreak),
    xpEarned: (collectionProgress.xpEarned || 0) + xpEarned,
    lastPlayed: new Date(),
  });

  if (completed) {
    triggerBackgroundGeneration(category).catch(() => {});
  }

  const userRatingResult = await updateUserPuzzleRatingAfterSolve(userId, puzzle, completed, totalAttempts, solveTimeMs);

  let explanation = null;
  if (completed) {
    (async () => {
      try {
        const cached = await puzzleRepository.getPuzzleExplanationCache(puzzleId);
        if (cached) {
          return;
        }
        const result = await generateTacticsExplanation({
          fen: puzzle.fen,
          solution: puzzle.solution,
          themes: [puzzle.theme],
          rating: puzzle.rating,
          goal: puzzle.goal,
        });
        if (result) {
          await puzzleRepository.createPuzzleExplanationCache(puzzleId, result);
        }
      } catch {
        // ignore background explanation errors
      }
    })();
  }

  let xpResult = null;
  if (completed) {
    try {
      const user = await userRepository.getUserById(userId, { includePassword: true });
      const currentXp = user.xp || 0;
      const level = user.level || 1;
      const xpForNextLevel = level * 100;
      let newXp = currentXp + xpEarned;
      let newLevel = level;
      if (newXp >= xpForNextLevel) {
        newXp -= xpForNextLevel;
        newLevel += 1;
      }
      const achievements = [...(user.achievements || [])];
      if (completedPuzzles >= 10 && !achievements.includes("Puzzle Novice")) {
        achievements.push("Puzzle Novice");
      }
      if (completedPuzzles >= 50 && !achievements.includes("Tactical Master")) {
        achievements.push("Tactical Master");
      }
      if (newStreak >= 5 && !achievements.includes("On Fire")) {
        achievements.push("On Fire");
      }
      const updated = await userRepository.updateUser(userId, {
        xp: newXp,
        level: newLevel,
        achievements,
      });
      xpResult = {
        xpEarned,
        newXp,
        newLevel,
        xpForNextLevel: newLevel * 100,
        newAchievements: achievements.filter((a) => !(user.achievements || []).includes(a)),
      };
    } catch {
      xpResult = null;
    }
  }
  return {
    success: true,
    data: {
      correct: completed,
      attempts: totalAttempts,
      explanation,
      xp: xpResult,
      userRating: userRatingResult,
      progress: {
        completedPuzzles,
        totalPuzzles,
        accuracy,
        streak: newStreak,
      },
    },
  };
}

async function updateUserPuzzleRatingAfterSolve(userId, puzzle, solved, attempts, solveTimeMs) {
  const [currentRatingData, totalCorrect, existingThemeStats] = await Promise.all([
    puzzleRepository.getUserPuzzleRating(userId),
    prisma.userPuzzleProgress.count({ where: { puzzleId: puzzle.id, completed: true } }),
    prisma.userPuzzleThemeStats.findUnique({
      where: { userId_theme: { userId, theme: puzzle.theme || "tactics" } },
    }),
  ]);

  const currentRating = currentRatingData.rating;
  const newRating = calculateNewRating(currentRating, solved, attempts, puzzle.rating);
  const change = newRating - currentRating;

  await puzzleRepository.updateUserPuzzleRating(userId, newRating, change, solved ? "correct_solve" : "incorrect_solve", puzzle.id);

  const newSolveCount = (puzzle.solveCount || 0) + 1;
  const successRate = newSolveCount > 0 ? Math.round((totalCorrect / newSolveCount) * 100) / 100 : 0;
  const newPuzzleRating = Math.round(1000 + (successRate * 1000));

  await puzzleRepository.updatePuzzleRating(puzzle.id, {
    solveCount: newSolveCount,
    successRate,
    rating: Math.max(400, Math.min(2000, newPuzzleRating)),
  });

  const theme = puzzle.theme || "tactics";
  const currentThemeAccuracy = existingThemeStats?.accuracy || 0;
  const currentThemeSolved = existingThemeStats?.solved || 0;
  const currentThemeAttempts = existingThemeStats?.attempts || 0;
  const newThemeSolved = currentThemeSolved + (solved ? 1 : 0);
  const newThemeAttempts = currentThemeAttempts + 1;
  const newThemeAccuracy = newThemeAttempts > 0 ? Math.round((newThemeSolved / newThemeAttempts) * 100) : 0;
  const avgTime = existingThemeStats?.avgTime || 0;
  const newAvgTime = avgTime > 0 ? Math.round((avgTime + (solveTimeMs || 0)) / 2) : (solveTimeMs || 0);
  const mastery = calculateThemeMastery(newThemeAccuracy, newAvgTime);

  await puzzleRepository.upsertUserPuzzleThemeStats(userId, theme, {
    solved: newThemeSolved,
    attempts: newThemeAttempts,
    accuracy: newThemeAccuracy,
    avgTime: newAvgTime,
    mastery,
    lastPlayed: new Date(),
  });

  return { rating: newRating, change, highestRating: currentRatingData.highestRating };
}

async function getUserCollectionProgress(userId, category) {
  const collection = await puzzleRepository.getOrCreateCollectionProgress(userId, category);
  const totalPuzzles = await puzzleRepository.countPuzzlesByCategory(category);
  const completedPuzzles = await puzzleRepository.countSolvedPuzzles(userId, category);
  return {
    totalPuzzles: Math.max(collection.totalPuzzles, totalPuzzles),
    completedPuzzles,
    currentPuzzleIndex: collection.currentPuzzleIndex,
    accuracy: collection.accuracy,
    bestStreak: collection.bestStreak,
    xpEarned: collection.xpEarned,
    lastPlayed: collection.lastPlayed,
    completionPct: totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0,
  };
}

async function listUserCollections(userId) {
  const categories = [
    "daily-challenge",
    "openings",
    "middlegame",
    "endgames",
    "tactics",
    "best-move",
    "defensive-move",
    "mate-in-1",
    "mate-in-2",
    "mate-in-3",
    "master-games",
    "survival-mode",
    "ai-challenge",
    "weekly-challenge",
  ];

  const [collectionProgressRecords, totalCounts] = await Promise.all([
    puzzleRepository.listCollectionProgress(userId),
    puzzleRepository.getCategoryTotalCounts(),
  ]);

  const progressMap = new Map(collectionProgressRecords.map((p) => [p.category, p]));
  const totalMap = new Map(totalCounts.map((c) => [c.category, Number(c._count?.category || 0)]));

  const categorySolvedCounts = await puzzleRepository.getSolvedCountsByCategory(userId);

  return categories.map((category) => {
    const progress = progressMap.get(category);
    const totalPuzzles = totalMap.get(category) || 0;
    const completedPuzzles = categorySolvedCounts[category] || 0;
    const completionPct = totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0;

    return {
      category,
      totalPuzzles,
      completedPuzzles,
      completionPct,
      accuracy: progress ? progress.accuracy : 0,
      bestStreak: progress ? progress.bestStreak : 0,
      xpEarned: progress ? progress.xpEarned : 0,
      lastPlayed: progress ? progress.lastPlayed : null,
      currentPuzzleIndex: progress ? progress.currentPuzzleIndex : 0,
    };
  });
}

async function resetCategoryProgress(userId, category) {
  const puzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 1000 });
  const puzzleIds = puzzles.map((p) => p.id);
  await prisma.userPuzzleProgress.deleteMany({
    where: {
      userId,
      puzzleId: { in: puzzleIds },
    },
  });
  await puzzleRepository.updateCollectionProgress(userId, category, {
    completedPuzzles: 0,
    currentPuzzleIndex: 0,
    accuracy: 0,
    bestStreak: 0,
    xpEarned: 0,
    completionPct: 0,
  });
  return { success: true };
}

async function generateAIPuzzle(category, difficulty, excludeIds) {
  const puzzle = await generateWithStockfish(category, difficulty, excludeIds);
  return puzzle;
}

function validateMove(fen, moveSan) {
  try {
    const chess = new Chess(fen);
    const move = chess.move(moveSan);
    if (!move) return { valid: false, error: "Illegal move" };
    return { valid: true, move, newFen: chess.fen() };
  } catch {
    return { valid: false, error: "Invalid move notation" };
  }
}

async function getPuzzleHint(puzzleId) {
  const puzzle = await puzzleRepository.getPuzzleById(puzzleId);
  if (!puzzle) return null;
  return {
    hint: puzzle.hint || "Look for forcing moves: checks, captures, and threats.",
    solution: puzzle.solution,
  };
}

async function getDailyChallenge(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let challenge = await puzzleRepository.getOrCreateDailyChallenge(today);
  if (!challenge) {
    const theme = "tactics";
    const difficulty = "intermediate";
    const category = "daily-challenge";
    let puzzle = await puzzleRepository.getRandomPuzzle(category, { difficulty });
    if (!puzzle) {
      puzzle = await generateAIPuzzle(category, difficulty, []);
      if (!puzzle) {
        return { success: false, message: "No daily challenge available" };
      }
    }
    challenge = await puzzleRepository.createDailyChallenge(today, puzzle.id, theme, difficulty);
  }
  const puzzle = await puzzleRepository.getPuzzleById(challenge.puzzleId);
  if (!puzzle) {
    return { success: false, message: "Challenge puzzle not found" };
  }
  const completion = await puzzleRepository.getUserChallengeCompletion(userId, "daily", challenge.id);
  return {
    success: true,
    data: {
      id: challenge.id,
      puzzle,
      theme: challenge.theme,
      difficulty: challenge.difficulty,
      bonusXP: challenge.bonusXP,
      completed: completion?.completed || false,
      attempts: completion?.attempts || 0,
      date: challenge.date,
    },
  };
}

async function getWeeklyChallenge(userId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  let challenge = await puzzleRepository.getOrCreateWeeklyChallenge(weekStart);
  if (!challenge) {
    const theme = "tactics";
    const difficulty = "advanced";
    const category = "weekly-challenge";
    let puzzle = await puzzleRepository.getRandomPuzzle(category, { difficulty });
    if (!puzzle) {
      puzzle = await generateAIPuzzle(category, difficulty, []);
      if (!puzzle) {
        return { success: false, message: "No weekly challenge available" };
      }
    }
    challenge = await puzzleRepository.createWeeklyChallenge(weekStart, puzzle.id, theme, difficulty, "Weekly Challenge");
  }
  const puzzle = await puzzleRepository.getPuzzleById(challenge.puzzleId);
  if (!puzzle) {
    return { success: false, message: "Challenge puzzle not found" };
  }
  const completion = await puzzleRepository.getUserChallengeCompletion(userId, "weekly", challenge.id);
  return {
    success: true,
    data: {
      id: challenge.id,
      puzzle,
      theme: challenge.theme,
      difficulty: challenge.difficulty,
      bonusXP: challenge.bonusXP,
      description: challenge.description,
      completed: completion?.completed || false,
      attempts: completion?.attempts || 0,
      weekStart: challenge.weekStart,
    },
  };
}

async function submitChallengeAnswer(userId, challengeType, challengeId, move, attempts, solveTimeMs) {
  const challenge = challengeType === "daily"
    ? await prisma.dailyChallenge.findUnique({ where: { id: challengeId } })
    : await prisma.weeklyChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) {
    throw { status: 404, message: "Challenge not found" };
  }
  const puzzle = await puzzleRepository.getPuzzleById(challenge.puzzleId);
  if (!puzzle) {
    throw { status: 404, message: "Challenge puzzle not found" };
  }
  const solution = puzzle.solution.map((s) => s.replace(/[+#]/g, "").trim());
  const cleanMove = move.replace(/[+#]/g, "").trim();
  const isCorrect = solution.includes(cleanMove);
  const completion = await puzzleRepository.upsertUserChallengeCompletion(userId, challengeType, challengeId, {
    completed: isCorrect,
    attempts: attempts || 1,
    solveTime: solveTimeMs || 0,
    completedAt: isCorrect ? new Date() : null,
  });
  let ratingChange = 0;
  if (isCorrect) {
    const currentRatingData = await puzzleRepository.getUserPuzzleRating(userId);
    const newRating = calculateNewRating(currentRatingData.rating, true, 1, puzzle.rating);
    ratingChange = newRating - currentRatingData.rating;
    await puzzleRepository.updateUserPuzzleRating(userId, newRating, ratingChange, "challenge_complete", puzzle.id);
  }
  return {
    success: true,
    data: {
      correct: isCorrect,
      attempts: completion.attempts,
      completed: completion.completed,
      bonusXP: isCorrect ? challenge.bonusXP : 0,
      ratingChange,
      puzzle: { id: puzzle.id, fen: puzzle.fen, solution: puzzle.solution, theme: puzzle.theme, goal: puzzle.goal },
    },
  };
}

async function startSurvivalMode(userId, category = "survival-mode") {
  const record = await puzzleRepository.getOrCreateSurvivalRecord(userId, category);
  let puzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 50 });
  if (puzzles.length === 0) {
    const aiPuzzle = await generateAIPuzzle(category, null, []);
    if (aiPuzzle) {
      puzzles = [aiPuzzle];
    } else {
      await ensureCategoryHasPuzzles(category, 20);
      return { success: false, message: "Not enough puzzles for survival mode. Try again later." };
    }
  }
  const firstPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  return {
    success: true,
    data: {
      streak: record.streak || 0,
      bestStreak: record.bestStreak || 0,
      totalPuzzles: record.totalPuzzles || 0,
      totalCorrect: record.totalCorrect || 0,
      puzzle: {
        id: firstPuzzle.id,
        fen: firstPuzzle.fen,
        solution: firstPuzzle.solution,
        theme: firstPuzzle.theme,
        goal: firstPuzzle.goal,
        rating: firstPuzzle.rating,
      },
    },
  };
}

async function submitSurvivalAnswer(userId, puzzleId, move, solveTimeMs, category = "survival-mode") {
  const puzzle = await puzzleRepository.getPuzzleById(puzzleId);
  if (!puzzle) {
    throw { status: 404, message: "Puzzle not found" };
  }
  const solution = puzzle.solution.map((s) => s.replace(/[+#]/g, "").trim());
  const cleanMove = move.replace(/[+#]/g, "").trim();
  const isCorrect = solution.includes(cleanMove);
  if (!isCorrect) {
    const record = await puzzleRepository.upsertUserSurvivalRecord(userId, category, {
      streak: 0,
      lastPlayed: new Date(),
    });
    return {
      success: true,
      data: {
        correct: false,
        gameOver: true,
        streak: 0,
        bestStreak: record.bestStreak,
        totalPuzzles: record.totalPuzzles,
        totalCorrect: record.totalCorrect,
        message: "Game Over! You made a mistake.",
      },
    };
  }
  const currentRecord = await puzzleRepository.getUserSurvivalRecord(userId, category);
  const currentStreak = currentRecord?.streak || 0;
  const newStreak = currentStreak + 1;
  const record = await puzzleRepository.upsertUserSurvivalRecord(userId, category, {
    streak: newStreak,
    totalPuzzlesIncrement: 1,
    totalCorrectIncrement: 1,
    lastPlayed: new Date(),
  });
  const remainingPuzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 1000 });
  const solvedIds = await puzzleRepository.getSolvedPuzzleIds(userId, category);
  const unsolved = remainingPuzzles.filter((p) => !solvedIds.includes(p.id));
  const nextPuzzle = unsolved.length > 0 ? unsolved[Math.floor(Math.random() * unsolved.length)] : null;
  if (!nextPuzzle) {
    const aiPuzzle = await generateAIPuzzle(category, null, []);
    if (aiPuzzle) {
      return {
        success: true,
        data: {
          correct: true,
          gameOver: false,
          streak: record.streak || 0,
          bestStreak: record.bestStreak,
          totalPuzzles: record.totalPuzzles,
          totalCorrect: record.totalCorrect,
          puzzle: { id: aiPuzzle.id, fen: aiPuzzle.fen, solution: aiPuzzle.solution, theme: aiPuzzle.theme, goal: aiPuzzle.goal, rating: aiPuzzle.rating },
          message: "New puzzle generated!",
        },
      };
    }
    return {
      success: true,
      data: {
        correct: true,
        gameOver: true,
        won: true,
        streak: record.streak || 0,
        bestStreak: record.bestStreak,
        totalPuzzles: record.totalPuzzles,
        totalCorrect: record.totalCorrect,
        message: "You completed all available puzzles!",
      },
    };
  }
  return {
    success: true,
    data: {
      correct: true,
      gameOver: false,
      streak: record.streak || 0,
      bestStreak: record.bestStreak,
      totalPuzzles: record.totalPuzzles,
      totalCorrect: record.totalCorrect,
      puzzle: { id: nextPuzzle.id, fen: nextPuzzle.fen, solution: nextPuzzle.solution, theme: nextPuzzle.theme, goal: nextPuzzle.goal, rating: nextPuzzle.rating },
    },
  };
}

async function getWeakThemes(userId) {
  const themeStats = await puzzleRepository.getUserPuzzleThemeStats(userId);
  return themeStats
    .filter((t) => t.attempts > 0)
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
    .slice(0, 5)
    .map((t) => ({ theme: t.theme, mastery: t.mastery, accuracy: t.accuracy, attempts: t.attempts }));
}

async function getRecommendedThemes(userId) {
  const weakThemes = await getWeakThemes(userId);
  if (weakThemes.length > 0) {
    return weakThemes.map((t) => t.theme);
  }
  const categories = ["tactics", "middlegame", "endgames", "openings"];
  return [categories[Math.floor(Math.random() * categories.length)]];
}

async function getAdaptivePuzzles(userId, count = 10) {
  const recommendedThemes = await getRecommendedThemes(userId);
  const userRatingData = await puzzleRepository.getUserPuzzleRating(userId);
  const userRating = userRatingData.rating;
  const puzzles = [];
  for (const theme of recommendedThemes) {
    const categoryMap = {
      "mate-in-1": "mate-in-1",
      "mate-in-2": "mate-in-2",
      "mate-in-3": "mate-in-3",
      "tactics": "tactics",
      "endgame": "endgames",
      "opening": "openings",
      "middlegame": "middlegame",
      "best-move": "best-move",
      "defensive": "defensive-move",
      "master-games": "master-games",
      "fork": "tactics",
      "pin": "tactics",
      "skewer": "tactics",
      "double-attack": "tactics",
      "deflection": "tactics",
      "removing-the-defender": "tactics",
      "discovered-attack": "tactics",
      "back-rank-mate": "tactics",
      "decoy": "tactics",
      "attraction": "tactics",
    };
    const category = categoryMap[theme] || "tactics";
    const categoryPuzzles = await puzzleRepository.getPuzzlesByCategoryWithProgress(userId, category, { take: 50 });
    const filtered = categoryPuzzles.filter((p) => Math.abs(p.rating - userRating) <= 300);
    puzzles.push(...filtered.slice(0, Math.ceil(count / recommendedThemes.length)));
  }
  return puzzles.slice(0, count);
}

async function getPuzzleAnalytics(userId) {
  return puzzleRepository.getPuzzleAnalytics(userId);
}

async function getUserPuzzleRating(userId) {
  return puzzleRepository.getUserPuzzleRating(userId);
}

async function getUserPuzzleRatingHistory(userId) {
  return puzzleRepository.getUserPuzzleRatingHistory(userId);
}

async function getUserThemeStats(userId) {
  return puzzleRepository.getUserPuzzleThemeStats(userId);
}

module.exports = {
  createPuzzle,
  getPuzzleById,
  getCollectionPuzzles,
  getNextPuzzle,
  submitPuzzleAnswer,
  getUserCollectionProgress,
  listUserCollections,
  validateMove,
  getPuzzleHint,
  generateAIPuzzle,
  resetCategoryProgress,
  triggerBackgroundGeneration,
  classifyDifficulty,
  getDailyChallenge,
  getWeeklyChallenge,
  submitChallengeAnswer,
  startSurvivalMode,
  submitSurvivalAnswer,
  getWeakThemes,
  getRecommendedThemes,
  getAdaptivePuzzles,
  getPuzzleAnalytics,
  getUserPuzzleRating,
  getUserPuzzleRatingHistory,
  getUserThemeStats,
};
