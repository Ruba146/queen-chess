const puzzleRepository = require("../repositories/puzzleRepository");
const { generateTacticsExplanation } = require("../ai/aiExplanationService");

async function generateQuizSession(options) {
  const { category = "mixed", count = 10, userId = null } = options;
  const safeCount = Math.min(count, 20);

  const categoryMap = {
    "mixed": ["tactics", "middlegame", "endgames"],
    "tactics": ["tactics"],
    "middlegame": ["middlegame"],
    "endgames": ["endgames"],
    "openings": ["openings"],
    "mate-in-1": ["mate-in-1"],
    "mate-in-2": ["mate-in-2"],
    "mate-in-3": ["mate-in-3"],
    "best-move": ["best-move"],
    "defensive-move": ["defensive-move"],
    "master-games": ["master-games"],
    "survival-mode": ["survival-mode"],
    "daily-challenge": ["tactics"],
    "weekly-challenge": ["tactics"],
    "ai-challenge": ["middlegame"],
  };

  const categories = categoryMap[category] || ["tactics"];
  const puzzles = [];

  for (const cat of categories) {
    if (puzzles.length >= safeCount) break;
    const remaining = safeCount - puzzles.length;
    const categoryPuzzles = await puzzleRepository.getPuzzlesByCategory(cat, { take: remaining * 2 });
    const shuffled = categoryPuzzles.sort(() => Math.random() - 0.5);
    puzzles.push(...shuffled.slice(0, remaining));
  }

  if (puzzles.length === 0) {
    const fallback = await puzzleRepository.getPuzzlesByCategory("tactics", { take: safeCount });
    puzzles.push(...fallback);
  }

  const questions = puzzles.map((p, i) => ({
    id: p.id || `quiz-${i + 1}`,
    fen: p.fen,
    solution: p.solution || [],
    goal: p.goal || "Find the best move",
    category: p.category || category,
    difficulty: p.difficulty || "intermediate",
    rating: p.rating || 1000,
    source: "database",
    theme: p.theme,
    explanation: p.explanation || "",
    hint: p.hint || "Look for forcing moves: checks, captures, and threats.",
    attempts: 0,
    solved: false,
  }));

  const sessionId = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: sessionId,
    category,
    questionCount: questions.length,
    questions,
    createdAt: new Date().toISOString(),
    description: `Chess puzzle session: ${category}.`,
    fallback: false,
  };
}

module.exports = { generateQuizSession };
