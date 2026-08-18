const puzzleRepository = require("../repositories/puzzleRepository");
const { generateOpeningExplanation } = require("../ai/aiExplanationService");
const { generateEndgameExplanation } = require("../ai/aiExplanationService");

async function getPuzzleRecommendations(options) {
  const { userId, themes = [], rating, category, count = 5, difficulty, excludeSolved = true } = options;

  const where = {};
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;

  let puzzles = await puzzleRepository.getPuzzlesByCategory(category || "tactics", { take: 200 });

  let numericRating = rating;
  if (typeof rating === 'string') {
    const trimmed = rating.trim();
    if (trimmed.endsWith('+')) {
      numericRating = Number(trimmed.slice(0, -1));
    } else if (trimmed.includes('-')) {
      const [low, high] = trimmed.split('-').map(Number);
      numericRating = Math.round((low + high) / 2);
    } else {
      numericRating = Number(trimmed);
    }
  }

  const effectiveRating = numericRating || (userId ? (await puzzleRepository.getUserPuzzleRating(userId)).rating : 1000);

  if (effectiveRating) {
    const min = Math.max(0, effectiveRating - 200);
    const max = effectiveRating + 200;
    puzzles = puzzles.filter((p) => p.rating >= min && p.rating <= max);
  }

  if (themes.length > 0) {
    puzzles = puzzles.filter((p) => themes.some((t) => (p.theme || "").toLowerCase().includes(t.toLowerCase())));
  }

  if (excludeSolved && userId) {
    const solvedIds = await puzzleRepository.getSolvedPuzzleIds(userId, category);
    puzzles = puzzles.filter((p) => !solvedIds.includes(p.id));
  }

  const selected = puzzles.slice(0, count);

  return {
    puzzles: selected.map((p) => ({
      id: p.id,
      fen: p.fen,
      solution: p.solution,
      goal: p.goal,
      rating: p.rating,
      theme: p.theme,
      category: p.category,
      difficulty: p.difficulty,
    })),
    themes: themes.length > 0 ? themes : ["tactics"],
    ratingRange: numericRating ? { min: numericRating - 200, max: numericRating + 200 } : { min: 800, max: 1500 },
    count: selected.length,
    difficulty: difficulty || "intermediate",
    instruction: selected.length > 0 ? "Solve these puzzles to improve your tactical vision." : "No puzzles available for these filters. Try broadening your search.",
  };
}

async function getOpeningRecommendations(profile) {
  const openings = [
    { name: "Italian Game", eco: "C50", category: "Open Game", difficulty: "Beginner", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
    { name: "Ruy Lopez", eco: "C60", category: "Open Game", difficulty: "Intermediate", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
    { name: "Sicilian Defense", eco: "B20", category: "Semi-Open Game", difficulty: "Advanced", moves: ["e4", "c5"] },
    { name: "Queen's Gambit", eco: "D06", category: "Closed Game", difficulty: "Intermediate", moves: ["d4", "d5", "c4"] },
    { name: "Caro-Kann Defense", eco: "B10", category: "Semi-Open Game", difficulty: "Intermediate", moves: ["e4", "c6"] },
  ];

  const rating = profile?.rating || 1200;
  const filtered = openings.filter((o) => {
    if (o.difficulty === "Beginner") return rating <= 1400;
    if (o.difficulty === "Intermediate") return rating >= 800 && rating <= 1800;
    return rating >= 1200;
  });

  const recommended = filtered.slice(0, 3).map((o) => o.name);

  try {
    const explanation = await generateOpeningExplanation({
      name: recommended[0] || "Italian Game",
      eco: filtered[0]?.eco || "C50",
      category: filtered[0]?.category || "Open Game",
      difficulty: filtered[0]?.difficulty || "Beginner",
      moves: filtered[0]?.moves || ["e4", "e5", "Nf3", "Nc6", "Bc4"],
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
      evalBefore: { score: 20 },
      evalAfter: { score: 25 },
      metadata: { games: 1000, averageRating: 1600 },
    });
    return {
      recommended,
      difficulty: filtered[0]?.difficulty || "intermediate",
      explanation: explanation.explanation || "Study the recommended openings for your rating level.",
      strategicConcepts: explanation.strategicConcepts || [],
      commonMistakes: explanation.commonMistakes || [],
      trainingRecommendations: explanation.trainingRecommendations || [],
    };
  } catch {
    return {
      recommended,
      difficulty: filtered[0]?.difficulty || "intermediate",
      instruction: "Study the recommended openings for your rating level.",
    };
  }
}

async function getEndgameRecommendations(profile) {
  const themes = ["king-and-pawn", "rook-endgame", "opposition"];
  const studyOrder = ["king-and-pawn", "rook-endgame", "opposition"];

  try {
    const explanation = await generateEndgameExplanation({
      name: "King and Pawn vs King",
      difficulty: profile?.difficulty || "intermediate",
      themes,
      solution: ["Kd3"],
      fen: "8/8/8/3k4/8/2K5/4P3/8 w - - 0 1",
      evalBefore: { score: 30 },
      evalAfter: { score: 80 },
    });
    return {
      themes,
      difficulty: profile?.difficulty || "intermediate",
      studyOrder,
      explanation: explanation.explanation || "Practice basic endgame technique.",
      keyIdeas: explanation.keyIdeas || [],
      commonMistakes: explanation.commonMistakes || [],
      practiceInstruction: "Practice basic endgame technique.",
    };
  } catch {
    return {
      themes,
      difficulty: profile?.difficulty || "intermediate",
      studyOrder,
      practiceInstruction: "Practice basic endgame technique.",
    };
  }
}

async function getAdaptiveRecommendations(userId, profile) {
  const weakThemes = await getWeakThemes(userId);
  const preferredThemes = weakThemes.length > 0 ? weakThemes.map((t) => t.theme) : ["tactics"];
  const userRating = profile?.puzzleRating || profile?.rating || 1000;
  const puzzles = await getPuzzleRecommendations({
    userId,
    themes: preferredThemes,
    rating: userRating,
    category: "tactics",
    count: 10,
    excludeSolved: false,
  });
  const themeStats = await puzzleRepository.getUserPuzzleThemeStats(userId);
  const strongThemes = themeStats
    .filter((t) => (t.mastery || 0) >= 75)
    .map((t) => t.theme);
  const reducedPuzzles = puzzles.puzzles.filter((p) => !strongThemes.includes(p.theme));
  return {
    puzzles: reducedPuzzles.slice(0, 10),
    weakThemes: weakThemes.slice(0, 5),
    strongThemes: strongThemes.slice(0, 5),
    focusThemes: preferredThemes,
    instruction: "Focus on these themes to improve your tactical vision.",
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

async function getDailyTraining(profile) {
  const userId = profile?.userId;
  const puzzleRecs = userId ? await getAdaptiveRecommendations(userId, profile) : await getPuzzleRecommendations({ count: 3, rating: profile?.rating || 1200 });
  const openingRecs = await getOpeningRecommendations(profile);

  return {
    date: new Date().toISOString().split("T")[0],
    focus: "tactics",
    components: [
      { type: "puzzle", count: puzzleRecs.puzzles?.length || 3, puzzles: puzzleRecs.puzzles || puzzleRecs.puzzles },
      { type: "opening", name: openingRecs.recommended?.[0] || "Italian Game", difficulty: openingRecs.difficulty },
    ],
    instruction: puzzleRecs.instruction || "Solve these puzzles to improve your tactical vision.",
  };
}

module.exports = {
  getPuzzleRecommendations,
  getOpeningRecommendations,
  getEndgameRecommendations,
  getDailyTraining,
  getAdaptiveRecommendations,
  getWeakThemes,
};
