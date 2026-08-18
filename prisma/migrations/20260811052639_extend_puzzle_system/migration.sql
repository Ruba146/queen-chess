-- AlterTable
ALTER TABLE "Puzzle" ADD COLUMN     "solveCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "puzzleHighestRating" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "puzzleRating" INTEGER NOT NULL DEFAULT 1000;

-- CreateTable
CREATE TABLE "UserPuzzleRatingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "change" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL DEFAULT 'puzzle_completion',
    "puzzleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPuzzleRatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPuzzleThemeStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solved" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTime" INTEGER NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPlayed" TIMESTAMP(3),

    CONSTRAINT "UserPuzzleThemeStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'tactics',
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "bonusXP" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyChallenge" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'tactics',
    "difficulty" TEXT NOT NULL DEFAULT 'advanced',
    "bonusXP" INTEGER NOT NULL DEFAULT 200,
    "description" TEXT NOT NULL DEFAULT 'Weekly Challenge',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeType" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solveTime" INTEGER DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSurvivalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalPuzzles" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'survival-mode',
    "lastPlayed" TIMESTAMP(3),

    CONSTRAINT "UserSurvivalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPuzzleRatingHistory_userId_idx" ON "UserPuzzleRatingHistory"("userId");

-- CreateIndex
CREATE INDEX "UserPuzzleRatingHistory_userId_createdAt_idx" ON "UserPuzzleRatingHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserPuzzleThemeStats_userId_idx" ON "UserPuzzleThemeStats"("userId");

-- CreateIndex
CREATE INDEX "UserPuzzleThemeStats_userId_mastery_idx" ON "UserPuzzleThemeStats"("userId", "mastery");

-- CreateIndex
CREATE UNIQUE INDEX "UserPuzzleThemeStats_userId_theme_key" ON "UserPuzzleThemeStats"("userId", "theme");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyChallenge_weekStart_key" ON "WeeklyChallenge"("weekStart");

-- CreateIndex
CREATE INDEX "UserChallengeCompletion_userId_idx" ON "UserChallengeCompletion"("userId");

-- CreateIndex
CREATE INDEX "UserChallengeCompletion_userId_challengeType_idx" ON "UserChallengeCompletion"("userId", "challengeType");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallengeCompletion_userId_challengeType_challengeId_key" ON "UserChallengeCompletion"("userId", "challengeType", "challengeId");

-- CreateIndex
CREATE INDEX "UserSurvivalRecord_userId_idx" ON "UserSurvivalRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSurvivalRecord_userId_category_key" ON "UserSurvivalRecord"("userId", "category");

-- AddForeignKey
ALTER TABLE "UserPuzzleRatingHistory" ADD CONSTRAINT "UserPuzzleRatingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPuzzleThemeStats" ADD CONSTRAINT "UserPuzzleThemeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeCompletion" ADD CONSTRAINT "UserChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSurvivalRecord" ADD CONSTRAINT "UserSurvivalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
