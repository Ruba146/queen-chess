const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const jwtSecret = require("../config/jwt");
const { determinePlayerLevel } = require("./analysisService");

async function registerUser(username, email, password) {
  const existingUser = await userRepository.getUserByEmail(email, { includePassword: true });
  if (existingUser) {
    throw { status: 400, message: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    username,
    email,
    password: hashedPassword,
    displayName: username,
  });

  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d" });
  return { message: "User created successfully", token };
}

async function loginUser(email, password) {
  const user = await userRepository.getUserByEmail(email, { includePassword: true });
  if (!user) {
    throw { status: 400, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 400, message: "Invalid credentials" };
  }

  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d" });

  return {
    token,
    user: {
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      ratings: user.ratings,
      gamesPlayed: user.gamesPlayed,
      profilePicture: user.profilePicture,
    },
  };
}

async function getProfile(userId) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  return user;
}

async function updateProfile(userId, updates) {
  const updateData = {};
  if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
  if (updates.preferredSide !== undefined) updateData.preferredSide = updates.preferredSide;

  if (updates.username !== undefined) {
    const existing = await userRepository.getUserByUsernameExcept(updates.username, userId);
    if (existing) {
      throw { status: 400, message: "Username already taken" };
    }
    updateData.username = updates.username;
  }

  return userRepository.updateUser(userId, updateData);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.getUserById(userId, { includePassword: true });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw { status: 400, message: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updateUser(userId, { password: hashedPassword });
  return { message: "Password changed successfully" };
}

async function updateProfilePicture(userId, profilePicture) {
  return userRepository.updateUser(userId, {
    profilePicture: profilePicture || "",
  });
}

async function getExtendedStats(userId, mode) {
  const user = await userRepository.getUserById(userId);

  const stats = user.stats?.[mode] || { wins: 0, losses: 0, draws: 0 };
  const rating = user.ratings?.[mode] || 1200;
  const games = user.gamesPlayed?.[mode] || 0;
  const streak = user.winStreak?.[mode] || 0;

  const wins = stats.wins;
  const losses = stats.losses;
  const draws = stats.draws;
  const total = wins + losses + draws;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";

  let rank = "Beginner";
  if (rating >= 800) rank = "Bronze";
  if (rating >= 1200) rank = "Silver";
  if (rating >= 1600) rank = "Gold";
  if (rating >= 2000) rank = "Platinum";
  if (rating >= 2400) rank = "Diamond";
  if (rating >= 2700) rank = "Master";
  if (rating >= 2900) rank = "Grandmaster";

  const avgAccuracy = user.totalAccuracyGames > 0
    ? Math.round(user.totalAccuracySum / user.totalAccuracyGames)
    : 0;
  const consistency = user.consistencyScore || 50;

  const playerLevel = determinePlayerLevel(
    parseFloat(rating),
    parseFloat(winRate),
    avgAccuracy,
    consistency,
    games
  );

  return {
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
    totalAccuracyGames: user.totalAccuracyGames,
  };
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  updateProfilePicture,
  getExtendedStats,
};