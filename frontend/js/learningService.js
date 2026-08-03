import { initEngine, postEngineMessage, stopEngine } from './stockfish.js';
import { apiFetch } from './utils.js';

const STOCKFISH_TIMEOUT_MS = 4500;

let evalQueue = Promise.resolve();

// Track if Stockfish has been successfully initialized
let stockfishAvailable = null; // null = unknown, true/false = known

function isStockfishAvailable() {
  if (stockfishAvailable !== null) return stockfishAvailable;
  try {
    // Quick check if Web Workers + Stockfish are available
    if (typeof Worker === 'undefined') {
      stockfishAvailable = false;
      return false;
    }
    stockfishAvailable = true;
    return true;
  } catch {
    stockfishAvailable = false;
    return false;
  }
}

let stockfishStuck = false;

export function evaluateFen(fen, depth = 8) {
  // If Stockfish is not available, return default evaluation immediately
  if (!isStockfishAvailable() || stockfishStuck) {
    return Promise.resolve({ score: 0, bestmove: null, mate: null });
  }

  // Create a new promise that doesn't depend on the potentially-blocked queue
  // The evalQueue can get permanently stuck if Stockfish never initializes
  // (e.g. in headless browser mode). We use a fresh Promise.race with timeout.
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // Mark as stuck so subsequent calls return immediately
      stockfishStuck = true;
      resolve({ score: 0, bestmove: null, mate: null });
    }, 2000);

    runStockfishEvaluation(fen, depth).then(result => {
      clearTimeout(timeout);
      resolve(result);
    }).catch(() => {
      clearTimeout(timeout);
      stockfishStuck = true;
      resolve({ score: 0, bestmove: null, mate: null });
    });
  });
}

/**
 * Fetch an AI-generated opening move explanation from the backend.
 * The backend combines Stockfish evaluations + LLM (or rule-based fallback).
 */
export async function generateMoveExplanation({ move, fenBefore, fenAfter, evalBefore, evalAfter, metadata, rating = 1200 }) {
  try {
    const response = await apiFetch('/api/ai/explain/opening', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metadata?.name || 'Opening',
        eco: metadata?.eco || 'N/A',
        category: metadata?.category || 'N/A',
        difficulty: metadata?.difficulty || 'Beginner',
        moves: metadata?.moves || [],
        fen: fenAfter || fenBefore || 'start',
        evalBefore: { score: evalBefore?.score || 0, mate: evalBefore?.mate || null },
        evalAfter: { score: evalAfter?.score || 0, mate: evalAfter?.mate || null },
        metadata: {
          games: metadata?.games,
          averageRating: metadata?.averageRating
        }
      })
    });
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Fetch AI-generated puzzle/tactic explanation from the backend.
 */
export async function generatePuzzleExplanation({ puzzle, move, evalBefore, evalAfter, legalAlternatives }) {
  try {
    const response = await apiFetch('/api/ai/explain/tactic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: puzzle?.fen || 'start',
        solution: puzzle?.solution || [],
        themes: puzzle?.themes || [],
        rating: puzzle?.rating || 1200,
        goal: puzzle?.goal || 'Find the best move',
        evalBefore: { score: evalBefore?.score || 0 },
        evalAfter: { score: evalAfter?.score || 0 },
        materialBefore: 0,
        materialAfter: 0
      })
    });
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Fetch AI-generated endgame explanation from the backend.
 */
export async function generateEndgameExplanation({ endgame, move, evalBefore, evalAfter }) {
  try {
    const response = await apiFetch('/api/ai/explain/endgame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: endgame?.fen || 'start',
        name: endgame?.name || 'Endgame Position',
        difficulty: endgame?.difficulty || 'Intermediate',
        themes: endgame?.themes || [],
        solution: endgame?.solution || [],
        evalBefore: { score: evalBefore?.score || 0 },
        evalAfter: { score: evalAfter?.score || 0 }
      })
    });
    return response.data;
  } catch {
    return null;
  }
}

function runStockfishEvaluation(fen, depth) {
  return new Promise((resolve) => {
    let latest = { score: 0, bestmove: null, mate: null };
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      stopEngine('analysis');
      resolve(latest);
    };

    initEngine((line) => {
      if (resolved || typeof line !== 'string') return;
      const cpMatch = line.match(/\bscore cp (-?\d+)/);
      const mateMatch = line.match(/\bscore mate (-?\d+)/);
      if (cpMatch) latest = { ...latest, score: Number(cpMatch[1]) / 100, mate: null };
      if (mateMatch) latest = { ...latest, score: Number(mateMatch[1]) > 0 ? 99 : -99, mate: Number(mateMatch[1]) };
      if (line.startsWith('bestmove')) {
        latest = { ...latest, bestmove: line.split(' ')[1] };
        finish();
      }
    }, 'analysis');

    postEngineMessage(`position fen ${fen}`, 'analysis');
    postEngineMessage(`go depth ${depth}`, 'analysis');
    setTimeout(finish, STOCKFISH_TIMEOUT_MS);
  });
}

function sanMovesToUci(moves) {
  if (!window.Chess) return [];
  const chess = new window.Chess();
  return moves.map((san) => {
    const move = chess.move(san, { sloppy: true });
    return move ? `${move.from}${move.to}${move.promotion || ''}` : null;
  }).filter(Boolean);
}


