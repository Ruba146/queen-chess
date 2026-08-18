require("dotenv").config();
const prisma = require("./src/config/prisma");

async function test() {
  const start = Date.now();
  const puzzles = await prisma.puzzle.findMany({
    where: { category: "mate-in-1" },
    take: 200,
    orderBy: { createdAt: "asc" },
  });
  const q1 = Date.now();
  console.log("findMany:", q1 - start, "ms, results:", puzzles.length);

  const puzzleIds = puzzles.map((p) => p.id);
  const progress = await prisma.userPuzzleProgress.findMany({
    where: { userId: "cms57s39e0000r0ggvuu7qxd4", puzzleId: { in: puzzleIds } },
  });
  const q2 = Date.now();
  console.log("findMany progress:", q2 - q1, "ms, results:", progress.length);
  console.log("Total:", q2 - start, "ms");
}

test()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
