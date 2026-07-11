const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// REGISTER 
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      displayName: username
    });

    // sign token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN 
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        ratings: user.ratings,
        gamesPlayed: user.gamesPlayed,
        profilePicture: user.profilePicture
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROFILE 
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROFILE
router.put("/profile", protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { displayName, username, preferredSide } = req.body;
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (preferredSide !== undefined) updateData.preferredSide = preferredSide;
    
    if (username !== undefined) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updateData.username = username;
    }
    
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE PASSWORD
router.put("/change-password", protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROFILE PICTURE
router.put("/profile-picture", protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { profilePicture } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture }, { new: true }).select("-password");
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXTENDED STATS
router.get("/extended-stats/:mode", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select("-password");
    const mode = req.params.mode;
    
    const ratings = user.ratings || {};
    const gamesPlayed = user.gamesPlayed || {};
    const statsObj = user.stats || {};
    const winStreak = user.winStreak || {};
    
    const stats = statsObj[mode] || { wins: 0, losses: 0, draws: 0 };
    const rating = ratings[mode] || 1200;
    const games = gamesPlayed[mode] || 0;
    const streak = winStreak[mode] || 0;
    
    const wins = stats.wins;
    const losses = stats.losses;
    const draws = stats.draws;
    const total = wins + losses + draws;
    
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";
    
    // Calculate rank
    let rank = "Beginner";
    if (rating >= 800) rank = "Bronze";
    if (rating >= 1200) rank = "Silver";
    if (rating >= 1600) rank = "Gold";
    if (rating >= 2000) rank = "Platinum";
    if (rating >= 2400) rank = "Diamond";
    if (rating >= 2700) rank = "Master";
    if (rating >= 2900) rank = "Grandmaster";
    
    // Calculate average accuracy
    const avgAccuracy = user.totalAccuracyGames > 0 
      ? Math.round(user.totalAccuracySum / user.totalAccuracyGames) 
      : 0;
    
    // Calculate consistency
    const consistency = user.consistencyScore || 50;
    
    // Determine player level
    const { determinePlayerLevel } = require("../utils/analysisService");
    const playerLevel = determinePlayerLevel(
      parseFloat(rating), 
      parseFloat(winRate), 
      avgAccuracy, 
      consistency, 
      games
    );
    
    res.json({
      rating,
      rank,
      tier: rank,
      gamesPlayed: games,
      wins,
      losses,
      draws,
      winRate: winRate + "%",
      winRateNum: parseFloat(winRate),
      currentStreak: streak,
      avgAccuracy,
      consistency,
      playerLevel,
      displayName: user.displayName || user.username,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      preferredSide: user.preferredSide || "random",
      mostPlayedDifficulty: user.mostPlayedDifficulty || "intermediate",
      favoriteOpening: user.favoriteOpening || "Unknown",
      createdAt: user.createdAt,
      totalAccuracySum: user.totalAccuracySum,
      totalAccuracyGames: user.totalAccuracyGames
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;