const missionRepository = require("../repositories/missionRepository");

async function generateDailyMissions(userId, userData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rating = userData.ratings?.rapid || 1200;
  const totalGames = userData.gamesPlayed?.rapid || 0;
  const totalWins = userData.stats?.rapid?.wins || 0;
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  const missions = [];

  missions.push({
    title: "Solve 3 Tactical Puzzles",
    description: "Practice tactical patterns to sharpen your calculation.",
    type: "puzzle",
    target: 3,
    progress: 0,
    completed: false,
    xpReward: 15,
  });

  if (rating < 1800) {
    missions.push({
      title: "Study One Opening",
      description: "Learn the main lines of a new opening.",
      type: "opening",
      target: 1,
      progress: 0,
      completed: false,
      xpReward: 10,
    });
  }

  const targetGames = totalGames < 10 ? 2 : 1;
  missions.push({
    title: `Play ${targetGames} Rapid Game${targetGames > 1 ? "s" : ""}`,
    description: "Apply your training in a real match.",
    type: "game",
    target: targetGames,
    progress: 0,
    completed: false,
    xpReward: 20,
  });

  if (totalGames > 0) {
    missions.push({
      title: "Analyze Your Last Game",
      description: "Review your recent game to learn from mistakes.",
      type: "analysis",
      target: 1,
      progress: 0,
      completed: false,
      xpReward: 15,
    });
  }

  if (winRate < 50 && totalGames >= 5) {
    missions.push({
      title: "Practice One Endgame",
      description: "Endgame technique wins games. Practice conversion.",
      type: "endgame",
      target: 1,
      progress: 0,
      completed: false,
      xpReward: 10,
    });
  }

  missions.push({
    title: "Complete Today's Lesson",
    description: "Learn a new chess concept from the learning section.",
    type: "lesson",
    target: 1,
    progress: 0,
    completed: false,
    xpReward: 10,
  });

  return missionRepository.createDailyMission(userId, today, missions);
}

module.exports = { generateDailyMissions };