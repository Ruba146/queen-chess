const { spawn } = require('child_process');
const { Chess } = require('chess.js');
const path = require('path');
const puzzleRepository = require('../repositories/puzzleRepository');

class StockfishClient {
  constructor() {
    this.worker = null;
    this.ready = false;
    this.pending = new Map();
    this.searchId = 0;
    this.messageHandlers = [];
    this.closed = false;
  }

  init() {
    if (this.worker) return true;
    const sfPath = path.join(__dirname, '../../node_modules/stockfish/bin/stockfish.js');
    try {
      this.worker = spawn(process.execPath, [sfPath], { stdio: ['pipe', 'pipe', 'inherit'] });
    } catch (err) {
      console.error('[PuzzleGen] Failed to spawn Stockfish:', err.message);
      return false;
    }
    if (!this.worker || !this.worker.pid) {
      console.error('[PuzzleGen] Stockfish process not created');
      return false;
    }
    this.worker.stdout.on('data', (buf) => {
      const lines = buf.toString().split('\n').filter((l) => l.trim());
      for (const line of lines) this._handleLine(line);
    });
    this.worker.on('error', (err) => {
      console.error('[PuzzleGen] Worker error:', err.message);
      this.ready = false;
    });
    this.worker.on('exit', () => {
      this.ready = false;
      if (!this.closed) console.warn('[PuzzleGen] Stockfish exited unexpectedly');
    });
    this.worker.stdin.write('uci\n');
    this.worker.stdin.write('isready\n');
    return true;
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  send(cmd) {
    if (this.worker && this.worker.stdin) {
      this.worker.stdin.write(cmd + '\n');
    }
  }

  go(depth, multipv) {
    const id = ++this.searchId;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.send('stop');
      this.send(`setoption name MultiPV value ${multipv || 3}`);
      this.send(`position fen ${this.fen}`);
      this.send(`go depth ${depth}`);
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          resolve([]);
        }
      }, 12000);
    });
  }

  destroy() {
    this.closed = true;
    if (this.worker) {
      try { this.worker.kill('SIGTERM'); } catch (err) { /* ignore */ }
      this.worker = null;
    }
    this.ready = false;
    this.pending.clear();
    this.messageHandlers = [];
  }

  _handleLine(line) {
    if (line === 'readyok') {
      this.ready = true;
      return;
    }
    if (line.startsWith('bestmove')) {
      for (const [key, resolve] of this.pending) {
        this.pending.delete(key);
        resolve([]);
      }
      return;
    }
    if (line.startsWith('info') && line.includes('score')) {
      for (const handler of this.messageHandlers) {
        try { handler(line); } catch (err) { /* ignore */ }
      }
      return;
    }
  }
}

function parseInfoLine(line) {
  const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
  const pvMatch = line.match(/\bpv\s+(\S+)/);
  const multipvMatch = line.match(/multipv (\d+)/);
  const depthMatch = line.match(/depth (\d+)/);
  if (!scoreMatch || !pvMatch) return null;
  let score = scoreMatch[1] === 'mate' ? (parseInt(scoreMatch[2]) > 0 ? 10000 : -10000) : parseInt(scoreMatch[2]);
  if (scoreMatch[1] === 'mate' && parseInt(scoreMatch[2]) < 0) score = -10000 + parseInt(scoreMatch[2]);
  if (scoreMatch[1] === 'mate' && parseInt(scoreMatch[2]) > 0) score = 10000 - parseInt(scoreMatch[2]);
  return {
    move: pvMatch[1],
    score,
    mateIn: scoreMatch[1] === 'mate' ? parseInt(scoreMatch[2]) : null,
    multipv: multipvMatch ? parseInt(multipvMatch[1]) : 1,
    depth: depthMatch ? parseInt(depthMatch[1]) : 0,
  };
}

async function analyzePosition(fen, depth, multipv) {
  const client = await getSharedClient();
  if (!client) return [];
  const targetDepth = depth || 12;
  const targetMultipv = multipv || 3;

  return new Promise((resolve) => {
    const results = [];
    const collected = new Set();
    let resolved = false;
    let timeout = null;

    const handler = (line) => {
      if (resolved) return;
      const parsed = parseInfoLine(line);
      if (parsed && !collected.has(parsed.multipv)) {
        collected.add(parsed.multipv);
        results.push(parsed);
        if (results.length >= targetMultipv) {
          resolved = true;
          if (timeout) clearTimeout(timeout);
          client.messageHandlers = client.messageHandlers.filter((h) => h !== handler);
          client.send('stop');
          resolve(results);
        }
      }
    };

    client.onMessage(handler);
    client.fen = fen;
    client.go(targetDepth, targetMultipv);

    timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.messageHandlers = client.messageHandlers.filter((h) => h !== handler);
        resolve(results);
      }
    }, 15000);
  });
}

async function verifyPuzzleSolution(fen, solutionSan) {
  try {
    const chess = new Chess(fen);
    const san = typeof solutionSan === 'string' ? solutionSan : (solutionSan[0] || '');
    const move = chess.move(san);
    if (!move) return false;

    const afterFen = chess.fen();
    let analysis;
    try {
      analysis = await analyzePosition(afterFen, 10, 2);
    } catch {
      analysis = null;
    }

    if (!analysis || analysis.length === 0) {
      return chess.in_checkmate() || chess.in_check();
    }

    const bestAfter = analysis[0];
    const isCheckmate = bestAfter.mateIn !== null && bestAfter.mateIn !== undefined && Math.abs(bestAfter.mateIn) <= 2;
    const isWinning = bestAfter.score >= 800;
    const hasLargeGap = analysis.length >= 2 && (bestAfter.score - (analysis[1]?.score ?? 0)) >= 150;

    if (isCheckmate) return true;
    if (isWinning && hasLargeGap) return true;

    return false;
  } catch (err) {
    return false;
  }
}

let sharedClient = null;

async function getSharedClient() {
  if (!sharedClient || (sharedClient.worker && sharedClient.worker.exitCode !== null)) {
    sharedClient = new StockfishClient();
    const ok = sharedClient.init();
    if (!ok) {
      sharedClient = null;
      return null;
    }
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!sharedClient.ready) {
          sharedClient.destroy();
          sharedClient = null;
          resolve(false);
        }
      }, 5000);
      const check = () => {
        if (sharedClient.ready) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
  return sharedClient;
}

function classifyDifficulty(depth, evaluation, branchingFactor, candidateMoves) {
  const depthScore = Math.min(depth / 20, 1);
  const evalScore = Math.min(Math.abs(evaluation) / 1000, 1);
  const branchScore = Math.min((branchingFactor || 0) / 20, 1);
  const candidateScore = Math.min((candidateMoves || 0) / 5, 1);

  const composite = (depthScore * 0.4 + evalScore * 0.3 + branchScore * 0.15 + candidateScore * 0.15);

  if (composite < 0.25) return 'Easy';
  if (composite < 0.5) return 'Medium';
  if (composite < 0.75) return 'Hard';
  return 'Expert';
}

function detectTactic(analysis, requiredTheme) {
  if (!analysis || analysis.length < 2) return null;

  const best = analysis[0];
  const second = analysis[1];
  const gap = second ? Math.abs(best.score - second.score) : 0;
  const candidateMoves = analysis.length;
  const branchingFactor = candidateMoves;

  if (requiredTheme && requiredTheme.startsWith('mate-in-')) {
    if (best.score < 9000 && best.score > -9000) return null;
    const mateDepth = best.mateIn !== null && best.mateIn !== undefined ? Math.abs(best.mateIn) : Math.max(1, Math.floor(best.depth / 2));
    let theme = 'mate-in-1';
    if (mateDepth >= 3) theme = 'mate-in-3';
    else if (mateDepth >= 2) theme = 'mate-in-2';
    const difficulty = classifyDifficulty(best.depth, best.score, branchingFactor, candidateMoves);
    return {
      theme,
      bestMove: best.move,
      rating: theme === 'mate-in-1' ? 600 : theme === 'mate-in-2' ? 900 : 1300,
      goal: `Find the forced ${theme.replace('mate-in-', 'mate in ')}.`,
      difficulty,
      depth: best.depth,
      evaluation: best.score,
      branchingFactor,
      candidateMoves,
    };
  }

  if (best.score >= 10000 || best.score <= -10000) {
    const difficulty = classifyDifficulty(best.depth, best.score, branchingFactor, candidateMoves);
    return {
      theme: requiredTheme || 'tactics',
      bestMove: best.move,
      rating: 1200,
      goal: 'Find the forced mate.',
      difficulty,
      depth: best.depth,
      evaluation: best.score,
      branchingFactor,
      candidateMoves,
    };
  }

  if (gap >= 100) {
    let theme = requiredTheme || 'tactics';

    if (requiredTheme === 'fork' || (!requiredTheme && gap >= 200 && candidateMoves <= 3)) {
      theme = 'fork';
    } else if (requiredTheme === 'pin' || (!requiredTheme && best.move && best.move.includes('B') && gap >= 150)) {
      theme = 'pin';
    } else if (requiredTheme === 'skewer' || (!requiredTheme && best.move && best.move.includes('R') && gap >= 150)) {
      theme = 'skewer';
    } else if (requiredTheme === 'double-attack' || (!requiredTheme && gap >= 300)) {
      theme = 'double-attack';
    } else if (requiredTheme === 'deflection' || (!requiredTheme && gap >= 180 && candidateMoves <= 4)) {
      theme = 'deflection';
    } else if (requiredTheme === 'removing-the-defender' || (!requiredTheme && best.move && best.move.includes('x') && gap >= 150)) {
      theme = 'removing-the-defender';
    } else if (requiredTheme === 'discovered-attack' || (!requiredTheme && gap >= 120 && candidateMoves >= 3)) {
      theme = 'discovered-attack';
    } else if (requiredTheme === 'back-rank-mate' || (!requiredTheme && best.score >= 9000)) {
      theme = 'back-rank-mate';
    } else if (requiredTheme === 'decoy' || (!requiredTheme && gap >= 200)) {
      theme = 'decoy';
    } else if (requiredTheme === 'attraction' || (!requiredTheme && gap >= 180)) {
      theme = 'attraction';
    }

    const difficulty = classifyDifficulty(best.depth, best.score, branchingFactor, candidateMoves);
    return {
      theme,
      bestMove: best.move,
      rating: Math.min(1800, Math.max(800, Math.abs(best.score) + 600)),
      goal: `Find the strongest ${theme.replace('-', ' ')} move.`,
      difficulty,
      depth: best.depth,
      evaluation: best.score,
      branchingFactor,
      candidateMoves,
    };
  }

  return null;
}

function isLegalFEN(fen) {
  try {
    const chess = new Chess(fen);
    return chess.fen() === fen;
  } catch {
    return false;
  }
}

function calculateBranchingFactor(fen) {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    return moves.length;
  } catch {
    return 0;
  }
}

async function validatePuzzleQuality(fen, solutionSan, theme) {
  try {
    if (!isLegalFEN(fen)) {
      return { valid: false, reason: 'illegal-fen' };
    }

    const chess = new Chess(fen);
    const san = typeof solutionSan === 'string' ? solutionSan : (solutionSan[0] || '');
    const move = chess.move(san);
    if (!move) return { valid: false, reason: 'illegal-move' };

    const afterFen = chess.fen();
    const client = await getSharedClient();
    if (!client) return { valid: false, reason: 'no-engine' };

    let analysis;
    try {
      analysis = await analyzePosition(afterFen, 18, 3);
    } catch {
      return { valid: false, reason: 'analysis-failed' };
    }

    if (!analysis || analysis.length < 2) {
      return { valid: false, reason: 'insufficient-analysis' };
    }

    const best = analysis[0];
    if (best.depth < 18) {
      return { valid: false, reason: 'depth-too-low', depth: best.depth };
    }

    const second = analysis[1];
    const gap = second ? Math.abs(best.score - second.score) : 0;
    if (gap < 80) {
      return { valid: false, reason: 'no-clear-best-move', gap };
    }

    const isCheckmate = best.mateIn !== null && best.mateIn !== undefined;
    const isWinning = best.score >= 400;
    if (!isCheckmate && !isWinning) {
      return { valid: false, reason: 'not-winning', score: best.score };
    }

    const branchingFactor = calculateBranchingFactor(fen);
    if (branchingFactor > 25) {
      return { valid: false, reason: 'branching-factor-too-high', branchingFactor };
    }

    const stableEvaluation = gap >= 80 && best.depth >= 18;

    return {
      valid: true,
      analysis,
      depth: best.depth,
      score: best.score,
      gap,
      branchingFactor,
      stableEvaluation,
    };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

function generateRandomFEN(numPly) {
  const chess = new Chess();
  const maxPly = numPly || 10;
  for (let i = 0; i < maxPly; i++) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) break;
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    chess.move(randomMove.san);
  }
  return chess.fen();
}


async function tryGenerateDynamicPuzzle(category, theme, diff, excludeFens) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const numPly = 10 + Math.floor(Math.random() * 10);
    const fen = generateRandomFEN(numPly);

    if (excludeFens.includes(fen)) continue;

    let analysis;
    try {
      analysis = await analyzePosition(fen, 14, 2);
    } catch {
      continue;
    }
    if (!analysis || analysis.length < 2) {
      console.log(`[PuzzleGen] Attempt ${attempt + 1}: insufficient analysis (${analysis ? analysis.length : 0} results)`);
      continue;
    }

    const tactic = detectTactic(analysis, theme);
    if (!tactic) {
      const gap = analysis[1] ? Math.abs(analysis[0].score - analysis[1].score) : 0;
      console.log(`[PuzzleGen] Attempt ${attempt + 1}: no tactic. Best: ${analysis[0].score} (${analysis[0].move}), Gap: ${gap}`);
      continue;
    }

    const solutionSan = tactic.bestMove;
    const puzzleTheme = tactic.theme || theme;

    try {
      const existing = await puzzleRepository.getPuzzleByFenSolutionTheme(fen, [solutionSan], puzzleTheme);
      if (existing) {
        console.log(`[PuzzleGen] Attempt ${attempt + 1}: duplicate puzzle found (fen+move+theme)`);
        continue;
      }
    } catch {
      // ignore if method unavailable
    }

    const validation = await validatePuzzleQuality(fen, solutionSan, puzzleTheme);
    if (!validation.valid) {
      console.log(`[PuzzleGen] Attempt ${attempt + 1}: validation failed - ${validation.reason}`);
      continue;
    }

    return {
      fen,
      solution: [solutionSan],
      theme: puzzleTheme,
      category,
      difficulty: tactic.difficulty || diff,
      rating: tactic.rating || 1000,
      goal: tactic.goal || 'Find the best move',
      generatedByAI: true,
      completed: false,
      attempts: 0,
      evaluation: validation.score,
      depth: validation.depth,
      branchingFactor: validation.branchingFactor,
      candidateMoves: analysis.length,
    };
  }
  console.log('[PuzzleGen] Dynamic generation exhausted after 100 attempts');
  return null;
}

async function transformExistingPuzzle(category, theme, diff, excludeFens) {
  try {
    const existingPuzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 50 });
    const shuffled = existingPuzzles.sort(() => Math.random() - 0.5);

    for (const basePuzzle of shuffled) {
      if (excludeFens.includes(basePuzzle.fen)) continue;

      const chess = new Chess(basePuzzle.fen);
      const numMoves = 1 + Math.floor(Math.random() * 3);

      for (let m = 0; m < numMoves; m++) {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) break;
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        chess.move(randomMove.san);
      }

      const newFen = chess.fen();
      if (excludeFens.includes(newFen)) continue;

      try {
        const existing = await puzzleRepository.getPuzzleByFen(newFen);
        if (existing) continue;
      } catch {
        // ignore
      }

      let analysis;
      try {
        analysis = await analyzePosition(newFen, 14, 2);
      } catch {
        continue;
      }
      if (!analysis || analysis.length < 2) continue;

      const tactic = detectTactic(analysis, theme);
      if (!tactic) {
        const gap = analysis[1] ? Math.abs(analysis[0].score - analysis[1].score) : 0;
        console.log(`[PuzzleGen] Transform: no tactic from ${basePuzzle.id}. Best: ${analysis[0].score}, Gap: ${gap}`);
        continue;
      }

      const solutionSan = tactic.bestMove;
      const puzzleTheme = tactic.theme || theme;

      try {
        const existing = await puzzleRepository.getPuzzleByFenSolutionTheme(newFen, [solutionSan], puzzleTheme);
        if (existing) {
          console.log(`[PuzzleGen] Transform: duplicate puzzle found (fen+move+theme)`);
          continue;
        }
      } catch {
        // ignore
      }

      const verified = await verifyPuzzleSolution(newFen, solutionSan);
      if (!verified) {
        console.log(`[PuzzleGen] Transform: verification failed for ${solutionSan}`);
        continue;
      }

      const validation = await validatePuzzleQuality(newFen, solutionSan, puzzleTheme);
      if (!validation.valid) {
        console.log(`[PuzzleGen] Transform: validation failed - ${validation.reason}`);
        continue;
      }

      return {
        fen: newFen,
        solution: [solutionSan],
        theme: puzzleTheme,
        category,
        difficulty: tactic.difficulty || diff,
        rating: tactic.rating || 1000,
        goal: tactic.goal || 'Find the best move',
        generatedByAI: true,
        completed: false,
        attempts: 0,
        evaluation: validation.score,
        depth: validation.depth,
        branchingFactor: validation.branchingFactor,
        candidateMoves: analysis.length,
      };
    }
  } catch (err) {
    console.error('[PuzzleGen] Transform error:', err.message);
  }
  console.log('[PuzzleGen] Transform exhausted');
  return null;
}

const PUZZLE_POOL = [
  { fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', solution: ['Re8#'], theme: 'mate-in-1', difficulty: 'Beginner', rating: 600, goal: 'Deliver checkmate in one move.' },
  { fen: '8/8/8/3k4/8/2K5/4P3/8 w - - 0 1', solution: ['Kd3'], theme: 'mate-in-1', difficulty: 'Beginner', rating: 500, goal: 'Support the pawn with your king.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], theme: 'mate-in-1', difficulty: 'Beginner', rating: 800, goal: 'Find the winning tactic.' },
  { fen: '8/8/8/8/8/8/5K2/4R1k1 w - - 0 1', solution: ['Re2'], theme: 'mate-in-1', difficulty: 'Beginner', rating: 700, goal: 'Use the box method technique.' },
  { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5', solution: ['Bg5'], theme: 'mate-in-2', difficulty: 'Intermediate', rating: 900, goal: 'Pin and prepare the mating net.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3', solution: ['Ng5'], theme: 'mate-in-2', difficulty: 'Intermediate', rating: 900, goal: 'Find the forced mate in two.' },
  { fen: 'r1b2rk1/pppp1ppp/2n2q2/2b5/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 5 6', solution: ['Bg5'], theme: 'mate-in-3', difficulty: 'Advanced', rating: 1300, goal: 'Calculate the deep mating sequence.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], theme: 'mate-in-3', difficulty: 'Advanced', rating: 1400, goal: 'Find the winning combination.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3', solution: ['Ng5'], theme: 'fork', difficulty: 'Intermediate', rating: 700, goal: 'Fork the queen and rook.' },
  { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5', solution: ['Bg5'], theme: 'pin', difficulty: 'Intermediate', rating: 1100, goal: 'Pin the knight to the queen.' },
  { fen: '4k3/5ppp/8/8/8/8/5PPP/4RK2 w - - 0 1', solution: ['Re1'], theme: 'skewer', difficulty: 'Beginner', rating: 900, goal: 'Skewer the king and rook.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 2 3', solution: ['Qf6'], theme: 'double-attack', difficulty: 'Beginner', rating: 800, goal: 'Attack two pieces at once.' },
  { fen: 'r1b1kb1r/pppp1ppp/2n2q2/4p3/2B1n3/5N2/PPPP1PPP/RNBQR1K1 w kq - 4 5', solution: ['Rxe4'], theme: 'deflection', difficulty: 'Intermediate', rating: 1100, goal: 'Deflect the knight from defending the queen.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3', solution: ['Bxf7+'], theme: 'removing-the-defender', difficulty: 'Intermediate', rating: 1150, goal: 'Remove the defender to win material.' },
  { fen: '8/8/8/8/8/8/5K2/3Q2k1 w - - 0 1', solution: ['Qd2'], theme: 'endgame', difficulty: 'Beginner', rating: 600, goal: 'Drive the king to the edge with queen and king.' },
  { fen: '8/4k3/8/3P4/8/8/4K3/8 w - - 0 1', solution: ['Kd3'], theme: 'endgame', difficulty: 'Beginner', rating: 700, goal: 'Support the pawn with your king to promote it.' },
  { fen: '8/2k5/8/8/8/8/5K2/3R4 w - - 0 1', solution: ['Rd1'], theme: 'endgame', difficulty: 'Advanced', rating: 1400, goal: 'Build a bridge to win the rook endgame.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['O-O'], theme: 'opening', difficulty: 'Beginner', rating: 800, goal: 'Castle to safety in the opening.' },
  { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3', solution: ['d4'], theme: 'opening', difficulty: 'Intermediate', rating: 1000, goal: 'Fight for the center with d4.' },
  { fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6', solution: ['Ng5'], theme: 'middlegame', difficulty: 'Intermediate', rating: 1100, goal: 'Find the best attacking move in the middlegame.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3', solution: ['Ng5'], theme: 'middlegame', difficulty: 'Intermediate', rating: 1000, goal: 'Create threats in the middlegame.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Ng5'], theme: 'best-move', difficulty: 'Intermediate', rating: 1200, goal: 'Find the strongest move.' },
  { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5', solution: ['Bg5'], theme: 'best-move', difficulty: 'Intermediate', rating: 1100, goal: 'Choose the best continuation.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], theme: 'best-move', difficulty: 'Intermediate', rating: 1200, goal: 'Find the best move to equalize.' },
  { fen: 'r1bq1rk1/ppp2ppp/2np4/2b1p1B1/2B1P3/3P1N2/PPP2PPP/R2Q1RK1 w - - 0 9', solution: ['Bxf6'], theme: 'defensive', difficulty: 'Advanced', rating: 1300, goal: 'Find the best defensive resource.' },
  { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5', solution: ['Bg5'], theme: 'defensive', difficulty: 'Intermediate', rating: 1000, goal: 'Defend against the tactical threat.' },
  { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Ng5'], theme: 'master-games', difficulty: 'Advanced', rating: 1400, goal: 'Find the master-level move.' },
  { fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 6 6', solution: ['Ng5'], theme: 'master-games', difficulty: 'Advanced', rating: 1500, goal: 'Find the grandmaster-level move.' },
];

const CATEGORY_THEME_MAP = {
  'mate-in-1': 'mate-in-1',
  'mate-in-2': 'mate-in-2',
  'mate-in-3': 'mate-in-3',
  'tactics': 'tactics',
  'endgames': 'endgame',
  'openings': 'opening',
  'middlegame': 'middlegame',
  'best-move': 'best-move',
  'defensive-move': 'defensive',
  'master-games': 'master-games',
  'survival-mode': 'tactics',
  'daily-challenge': 'tactics',
  'weekly-challenge': 'tactics',
  'ai-challenge': 'middlegame',
};

const CATEGORY_DIFFICULTY_MAP = {
  'mate-in-1': 'Beginner',
  'mate-in-2': 'Intermediate',
  'mate-in-3': 'Advanced',
  'tactics': 'Intermediate',
  'endgames': 'Intermediate',
  'openings': 'Beginner',
  'middlegame': 'Intermediate',
  'best-move': 'Intermediate',
  'defensive-move': 'Advanced',
  'master-games': 'Expert',
  'survival-mode': 'Intermediate',
  'daily-challenge': 'Intermediate',
  'weekly-challenge': 'Advanced',
  'ai-challenge': 'Advanced',
};

let engineReady = false;

async function ensureEngine() {
  if (engineReady) return true;
  try {
    const client = new StockfishClient();
    const ok = client.init();
    if (ok) {
      await new Promise((resolve) => {
        const check = () => {
          if (client.ready) { engineReady = true; client.destroy(); resolve(true); }
          else setTimeout(check, 100);
        };
        check();
      });
    }
  } catch (err) {
    console.warn('[PuzzleGen] Engine warm-up failed:', err.message);
  }
  return engineReady;
}

async function createPuzzle(data) {
  return puzzleRepository.createPuzzle(data);
}

async function getUnusedCandidates(theme, excludeIds, excludeFens) {
  const excludeFenSet = new Set(excludeFens);
  const filtered = PUZZLE_POOL.filter((p) => {
    if (excludeIds.includes(p.fen)) return false;
    if (excludeFenSet.has(p.fen)) return false;
    return p.theme === theme || (theme === 'tactics' && ['fork', 'pin', 'skewer', 'double-attack', 'deflection', 'removing-the-defender'].includes(p.theme));
  });
  if (filtered.length > 0) {
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }
  const fallback = PUZZLE_POOL.filter((p) => !excludeIds.includes(p.fen) && !excludeFenSet.has(p.fen));
  if (fallback.length > 0) {
    const shuffled = fallback.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }
  return [];
}

async function generateAIPuzzle(category, difficulty, excludeIds) {
  excludeIds = excludeIds || [];
  const theme = CATEGORY_THEME_MAP[category] || 'tactics';
  const diff = difficulty || CATEGORY_DIFFICULTY_MAP[category] || 'Intermediate';

  const existingPuzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 1000 });
  const existingFens = existingPuzzles.map((p) => p.fen);
  const allExcludeFens = [...new Set([...existingFens, ...(excludeIds.filter(id => id && id.length > 10 && id.includes('/')))])];

  console.log(`[PuzzleGen] Generating puzzle for category=${category}, theme=${theme}`);

  const dynamicPuzzle = await tryGenerateDynamicPuzzle(category, theme, diff, allExcludeFens);
  if (dynamicPuzzle) {
    try {
      const validation = await validatePuzzleQuality(dynamicPuzzle.fen, dynamicPuzzle.solution[0], dynamicPuzzle.theme);
      if (!validation.valid) {
        console.log(`[PuzzleGen] Dynamic puzzle rejected by validation: ${validation.reason}`);
      } else {
        const created = await puzzleRepository.createPuzzle(dynamicPuzzle);
        console.log(`[PuzzleGen] Dynamic puzzle created: ${created.id}`);
        return { ...created, isNew: true };
      }
    } catch (err) {
      console.error('[PuzzleGen] Failed to validate/create dynamic puzzle:', err.message);
    }
  }

  console.log(`[PuzzleGen] Dynamic generation failed, trying transform...`);
  const transformedPuzzle = await transformExistingPuzzle(category, theme, diff, allExcludeFens);
  if (transformedPuzzle) {
    try {
      const validation = await validatePuzzleQuality(transformedPuzzle.fen, transformedPuzzle.solution[0], transformedPuzzle.theme);
      if (!validation.valid) {
        console.log(`[PuzzleGen] Transformed puzzle rejected by validation: ${validation.reason}`);
      } else {
        const created = await puzzleRepository.createPuzzle(transformedPuzzle);
        console.log(`[PuzzleGen] Transformed puzzle created: ${created.id}`);
        return { ...created, isNew: true };
      }
    } catch (err) {
      console.error('[PuzzleGen] Failed to validate/create transformed puzzle:', err.message);
    }
  }

  console.log(`[PuzzleGen] Transform failed, falling back to PUZZLE_POOL...`);
  const candidates = await getUnusedCandidates(theme, excludeIds, allExcludeFens);
  for (const candidate of candidates) {
    const verified = await verifyPuzzleSolution(candidate.fen, candidate.solution[0]);
    if (verified) {
      const puzzleData = {
        fen: candidate.fen,
        solution: candidate.solution,
        theme: candidate.theme || theme,
        category,
        difficulty: candidate.difficulty || diff,
        rating: candidate.rating || 1000,
        goal: candidate.goal || 'Find the best move',
        generatedByAI: true,
        completed: false,
        attempts: 0,
      };
      try {
        const validation = await validatePuzzleQuality(candidate.fen, candidate.solution[0], candidate.theme || theme);
        if (!validation.valid) {
          console.log(`[PuzzleGen] Pool puzzle rejected by validation: ${validation.reason}`);
          continue;
        }
        const created = await puzzleRepository.createPuzzle(puzzleData);
        console.log(`[PuzzleGen] Pool puzzle created: ${created.id}`);
        return { ...created, isNew: true };
      } catch (err) {
        console.error('[PuzzleGen] Failed to create pool puzzle:', err.message);
      }
    }
  }
  console.log('[PuzzleGen] All generation methods exhausted');
  return null;
}

async function ensureCategoryHasPuzzles(category, minCount = 20) {
  const count = await puzzleRepository.countPuzzlesByCategory(category);
  if (count >= minCount) return Promise.resolve();

  const existingPuzzles = await puzzleRepository.getPuzzlesByCategory(category, { take: 1000 });
  const existingFens = new Set(existingPuzzles.map((p) => p.fen));
  const existingIds = existingPuzzles.map((p) => p.id);
  const theme = CATEGORY_THEME_MAP[category] || 'tactics';
  const diff = CATEGORY_DIFFICULTY_MAP[category] || 'Intermediate';

  const target = minCount - count;

  return (async () => {
    let generated = 0;
    for (let attempt = 0; attempt < target * 10 && generated < target; attempt++) {
      try {
        const puzzle = await generateAIPuzzle(category, diff, existingIds);
        if (puzzle) {
          existingFens.add(puzzle.fen);
          existingIds.push(puzzle.id);
          generated++;
        }
      } catch (err) {
        console.error('[PuzzleGen] Background generation error:', err.message);
      }
    }
    console.log(`[PuzzleGen] Background ensured ${category} has ${count + generated} puzzles (target: ${minCount})`);
    return generated;
  })();
}

module.exports = {
  StockfishClient,
  analyzePosition,
  verifyPuzzleSolution,
  classifyDifficulty,
  generateRandomFEN,
  detectTactic,
  validatePuzzleQuality,
  isLegalFEN,
  calculateBranchingFactor,
  tryGenerateDynamicPuzzle,
  transformExistingPuzzle,
  generateAIPuzzle,
  ensureCategoryHasPuzzles,
  PUZZLE_POOL,
  CATEGORY_THEME_MAP,
  CATEGORY_DIFFICULTY_MAP,
  ensureEngine,
  createPuzzle,
};
