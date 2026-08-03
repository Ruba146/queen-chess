const prisma = require("../config/prisma");
const { serializeUser, userInclude } = require("../utils/serializers");

const DEFAULT_MODES = ["rapid", "blitz", "bullet"];

async function getUserById(id, options) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude(),
  });
  return serializeUser(user, options);
}

async function getUserByEmail(email, options) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: userInclude(),
  });
  return serializeUser(user, options);
}

async function getUserByUsernameExcept(username, excludedUserId) {
  return prisma.user.findFirst({
    where: {
      username,
      NOT: { id: excludedUserId },
    },
  });
}

async function createUser(data) {
  const user = await prisma.user.create({
    data: {
      ...data,
      userStats: {
        create: DEFAULT_MODES.map((mode) => ({ mode })),
      },
    },
    include: userInclude(),
  });
  return serializeUser(user, { includePassword: true });
}

async function updateUser(id, data, options) {
  const user = await prisma.user.update({
    where: { id },
    data,
    include: userInclude(),
  });
  return serializeUser(user, options);
}

async function updateUserGameStats(user, mode, changes) {
  const stat = {
    rating: changes.newRating,
    bestRating: Math.max(changes.newRating, user.bestRating?.[mode] || 1200),
    gamesPlayed: (user.gamesPlayed?.[mode] || 0) + 1,
    winStreak: changes.winStreak,
    wins: user.stats?.[mode]?.wins || 0,
    losses: user.stats?.[mode]?.losses || 0,
    draws: user.stats?.[mode]?.draws || 0,
  };

  if (changes.isWin) stat.wins += 1;
  else if (changes.isLoss) stat.losses += 1;
  else stat.draws += 1;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.userStat.upsert({
      where: { userId_mode: { userId: user.id, mode } },
      create: { userId: user.id, mode, ...stat },
      update: stat,
    });

    await tx.ratingHistory.create({
      data: {
        userId: user.id,
        mode,
        rating: changes.newRating,
      },
    });

    return tx.user.update({
      where: { id: user.id },
      data: {
        totalAccuracySum: changes.totalAccuracySum,
        totalAccuracyGames: changes.totalAccuracyGames,
        totalCentipawnLoss: changes.totalCentipawnLoss,
        totalCentipawnGames: changes.totalCentipawnGames,
        consistencyScore: changes.consistencyScore,
        playerLevel: changes.playerLevel,
      },
      include: userInclude(),
    });
  });

  return serializeUser(updated, { includePassword: true });
}

module.exports = {
  getUserById,
  getUserByEmail,
  getUserByUsernameExcept,
  createUser,
  updateUser,
  updateUserGameStats,
};