const { spawn } = require('child_process');
const path = require('path');
const { Chess } = require('chess.js');

const sfPath = path.join(__dirname, 'node_modules/stockfish/bin/stockfish.js');
const worker = spawn(process.execPath, [sfPath], { stdio: ['pipe', 'pipe', 'inherit'] });

worker.stdout.on('data', (buf) => {
  const lines = buf.toString().split('\n').filter((l) => l.trim());
  for (const line of lines) {
    console.log('SF:', line);
  }
});

worker.on('exit', (code) => {
  console.log('SF exited:', code);
});

worker.stdin.write('uci\n');
worker.stdin.write('isready\n');

setTimeout(() => {
  const chess = new Chess();
  for (let i = 0; i < 10; i++) {
    const moves = chess.moves({ verbose: true });
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    chess.move(randomMove.san);
  }
  const fen = chess.fen();
  console.log('\nAnalyzing FEN:', fen);
  worker.stdin.write('setoption name MultiPV value 2\n');
  worker.stdin.write('position fen ' + fen + '\n');
  worker.stdin.write('go depth 12\n');
}, 1000);

setTimeout(() => {
  worker.kill('SIGTERM');
  process.exit(0);
}, 15000);
