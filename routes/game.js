const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const Game = require("../models/Games");
const User = require("../models/User");

const { calculateElo, getTier } = require("../utils/elo");
const { performAnalysis, getRankFromRating, determinePlayerLevel } = require("../utils/analysisService");

//  STATS 
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
//  SAVE GAME 
router.post("/save", protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    const mode = req.body.mode || "rapid";
    const result = req.body.result || "unknown";
    const moves = req.body.moves || [];
    const pgn = req.body.pgn || "";
    const playerColor = req.body.playerColor || "white";
    const accuracy = req.body.accuracy || 0;
    const opening = req.body.opening || "Unknown Opening";
    const difficulty = req.body.difficulty || "intermediate";
    
    // Calculate game duration
    const duration = req.body.duration || 0;
    
    // Determine if player won/lost/drew
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
    
    // Get current rating before game
    const ratingBefore = user.ratings[mode] || 1200;
    
    // Calculate score for ELO
    let score = 0.5; // draw
    if (isWin) score = 1;
    else if (isLoss) score = 0;
    
    // Calculate opponent rating (AI has fixed rating based on difficulty)
    const aiRatings = {
      beginner: 800,
      intermediate: 1200,
      advanced: 1600,
      master: 2200
    };
    const opponentRating = aiRatings[difficulty] || 1200;
    
    // Calculate new rating
    const gamesPlayed = user.gamesPlayed[mode] || 0;
    const streak = user.winStreak[mode] || 0;
    const newRating = calculateElo(ratingBefore, opponentRating, score, gamesPlayed, streak);
    
    // Update user stats
    if (!user.stats[mode]) {
      user.stats[mode] = { wins: 0, losses: 0, draws: 0 };
    }
    
    if (isWin) {
      user.stats[mode].wins = (user.stats[mode].wins || 0) + 1;
      user.winStreak[mode] = (user.winStreak[mode] || 0) + 1;
    } else if (isLoss) {
      user.stats[mode].losses = (user.stats[mode].losses || 0) + 1;
      user.winStreak[mode] = 0;
    } else {
      user.stats[mode].draws = (user.stats[mode].draws || 0) + 1;
      user.winStreak[mode] = 0;
    }
    
    user.gamesPlayed[mode] = (user.gamesPlayed[mode] || 0) + 1;
    user.ratings[mode] = newRating;
    
    // Update best rating
    if (newRating > (user.bestRating[mode] || 1200)) {
      user.bestRating[mode] = newRating;
    }
    
    // Track accuracy for averages
    if (accuracy > 0) {
      user.totalAccuracySum = (user.totalAccuracySum || 0) + accuracy;
      user.totalAccuracyGames = (user.totalAccuracyGames || 0) + 1;
    }
    
    // Add to rating history
    if (!user.ratingHistory[mode]) {
      user.ratingHistory[mode] = [];
    }
    user.ratingHistory[mode].push({
      rating: newRating,
      date: new Date()
    });
    
    // Perform analysis if we have moves
    let analysisResult = null;
    if (moves.length > 0) {
      analysisResult = performAnalysis(
        moves,
        playerColor,
        null,
        ratingBefore,
        newRating,
        duration,
        difficulty
      );
      
      // Track centipawn loss for consistency
      if (analysisResult.averageCentipawnLoss > 0) {
        user.totalCentipawnLoss = (user.totalCentipawnLoss || 0) + analysisResult.averageCentipawnLoss;
        user.totalCentipawnGames = (user.totalCentipawnGames || 0) + 1;
      }
    }
    
    // Calculate consistency score
    if (user.totalCentipawnGames > 0) {
      const avgCentipawnLoss = user.totalCentipawnLoss / user.totalCentipawnGames;
      user.consistencyScore = Math.round(Math.max(0, 100 - avgCentipawnLoss / 3));
    }
    
    // Recalculate player level
    const totalGames = (user.gamesPlayed[mode] || 0);
    const totalWins = (user.stats[mode]?.wins || 0);
    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
    const avgAccuracy = user.totalAccuracyGames > 0 
      ? Math.round(user.totalAccuracySum / user.totalAccuracyGames) 
      : 0;
    
    user.playerLevel = determinePlayerLevel(
      newRating, 
      winRate, 
      avgAccuracy, 
      user.consistencyScore || 50, 
      totalGames
    );
    
    await user.save();
    
    // Create game record with analysis
    const gameData = {
      user: userId,
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
      playerLevelAfterGame: user.playerLevel,
      ratingChange: newRating - ratingBefore
    };
    
    // Add analysis data if available
    if (analysisResult) {
      gameData.strengths = analysisResult.strengths;
      gameData.weaknesses = analysisResult.weaknesses;
      gameData.openingScore = analysisResult.openingScore;
      gameData.middleGameScore = analysisResult.middleGameScore;
      gameData.endgameScore = analysisResult.endgameScore;
      gameData.coachRecommendations = analysisResult.coachRecommendations;
      gameData.performanceScore = analysisResult.performanceScore;
      gameData.moveAnalysis = analysisResult.moveAnalysis;
      gameData.evaluationData = analysisResult.evaluationData;
      gameData.bestMoves = analysisResult.bestMoves;
      gameData.excellentMoves = analysisResult.excellentMoves;
      gameData.goodMoves = analysisResult.goodMoves;
      gameData.inaccuracies = analysisResult.inaccuracies;
      gameData.mistakes = analysisResult.mistakes;
      gameData.blunders = analysisResult.blunders;
      gameData.brilliantMoves = analysisResult.brilliantMoves;
      gameData.missedWins = analysisResult.missedWins;
      gameData.averageCentipawnLoss = analysisResult.averageCentipawnLoss;
      gameData.materialBalance = analysisResult.materialBalance;
      gameData.pieceActivityScore = analysisResult.pieceActivityScore;
      gameData.kingSafetyScore = analysisResult.kingSafetyScore;
      gameData.endgameQualityScore = analysisResult.endgameQualityScore;
      gameData.tacticalAbilityScore = analysisResult.tacticalAbilityScore;
      gameData.positionalPlayScore = analysisResult.positionalPlayScore;
      gameData.decisionMakingScore = analysisResult.decisionMakingScore;
      gameData.consistencyScore = analysisResult.consistencyScore;
      gameData.playingStyle = analysisResult.playingStyle;
    }

    const game = await Game.create(gameData);

    res.json({
      success: true,
      game,
      ratingChange: newRating - ratingBefore,
      newRating,
      rankAfterGame: getRankFromRating(newRating),
      playerLevelAfterGame: user.playerLevel,
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
        missedWins: analysisResult.missedWins
      } : null
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

//  MY GAMES 
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

// SINGLE GAME
router.get("/:id", protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;