const { spawn } = require('child_process');
const path = require('path');
const { Chess } = require('chess.js');

const sfPath = path.join(__dirname, 'node_modules/stockfish/bin/stockfish.js');

function createClient() {
  const worker = spawn(process.execPath, [sfPath], { stdio: ['pipe', 'pipe', 'inherit'] });
  let ready = false;
  const pending = new Map();
  let searchId = 0;
  const messageHandlers = [];

  worker.stdout.on('data', (buf) => {
    const lines = buf.toString().split('\n').filter((l) => l.trim());
    for (const line of lines) {
      if (line === 'readyok') {
        ready = true;
        continue;
      }
      if (line.startsWith('bestmove')) {
        for (const [, resolve] of pending) {
          pending.delete(resolve);
          resolve([]);
        }
        continue;
      }
      if (line.startsWith('info') && line.includes('score')) {
        for (const handler of messageHandlers) {
          try { handler(line); } catch (err) { /* ignore */ }
        }
      }
    }
  });

  return {
    send(cmd) { worker.stdin.write(cmd + '\n'); },
    onMessage(handler) { messageHandlers.push(handler); },
    go(depth, multipv) {
      const id = ++searchId;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        this.send('stop');
        this.send(`setoption name MultiPV value ${multipv || 3}`);
        this.send('position fen r1bqkb1r/p1p1p1pp/n2p1p1n/1P4B1/8/3P2P1/PP2PP1P/RN1QKBNR w KQkq - 0 6');
        this.send(`go depth ${depth}`);
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            resolve([]);
          }
        }, 12000);
      });
    },
    destroy() {
      worker.kill('SIGTERM');
    },
    get isReady() { return ready; }
  };
}

async function main() {
  const client = createClient();
  
  await new Promise((resolve) => {
    client.send('uci');
    client.send('isready');
    const check = setInterval(() => {
      if (client.isReady) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });

  console.log('Stockfish ready\n');

  const results = [];
  const collected = new Set();

  client.onMessage((line) => {
    console.log('RAW LINE:', line);
    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = line.match(/pv (\S+)/);
    const multipvMatch = line.match(/multipv (\d+)/);
    const depthMatch = line.match(/depth (\d+)/);
    if (!scoreMatch || !pvMatch) {
      console.log('SKIPPED - no score or pv');
      return;
    }
    
    const move = pvMatch[1];
    const score = scoreMatch[1] === 'mate' ? 10000 : parseInt(scoreMatch[2]);
    const multipv = multipvMatch ? parseInt(multipvMatch[1]) : 1;
    const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
    
    if (!collected.has(multipv)) {
      collected.add(multipv);
      results.push({ move, score, multipv, depth });
      console.log(`Parsed: move=${move}, score=${score}, multipv=${multipv}, depth=${depth}`);
    }
  });

  await client.go(12, 3);
  client.destroy();

  console.log('\nFinal results:', results);
}

main();
