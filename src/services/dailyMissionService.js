const missionRepository = require("../repositories/missionRepository");
const userRepository = require("../repositories/userRepository");
const { generateDailyMissions } = require("./dailyMissionGenerator");

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function missionResponse(mission) {
  const total = mission.missions.length;
  const completed = mission.missions.filter((m) => m.completed).length;
  return {
    _id: mission.id,
    id: mission.id,
    date: mission.date,
    missions: mission.missions,
    completed: mission.completed,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    totalMissions: total,
    completedMissions: completed,
  };
}

async function getOrCreateTodayMission(userId) {
  const today = todayStart();
  let mission = await missionRepository.getDailyMission(userId, today);
  if (!mission) {
    const user = await userRepository.getUserById(userId);
    mission = await generateDailyMissions(userId, user);
  }
  return { success: true, data: missionResponse(mission) };
}

async function refreshMission(userId) {
  const today = todayStart();
  await missionRepository.deleteDailyMission(userId, today);
  const user = await userRepository.getUserById(userId);
  const mission = await generateDailyMissions(userId, user);
  return { success: true, data: missionResponse(mission) };
}

async function updateProgress(userId, missionId, progress) {
  const today = todayStart();
  const result = await missionRepository.updateMissionItem(userId, today, missionId, progress);

  if (!result) {
    throw { status: 404, message: "No missions for today" };
  }
  if (!result.item) {
    throw { status: 404, message: "Mission not found" };
  }

  if (result.item.completed) {
    const user = await userRepository.getUserById(userId);
    let xp = (user.xp || 0) + (result.item.xpReward || 0);
    let level = user.level || 1;
    const xpForNextLevel = level * 100;
    if (xp >= xpForNextLevel) {
      xp -= xpForNextLevel;
      level += 1;
    }
    await userRepository.updateUser(userId, { xp, level });
  }

  return { success: true, data: missionResponse(result.mission) };
}

module.exports = {
  getOrCreateTodayMission,
  refreshMission,
  updateProgress,
};