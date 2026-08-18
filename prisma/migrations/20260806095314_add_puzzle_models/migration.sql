-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL,
    "fen" TEXT NOT NULL,
    "solution" TEXT[],
    "theme" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "explanation" TEXT,
    "hint" TEXT,
    "evaluation" TEXT,
    "goal" TEXT NOT NULL DEFAULT 'Find the best move',
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPuzzleProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPuzzleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPuzzleCollectionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "totalPuzzles" INTEGER NOT NULL DEFAULT 0,
    "completedPuzzles" INTEGER NOT NULL DEFAULT 0,
    "currentPuzzleIndex" INTEGER NOT NULL DEFAULT 0,
    "accuracy" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "lastPlayed" TIMESTAMP(3),
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPuzzleCollectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Puzzle_category_idx" ON "Puzzle"("category");

-- CreateIndex
CREATE INDEX "Puzzle_theme_idx" ON "Puzzle"("theme");

-- CreateIndex
CREATE INDEX "Puzzle_difficulty_idx" ON "Puzzle"("difficulty");

-- CreateIndex
CREATE INDEX "Puzzle_generatedByAI_idx" ON "Puzzle"("generatedByAI");

-- CreateIndex
CREATE INDEX "UserPuzzleProgress_userId_idx" ON "UserPuzzleProgress"("userId");

-- CreateIndex
CREATE INDEX "UserPuzzleProgress_userId_completed_idx" ON "UserPuzzleProgress"("userId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "UserPuzzleProgress_userId_puzzleId_key" ON "UserPuzzleProgress"("userId", "puzzleId");

-- CreateIndex
CREATE INDEX "UserPuzzleCollectionProgress_userId_idx" ON "UserPuzzleCollectionProgress"("userId");

-- CreateIndex
CREATE INDEX "UserPuzzleCollectionProgress_userId_lastPlayed_idx" ON "UserPuzzleCollectionProgress"("userId", "lastPlayed");

-- CreateIndex
CREATE UNIQUE INDEX "UserPuzzleCollectionProgress_userId_category_key" ON "UserPuzzleCollectionProgress"("userId", "category");

-- AddForeignKey
ALTER TABLE "UserPuzzleProgress" ADD CONSTRAINT "UserPuzzleProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPuzzleProgress" ADD CONSTRAINT "UserPuzzleProgress_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPuzzleCollectionProgress" ADD CONSTRAINT "UserPuzzleCollectionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
