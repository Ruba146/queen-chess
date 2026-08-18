const prisma = require("../config/prisma");
const { serializeDailyMission } = require("../utils/serializers");

async function getDailyMission(userId, date) {
  const mission = await prisma.dailyMission.findUnique({
    where: { userId_date: { userId, date } },
    include: { missions: { orderBy: { createdAt: "asc" } } },
  });
  return serializeDailyMission(mission);
}

async function createDailyMission(userId, date, missions) {
  try {
    const mission = await prisma.dailyMission.create({
      data: {
        userId,
        date,
        missions: { create: missions },
      },
      include: { missions: { orderBy: { createdAt: "asc" } } },
    });
    return serializeDailyMission(mission);
  } catch (err) {
    if (err.code === 'P2002') {
      const mission = await prisma.dailyMission.findUnique({
        where: { userId_date: { userId, date } },
        include: { missions: { orderBy: { createdAt: "asc" } } },
      });
      return serializeDailyMission(mission);
    }
    throw err;
  }
}

async function deleteDailyMission(userId, date) {
  await prisma.dailyMission.deleteMany({ where: { userId, date } });
}

async function updateMissionItem(userId, date, missionItemId, progress) {
  const mission = await getDailyMission(userId, date);
  if (!mission) return null;

  const item = mission.missions.find((entry) => entry.id === missionItemId);
  if (!item) return { mission, item: null };

  const nextProgress = progress !== undefined ? progress : item.progress + 1;
  const completed = nextProgress >= item.target;

  await prisma.missionItem.update({
    where: { id: missionItemId },
    data: {
      progress: completed ? item.target : nextProgress,
      completed,
    },
  });

  const updated = await getDailyMission(userId, date);
  const allCompleted = updated.missions.every((entry) => entry.completed);
  const finalMission = await prisma.dailyMission.update({
    where: { id: mission.id },
    data: { completed: allCompleted },
    include: { missions: { orderBy: { createdAt: "asc" } } },
  });

  return { mission: serializeDailyMission(finalMission), item: { ...item, completed, progress: nextProgress } };
}

module.exports = {
  getDailyMission,
  createDailyMission,
  deleteDailyMission,
  updateMissionItem,
};