const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const Game = require("../models/Games");

// ================= STATS =================
router.get("/stats/:mode", protect, async (req, res) => {

  const user = req.user;
  const mode = req.params.mode;

  const ratings = user.ratings || {};
  const gamesPlayed = user.gamesPlayed || {};
  const statsObj = user.stats || {};
  const winStreak = user.winStreak || {};

  const stats = statsObj[mode] || {
    wins: 0,
    losses: 0,
    draws: 0
  };

  const rating = ratings[mode] || 800;
  const games = gamesPlayed[mode] || 0;
  const streak = winStreak[mode] || 0;

  const wins = stats.wins;
  const losses = stats.losses;
  const draws = stats.draws;

  const total = wins + losses + draws;

  const winRate =
    total > 0
      ? ((wins / total) * 100).toFixed(1) + "%"
      : "0%";

  let tier = "Beginner";

  if (rating >= 2400) tier = "Master";
  else if (rating >= 2000) tier = "Platinum";
  else if (rating >= 1600) tier = "Gold";
  else if (rating >= 1200) tier = "Silver";
  else if (rating >= 800) tier = "Bronze";

  res.json({
    rating,
    tier,
    gamesPlayed: games,
    wins,
    losses,
    draws,
    winRate,
    currentStreak: streak
  });

});
// ================= SAVE GAME =================
router.post("/save", protect, async (req, res) => {
  try {
    const game = await Game.create({
  user: req.user._id,
  mode: req.body.mode || "rapid",
  result: req.body.result || "unknown",
  moves: req.body.moves || [],
  pgn: req.body.pgn || "",
  playerColor: req.body.playerColor || "white",
  accuracy: req.body.accuracy || 0,
  opening: req.body.opening || "Unknown Opening",
  playerColor: req.body.playerColor || "white"
});


    res.json({
      success: true,
      game
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ================= MY GAMES =================
router.get("/my-games", protect, async (req, res) => {
  try {

    const games = await Game.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json(games);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;