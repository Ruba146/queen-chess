const missionRepository = require("../repositories/missionRepository");
const memoryRepository = require("../repositories/memoryRepository");
const gameRepository = require("../repositories/gameRepository");
const { generateDailyMissions } = require("./dailyMissionGenerator");
const puzzleRepository = require("../repositories/puzzleRepository");

async function getDashboard(userId, user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rating = user.ratings?.rapid || 1200;
  const gamesPlayed = user.gamesPlayed?.rapid || 0;

  let rank = "Beginner";
  if (rating >= 800) rank = "Bronze";
  if (rating >= 1200) rank = "Silver";
  if (rating >= 1600) rank = "Gold";
  if (rating >= 2000) rank = "Platinum";
  if (rating >= 2400) rank = "Diamond";
  if (rating >= 2700) rank = "Master";
  if (rating >= 2900) rank = "Grandmaster";

  const recentGame = await gameRepository.getRecentGame(userId);
  const dailyStreak = user.dailyStreak || 0;
  const lastActive = user.lastActiveDate;
  const totalGames = gamesPlayed;
  const totalWins = user.stats?.rapid?.wins || 0;
  const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0";
  const avgAccuracy = user.totalAccuracyGames > 0
    ? Math.round(user.totalAccuracySum / user.totalAccuracyGames)
    : 0;
  const xp = user.xp || 0;
  const level = user.level || 1;
  const xpForNextLevel = level * 100;
  const xpProgress = Math.min(100, Math.round((xp / xpForNextLevel) * 100));

  let todayMission = await missionRepository.getDailyMission(userId, today);
  if (!todayMission) {
    todayMission = await generateDailyMissions(userId, user);
  }

  const aiMemory = await memoryRepository.getAIMemory(userId);
  const recentRecommendation = aiMemory?.memories
    ?.filter((m) => m.category === "goal" || m.category === "training")
    ?.slice(-1)?.[0]?.value || null;

  const puzzleCollections = await puzzleRepository.listCollectionProgress(userId)
  const totalPuzzlesSolved = puzzleCollections.reduce((sum, c) => sum + c.completedPuzzles, 0)
  const totalPuzzleXp = puzzleCollections.reduce((sum, c) => sum + c.xpEarned, 0)

  let todayOpening = null;
  const openingValue = aiMemory?.memories
    ?.find((m) => m.key === "today_opening")?.value;
  if (openingValue) {
    todayOpening = {
      name: openingValue,
      description: "Study and practice this opening today.",
    };
  }

  let todayPuzzle = null;
  const puzzleValue = aiMemory?.memories
    ?.find((m) => m.key === "today_puzzle")?.value;
  if (puzzleValue) {
    todayPuzzle = {
      title: puzzleValue,
      description: "Solve this tactical puzzle today.",
    };
  }

  const welcomeMessage = [
    "Ready to improve your chess today?",
    "Let's make today a winning day!",
    "Keep pushing forward!",
    "Every master was once a beginner.",
    "Your dedication is paying off!",
  ][Math.floor(Math.random() * 5)];

  return {
    success: true,
    data: {
      welcome: {
        name: user.displayName || user.username,
        message: welcomeMessage,
        playerLevel: user.playerLevel || "Beginner",
      },
      rating: {
        rapid: rating,
        rank,
        change: recentGame?.ratingChange || 0,
      },
      recentGame: recentGame
        ? {
            id: recentGame.id,
            _id: recentGame.id,
            result: recentGame.result,
            opening: recentGame.opening,
            accuracy: recentGame.accuracy,
            date: recentGame.createdAt,
            playerColor: recentGame.playerColor,
          }
        : null,
      dailyStreak: {
        count: dailyStreak,
        active: lastActive ? true : false,
      },
      learningProgress: {
        xp,
        level,
        xpProgress,
        winRate: winRate + "%",
        avgAccuracy,
        totalGames,
        totalPuzzlesSolved,
        totalPuzzleXp,
      },
      todayGoal: todayMission?.missions?.[0]
        ? {
            title: todayMission.missions[0].title,
            description: todayMission.missions[0].description,
            type: todayMission.missions[0].type,
            target: todayMission.missions[0].target,
            progress: todayMission.missions[0].progress,
            completed: todayMission.missions[0].completed,
          }
        : null,
      todayTraining: todayMission?.missions
        ? todayMission.missions.slice(0, 3).map((m) => ({
            title: m.title,
            description: m.description,
            type: m.type,
            completed: m.completed,
          }))
        : [],
      todayOpening,
      todayPuzzle,
      recentRecommendation,
      quickResume: recentGame
        ? {
            type: recentGame.result === "White" || recentGame.result === "Black" ? "review" : "play",
            gameId: recentGame.id,
            opening: recentGame.opening,
            result: recentGame.result,
          }
        : null,
      achievements: user.achievements || [],
    },
  };
}

module.exports = {
  getDashboard,
};