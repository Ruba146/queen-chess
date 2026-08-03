/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "consistencyScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "favoriteOpening" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "lastActiveDate" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "mostPlayedDifficulty" TEXT NOT NULL DEFAULT 'intermediate',
ADD COLUMN     "playerLevel" TEXT NOT NULL DEFAULT 'Beginner',
ADD COLUMN     "preferredSide" TEXT NOT NULL DEFAULT 'random',
ADD COLUMN     "profilePicture" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "totalAccuracyGames" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAccuracySum" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCentipawnGames" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCentipawnLoss" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "bestRating" INTEGER NOT NULL DEFAULT 1200,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'rapid',
    "result" TEXT NOT NULL DEFAULT 'unknown',
    "opening" TEXT NOT NULL DEFAULT 'Unknown Opening',
    "accuracy" INTEGER NOT NULL DEFAULT 0,
    "pgn" TEXT,
    "playerColor" TEXT NOT NULL DEFAULT 'white',
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "ratingsBeforePlayer1" INTEGER NOT NULL DEFAULT 1200,
    "ratingsBeforePlayer2" INTEGER NOT NULL DEFAULT 1200,
    "ratingsAfterPlayer1" INTEGER NOT NULL DEFAULT 1200,
    "ratingsAfterPlayer2" INTEGER NOT NULL DEFAULT 1200,
    "ratingAfterGame" INTEGER NOT NULL DEFAULT 1200,
    "rankAfterGame" TEXT NOT NULL DEFAULT 'Beginner',
    "playerLevelAfterGame" TEXT NOT NULL DEFAULT 'Beginner',
    "ratingChange" INTEGER NOT NULL DEFAULT 0,
    "labelOutcome" TEXT NOT NULL DEFAULT 'unknown',
    "labelColor" TEXT NOT NULL DEFAULT 'white',
    "labelOpening" TEXT NOT NULL DEFAULT 'Unknown',
    "labelDifficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "snapshotBefore" INTEGER NOT NULL DEFAULT 1200,
    "snapshotAfter" INTEGER NOT NULL DEFAULT 1200,
    "snapshotChange" INTEGER NOT NULL DEFAULT 0,
    "openingScore" INTEGER NOT NULL DEFAULT 0,
    "middleGameScore" INTEGER NOT NULL DEFAULT 0,
    "endgameScore" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "bestMoves" INTEGER NOT NULL DEFAULT 0,
    "excellentMoves" INTEGER NOT NULL DEFAULT 0,
    "goodMoves" INTEGER NOT NULL DEFAULT 0,
    "inaccuracies" INTEGER NOT NULL DEFAULT 0,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "blunders" INTEGER NOT NULL DEFAULT 0,
    "brilliantMoves" INTEGER NOT NULL DEFAULT 0,
    "missedWins" INTEGER NOT NULL DEFAULT 0,
    "averageCentipawnLoss" INTEGER NOT NULL DEFAULT 0,
    "materialBalance" INTEGER NOT NULL DEFAULT 0,
    "pieceActivityScore" INTEGER NOT NULL DEFAULT 0,
    "kingSafetyScore" INTEGER NOT NULL DEFAULT 0,
    "endgameQualityScore" INTEGER NOT NULL DEFAULT 0,
    "tacticalAbilityScore" INTEGER NOT NULL DEFAULT 0,
    "positionalPlayScore" INTEGER NOT NULL DEFAULT 0,
    "decisionMakingScore" INTEGER NOT NULL DEFAULT 0,
    "consistencyScore" INTEGER NOT NULL DEFAULT 0,
    "playingStyle" TEXT NOT NULL DEFAULT 'Balanced',
    "isTrainingDataset" BOOLEAN NOT NULL DEFAULT false,
    "parentGameId" TEXT,
    "totalMoves" INTEGER NOT NULL DEFAULT 0,
    "outcome" TEXT NOT NULL DEFAULT 'unknown',
    "moves" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coachRecommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameMoveAnalysis" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "moveNumber" INTEGER NOT NULL,
    "move" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "loss" INTEGER NOT NULL DEFAULT 0,
    "evalBefore" INTEGER NOT NULL DEFAULT 0,
    "evalAfter" INTEGER NOT NULL DEFAULT 0,
    "phase" TEXT NOT NULL,

    CONSTRAINT "GameMoveAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvalData" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "moveNumber" INTEGER NOT NULL,
    "playerEval" INTEGER NOT NULL DEFAULT 0,
    "bestEval" INTEGER NOT NULL DEFAULT 0,
    "diff" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameEvalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMemoryEntry" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIMemoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionItem" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "ttl" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserStat_userId_idx" ON "UserStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStat_userId_mode_key" ON "UserStat"("userId", "mode");

-- CreateIndex
CREATE INDEX "RatingHistory_userId_mode_idx" ON "RatingHistory"("userId", "mode");

-- CreateIndex
CREATE INDEX "RatingHistory_userId_date_idx" ON "RatingHistory"("userId", "date");

-- CreateIndex
CREATE INDEX "Game_userId_idx" ON "Game"("userId");

-- CreateIndex
CREATE INDEX "Game_isTrainingDataset_idx" ON "Game"("isTrainingDataset");

-- CreateIndex
CREATE INDEX "Game_parentGameId_idx" ON "Game"("parentGameId");

-- CreateIndex
CREATE INDEX "GameMoveAnalysis_gameId_idx" ON "GameMoveAnalysis"("gameId");

-- CreateIndex
CREATE INDEX "GameMoveAnalysis_gameId_moveNumber_idx" ON "GameMoveAnalysis"("gameId", "moveNumber");

-- CreateIndex
CREATE INDEX "GameMoveAnalysis_gameId_phase_idx" ON "GameMoveAnalysis"("gameId", "phase");

-- CreateIndex
CREATE INDEX "GameMoveAnalysis_gameId_classification_idx" ON "GameMoveAnalysis"("gameId", "classification");

-- CreateIndex
CREATE INDEX "GameEvalData_gameId_idx" ON "GameEvalData"("gameId");

-- CreateIndex
CREATE INDEX "GameEvalData_gameId_moveNumber_idx" ON "GameEvalData"("gameId", "moveNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AIMemory_userId_key" ON "AIMemory"("userId");

-- CreateIndex
CREATE INDEX "AIMemoryEntry_memoryId_idx" ON "AIMemoryEntry"("memoryId");

-- CreateIndex
CREATE INDEX "AIMemoryEntry_memoryId_category_idx" ON "AIMemoryEntry"("memoryId", "category");

-- CreateIndex
CREATE INDEX "AIMemoryEntry_memoryId_key_idx" ON "AIMemoryEntry"("memoryId", "key");

-- CreateIndex
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");

-- CreateIndex
CREATE INDEX "Chat_userId_updatedAt_idx" ON "Chat"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyMission_userId_idx" ON "DailyMission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMission_userId_date_key" ON "DailyMission"("userId", "date");

-- CreateIndex
CREATE INDEX "MissionItem_missionId_idx" ON "MissionItem"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "AICache_key_key" ON "AICache"("key");

-- CreateIndex
CREATE INDEX "AICache_key_idx" ON "AICache"("key");

-- CreateIndex
CREATE INDEX "AICache_ttl_idx" ON "AICache"("ttl");

-- AddForeignKey
ALTER TABLE "UserStat" ADD CONSTRAINT "UserStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameMoveAnalysis" ADD CONSTRAINT "GameMoveAnalysis_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvalData" ADD CONSTRAINT "GameEvalData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMemory" ADD CONSTRAINT "AIMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMemoryEntry" ADD CONSTRAINT "AIMemoryEntry_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "AIMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionItem" ADD CONSTRAINT "MissionItem_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "DailyMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
