const puzzleService = require("../services/puzzleService");

async function listCollections(req, res) {
  try {
    const collections = await puzzleService.listUserCollections(req.user.id);
    res.json({ success: true, data: collections });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load collections" });
  }
}

async function getCollection(req, res) {
  try {
    const { category } = req.params;
    const progress = await puzzleService.getUserCollectionProgress(req.user.id, category);
    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load collection" });
  }
}

async function getCollectionPuzzles(req, res) {
  try {
    const { category } = req.params;
    const { count = 20, difficulty } = req.query;
    const puzzles = await puzzleService.getCollectionPuzzles(category, req.user.id, {
      count: Math.min(Number(count), 50),
      difficulty: difficulty || undefined,
    });
    res.json({ success: true, data: puzzles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load puzzles" });
  }
}

async function getNextPuzzle(req, res) {
  try {
    const { category } = req.params;
    const result = await puzzleService.getNextPuzzle(category, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load next puzzle" });
  }
}

async function submitAnswer(req, res) {
  try {
    const { puzzleId } = req.body;
    const { move, attempts = 1, solveTime } = req.body;
    if (!puzzleId) {
      return res.status(400).json({ success: false, error: "Puzzle ID is required" });
    }
    if (!move) {
      return res.status(400).json({ success: false, error: "Move is required" });
    }
    const result = await puzzleService.submitPuzzleAnswer(req.user.id, puzzleId, move, attempts, solveTime);
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, error: err.message || "Failed to submit answer" });
  }
}

async function getPuzzle(req, res) {
  try {
    const { puzzleId } = req.params;
    const puzzle = await puzzleService.getPuzzleById(puzzleId);
    if (!puzzle) {
      return res.status(404).json({ success: false, error: "Puzzle not found" });
    }
    res.json({ success: true, data: puzzle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load puzzle" });
  }
}

async function getHint(req, res) {
  try {
    const { puzzleId } = req.params;
    const hint = await puzzleService.getPuzzleHint(puzzleId);
    if (!hint) {
      return res.status(404).json({ success: false, error: "Puzzle not found" });
    }
    res.json({ success: true, data: hint });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load hint" });
  }
}

async function resetCategoryProgress(req, res) {
  try {
    const { category } = req.params;
    const result = await puzzleService.resetCategoryProgress(req.user.id, category);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to reset progress" });
  }
}

async function createPuzzle(req, res) {
  try {
    const puzzle = await puzzleService.createPuzzle(req.body);
    res.status(201).json({ success: true, data: puzzle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to create puzzle" });
  }
}

async function generateAIPuzzle(req, res) {
  try {
    const { category, difficulty, excludeIds } = req.body;
    if (!category) {
      return res.status(400).json({ success: false, error: "Category is required" });
    }
    const puzzle = await puzzleService.generateAIPuzzle(category, difficulty, excludeIds || []);
    if (!puzzle) {
      return res.status(404).json({ success: false, error: "Could not generate puzzle. Try again." });
    }
    res.status(201).json({ success: true, data: puzzle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to generate puzzle" });
  }
}

async function getDailyChallenge(req, res) {
  try {
    const result = await puzzleService.getDailyChallenge(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load daily challenge" });
  }
}

async function getWeeklyChallenge(req, res) {
  try {
    const result = await puzzleService.getWeeklyChallenge(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load weekly challenge" });
  }
}

async function submitChallengeAnswer(req, res) {
  try {
    const { challengeType, challengeId, move, attempts = 1, solveTime } = req.body;
    if (!challengeType || !challengeId || !move) {
      return res.status(400).json({ success: false, error: "challengeType, challengeId, and move are required" });
    }
    const result = await puzzleService.submitChallengeAnswer(req.user.id, challengeType, challengeId, move, attempts, solveTime);
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, error: err.message || "Failed to submit challenge answer" });
  }
}

async function startSurvival(req, res) {
  try {
    const { category } = req.body;
    const result = await puzzleService.startSurvivalMode(req.user.id, category);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to start survival mode" });
  }
}

async function submitSurvivalAnswer(req, res) {
  try {
    const { puzzleId, move, solveTime, category } = req.body;
    if (!puzzleId || !move) {
      return res.status(400).json({ success: false, error: "puzzleId and move are required" });
    }
    const result = await puzzleService.submitSurvivalAnswer(req.user.id, puzzleId, move, solveTime, category);
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, error: err.message || "Failed to submit survival answer" });
  }
}

async function getAnalytics(req, res) {
  try {
    const analytics = await puzzleService.getPuzzleAnalytics(req.user.id);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load analytics" });
  }
}

async function getUserPuzzleRating(req, res) {
  try {
    const rating = await puzzleService.getUserPuzzleRating(req.user.id);
    res.json({ success: true, data: rating });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load puzzle rating" });
  }
}

async function getUserPuzzleRatingHistory(req, res) {
  try {
    const history = await puzzleService.getUserPuzzleRatingHistory(req.user.id);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load rating history" });
  }
}

async function getAdaptivePuzzles(req, res) {
  try {
    const { count = 10 } = req.query;
    const puzzles = await puzzleService.getAdaptivePuzzles(req.user.id, Number(count));
    res.json({ success: true, data: puzzles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load adaptive puzzles" });
  }
}

async function getWeakThemes(req, res) {
  try {
    const themes = await puzzleService.getWeakThemes(req.user.id);
    res.json({ success: true, data: themes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Failed to load weak themes" });
  }
}

module.exports = {
  listCollections,
  getCollection,
  getCollectionPuzzles,
  getNextPuzzle,
  submitAnswer,
  getPuzzle,
  getHint,
  createPuzzle,
  resetCategoryProgress,
  generateAIPuzzle,
  getDailyChallenge,
  getWeeklyChallenge,
  submitChallengeAnswer,
  startSurvival,
  submitSurvivalAnswer,
  getAnalytics,
  getUserPuzzleRating,
  getUserPuzzleRatingHistory,
  getAdaptivePuzzles,
  getWeakThemes,
};
