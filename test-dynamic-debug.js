require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Chess } = require('chess.js');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected\n');

    const { StockfishClient, parseInfoLine, generateRandomFEN, detectTactic, verifyPuzzleSolution } = require('./src/services/stockfishPuzzleGenerator');
    
    console.log('Test 1: Generate random FEN');
    const fen = generateRandomFEN(10);
    console.log('Random FEN:', fen);
    
    const chess = new Chess(fen);
    console.log('Legal moves:', chess.moves().length);
    console.log('Turn:', chess.turn());
    
    console.log('\nTest 2: Spawn Stockfish');
    const client = new StockfishClient();
    const ok = client.init();
    console.log('Stockfish init:', ok);
    
    if (ok) {
      console.log('\nTest 3: Analyze position');
      const analysis = await require('./src/services/stockfishPuzzleGenerator').analyzePosition(fen, 8, 3);
      console.log('Analysis results:', analysis ? analysis.length : 0);
      if (analysis && analysis.length > 0) {
        analysis.forEach((a, i) => {
          console.log(`  ${i + 1}. Move: ${a.move}, Score: ${a.score}, MateIn: ${a.mateIn}, Depth: ${a.depth}`);
        });
      }
      
      console.log('\nTest 4: Detect tactic');
      const tactic = detectTactic(analysis, 'tactics');
      console.log('Tactic detected:', tactic);
      
      if (tactic) {
        console.log('\nTest 5: Verify solution');
        const verified = await verifyPuzzleSolution(fen, tactic.bestMove);
        console.log('Solution verified:', verified);
      }
      
      client.destroy();
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
