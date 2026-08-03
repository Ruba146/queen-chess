const prisma = require("../config/prisma");
const { serializeGame, gameInclude, buildGameData, moveAnalysisData, evalData } = require("../utils/serializers");

async function createGame(input) {
  const moveAnalyses = input.moveAnalysis || input.moveRecords || [];
  const evaluations = input.evaluationData || [];
  const data = buildGameData(input);
  if (!data.createdAt) delete data.createdAt;

  const game = await prisma.game.create({
    data: {
      ...data,
      moveAnalyses: { create: moveAnalysisData(moveAnalyses) },
      evalData: { create: evalData(evaluations) },
    },
    include: gameInclude(),
  });

  return serializeGame(game);
}

async function getGameById(id) {
  const game = await prisma.game.findUnique({
    where: { id },
    include: gameInclude(),
  });
  return serializeGame(game);
}

async function listUserGames(userId, options = {}) {
  const games = await prisma.game.findMany({
    where: {
      userId,
      ...(options.excludeTraining ? { isTrainingDataset: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options.take,
    include: gameInclude(),
  });
  return games.map(serializeGame);
}

async function getRecentGame(userId) {
  const game = await prisma.game.findFirst({
    where: { userId, isTrainingDataset: false },
    orderBy: { createdAt: "desc" },
    include: gameInclude(),
  });
  return serializeGame(game);
}

async function updateGameAnalysis(id, data) {
  const moveAnalyses = data.moveAnalysis || [];
  const evaluations = data.evaluationData || [];
  const gameData = buildGameData({ ...data, userId: data.userId || data.user });
  delete gameData.userId;
  delete gameData.createdAt;

  const game = await prisma.$transaction(async (tx) => {
    await tx.gameMoveAnalysis.deleteMany({ where: { gameId: id } });
    await tx.gameEvalData.deleteMany({ where: { gameId: id } });
    return tx.game.update({
      where: { id },
      data: {
        ...gameData,
        moveAnalyses: { create: moveAnalysisData(moveAnalyses) },
        evalData: { create: evalData(evaluations) },
      },
      include: gameInclude(),
    });
  });

  return serializeGame(game);
}

module.exports = {
  createGame,
  getGameById,
  listUserGames,
  getRecentGame,
  updateGameAnalysis,
};