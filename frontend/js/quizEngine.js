/**
 * Quiz Engine — Interactive Chess Quiz Engine
 *
 * Single source of truth for quiz state.
 * Handles Chess instance lifecycle, board management, move validation,
 * Stockfish integration, and puzzle navigation.
 *
 * ─── CRITICAL COMPATIBILITY NOTES ───
 * chess.js v0.10.3 (CDN, used in browser) uses:
 *   - game_over()     instead of isGameOver()
 *   - in_check()      instead of isCheck()
 *   - in_checkmate()  instead of isCheckmate()
 *   - in_stalemate()  instead of isStalemate()
 *   - in_draw()       instead of isDraw()
 *
 * chessboardjs 1.0.0 uses CSS .square-55d63 classes,
 * NOT .square-e4 style selectors. For highlighting we use
 * jQuery to target squares by data-square attribute or
 * by finding the square number from the board's internal DOM.
 *
 * Validation strategy:
 *   1. If puzzle has a solution[] array, check SAN match
 *   2. Mate-in-N puzzles require exact checkmating move
 *   3. After correct move, Stockfish plays opponent's best response
 *
 * Dependencies:
 *   - window.Chess (from chess.js CDN v0.10.3)
 *   - window.Chessboard (from chessboardjs CDN v1.0.0)
 *   - evaluateFen() from learningService.js
 *   - jQuery ($) for DOM manipulation
 */

import { evaluateFen, generatePuzzleExplanation } from './learningService.js';
import { renderAIExplanation } from './learningView.js';

// ══════════════════════════════════════════
// SINGLE SOURCE OF TRUTH
// ══════════════════════════════════════════

export const quizState = {
  chess: null,              // window.Chess instance — MUST ALWAYS be new window.Chess(fen)
  board: null,              // Chessboard instance
  currentPuzzle: null,      // Current puzzle object { fen, goal, solution[], ... }
  currentPuzzleIndex: 0,    // Index into puzzles[]
  puzzles: [],              // All puzzles for this session
  score: 0,
  moveHistory: [],          // SAN strings of moves made
  status: 'idle',           // 'idle' | 'playing' | 'correct' | 'incorrect' | 'complete'
  hintsUsed: 0,
  survivalMode: false,
  survivalStreak: 0,
  isEvaluating: false,      // Prevent concurrent Stockfish calls
  lastEval: null,           // { before, after, quality, move }
  puzzleScored: false,      // Prevent double-scoring
  solutionIndex: 0,         // How many solution moves have been matched so far
  // Callbacks
  onCorrect: null,
  onIncorrect: null,
  onFinish: null
};

// ══════════════════════════════════════════
// CHESS.JS VERSION COMPATIBILITY LAYER
// chess.js v0.10.3 (CDN) uses different API names than v1.x
// ══════════════════════════════════════════

function isGameOver(chess) {
  if (!chess) return false;
  if (typeof chess.game_over === 'function') return chess.game_over();
  if (typeof chess.isGameOver === 'function') return chess.isGameOver();
  return false;
}

function isInCheck(chess) {
  if (!chess) return false;
  if (typeof chess.in_check === 'function') return chess.in_check();
  if (typeof chess.isCheck === 'function') return chess.isCheck();
  return false;
}

function isCheckmate(chess) {
  if (!chess) return false;
  if (typeof chess.in_checkmate === 'function') return chess.in_checkmate();
  if (typeof chess.isCheckmate === 'function') return chess.isCheckmate();
  return false;
}

function isStalemate(chess) {
  if (!chess) return false;
  if (typeof chess.in_stalemate === 'function') return chess.in_stalemate();
  if (typeof chess.isStalemate === 'function') return chess.isStalemate();
  return false;
}

function isDraw(chess) {
  if (!chess) return false;
  if (typeof chess.in_draw === 'function') return chess.in_draw();
  if (typeof chess.isDraw === 'function') return chess.isDraw();
  return false;
}

// ══════════════════════════════════════════
// COORDINATE VALIDATION
// ══════════════════════════════════════════

/**
 * Validate a chess square coordinate (e.g. 'e4', 'a1', 'h8').
 * @param {string} square
 * @returns {boolean}
 */
function isValidSquare(square) {
  if (!square || typeof square !== 'string') return false;
  return /^[a-h][1-8]$/.test(square);
}

/**
 * Normalize a SAN move string by removing check/mate symbols.
 */
function normalizeSan(san) {
  if (!san) return '';
  return String(san).replace(/[+#]/g, '').trim();
}

/**
 * Compute a deterministic square number from algebraic notation.
 * e4 -> 28, a1 -> 0, h8 -> 63
 */
function squareToIndex(square) {
  if (!isValidSquare(square)) return -1;
  const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
  const rank = parseInt(square[1], 10) - 1; // 1=0, 2=1, ..., 8=7
  return rank * 8 + file;
}

// ══════════════════════════════════════════
// LIFECYCLE
// ══════════════════════════════════════════

/**
 * Initialize a new quiz session.
 * Loads puzzles, creates the first Chess+board, and starts.
 */
export function initQuizSession(puzzles, options = {}) {
  quizState.puzzles = puzzles;
  quizState.currentPuzzleIndex = 0;
  quizState.score = 0;
  quizState.moveHistory = [];
  quizState.status = 'idle';
  quizState.hintsUsed = 0;
  quizState.survivalMode = options.survivalMode || false;
  quizState.survivalStreak = 0;
  quizState.isEvaluating = false;
  quizState.lastEval = null;
  quizState.puzzleScored = false;
  quizState.solutionIndex = 0;
  quizState.onCorrect = options.onCorrect || null;
  quizState.onIncorrect = options.onIncorrect || null;
  quizState.onFinish = options.onFinish || null;

  destroyBoard();
  if (puzzles.length > 0) {
    loadPuzzleByIndex(0);
  }
}

/**
 * Load a puzzle by index.
 *
 * STRICT LIFECYCLE (no duplication):
 *   1. destroyBoard() — destroy old Chessboard, clear container
 *   2. quizState.chess = new window.Chess(puzzle.fen) — fresh Chess instance
 *   3. Create new Chessboard on clean #quizBoard
 *   4. Set status = 'playing'
 *
 * quizState.chess is ALWAYS a real window.Chess instance.
 * It is NEVER assigned a JSON object, plain object, or string.
 * Only TWO assignments exist in this file:
 *   - Here in loadPuzzleByIndex:  quizState.chess = new window.Chess(puzzle.fen)
 *   - In quizState initial declaration:  chess: null
 */
function loadPuzzleByIndex(index) {
  if (!quizState.puzzles || index < 0 || index >= quizState.puzzles.length) {
    console.error('Invalid puzzle index:', index);
    return;
  }

  quizState.currentPuzzleIndex = index;
  quizState.currentPuzzle = quizState.puzzles[index];
  quizState.moveHistory = [];
  quizState.solutionIndex = 0;
  quizState.puzzleScored = false;
  quizState.isEvaluating = false;
  quizState.lastEval = null;
  quizState.status = 'playing';

  // ── STRICT: quizState.chess MUST ALWAYS be new window.Chess(fen) ──
  try {
    quizState.chess = new window.Chess(quizState.currentPuzzle.fen);
  } catch (e) {
    console.error('Failed to create Chess instance from FEN. Fallback to start pos.', e);
    quizState.chess = new window.Chess();
  }

  // Guard: verify we have a real Chess.js instance
  if (!quizState.chess || typeof quizState.chess.game_over !== 'function') {
    console.error('CRITICAL: quizState.chess is not a valid Chess.js instance');
    return;
  }

  // ── Create board ──
  createBoard();

  // ── Update UI ──
  updateMoveHistory();
  clearFeedback();
}

/**
 * Create or recreate the Chessboard on #quizBoard.
 * Uses chessboardjs 1.0.0 API.
 */
function createBoard() {
  destroyBoard();

  const container = document.getElementById('quizBoard');
  if (!container) {
    console.error('DOM element #quizBoard not found');
    return;
  }

  try {
    quizState.board = new window.Chessboard('quizBoard', {
      position: quizState.chess.fen(),
      draggable: true,
      pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
      onDrop: handleBoardMove
    });

    // chessboardjs 1.0.0 does NOT set data-square attributes by default.
    // We tag each square so highlightSquare() can find them reliably.
    addSquareDataAttributes();
  } catch (e) {
    console.error('Chessboard creation failed:', e);
  }
}

/**
 * chessboardjs 1.0.0 renders squares as div.square-55d63 in row-major order:
 *   a8, b8, ..., h8, a7, b7, ..., h7, ..., a1, ..., h1
 * We tag each with a data-square attribute so highlightSquare() works.
 */
function addSquareDataAttributes() {
  const container = document.getElementById('quizBoard');
  if (!container) return;
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['8','7','6','5','4','3','2','1'];
  const squares = container.querySelectorAll('.square-55d63');
  squares.forEach(function(el, i) {
    if (i < 64) {
      var file = files[i % 8];
      var rank = ranks[Math.floor(i / 8)];
      el.setAttribute('data-square', file + rank);
    }
  });
}

/**
 * Destroy existing board cleanly — removes the Chessboard instance
 * and clears the container.
 */
function destroyBoard() {
  if (quizState.board) {
    try { quizState.board.destroy(); } catch (_) {}
    quizState.board = null;
  }
  const c = document.getElementById('quizBoard');
  if (c) c.innerHTML = '';
}

// ══════════════════════════════════════════
// BOARD MOVE HANDLER
// ══════════════════════════════════════════

function handleBoardMove(source, target) {
  if (!quizState.chess || quizState.status === 'complete' || quizState.status === 'correct' || quizState.status === 'incorrect') {
    return 'snapback';
  }

  const move = quizState.chess.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback'; // Illegal move — snap piece back

  // Record move
  quizState.moveHistory.push(move.san);
  updateMoveHistory();

  // ─── Validate against solution ───
  const expectedSan = quizState.currentPuzzle.solution[quizState.solutionIndex];
  const cleanSan = normalizeSan(move.san);
  const cleanExpected = normalizeSan(expectedSan);
  const moveUci = move.from + move.to;
  const isCorrect = cleanSan === cleanExpected || moveUci === expectedSan;

  if (isCorrect) {
    quizState.solutionIndex++;
    quizState.score++;
    quizState.puzzleScored = true;

    // Highlight the target square — SAFE: validates first
    highlightSquare(target);

    // Check if puzzle is fully solved
    const gameOver = isGameOver(quizState.chess) ||
                     quizState.solutionIndex >= quizState.currentPuzzle.solution.length;

    if (gameOver) {
      quizState.status = 'complete';
      triggerCorrect({ move: move.san, gameOver: true });
    } else {
      quizState.status = 'playing';
      triggerCorrect({ move: move.san, gameOver: false });
      // Play opponent's response after brief delay
      setTimeout(playOpponentResponse, 500);
    }
  } else {
    // Undo incorrect move
    quizState.chess.undo();
    quizState.moveHistory.pop();
    updateMoveHistory();

    // Sync visual board with Chess state — piece snaps back to original square
    if (quizState.board) {
      quizState.board.position(quizState.chess.fen());
    }

    quizState.status = 'incorrect';

    // Survival Mode: first mistake ends the session immediately
    if (quizState.survivalMode) {
      triggerFinish(getSessionResult());
      return 'snapback';
    }

    const expected = quizState.currentPuzzle.solution[quizState.solutionIndex] || 'N/A';
    triggerIncorrect({ move: move.san, expectedMove: expected });
    return 'snapback';
  }
}

/**
 * Play the opponent's expected response from the solution array.
 */
function playOpponentResponse() {
  if (!quizState.chess || quizState.solutionIndex >= quizState.currentPuzzle.solution.length) return;

  const san = quizState.currentPuzzle.solution[quizState.solutionIndex];
  if (!san) return;

  try {
    const move = quizState.chess.move(san, { sloppy: true });
    if (move) {
      quizState.moveHistory.push(move.san);
      quizState.solutionIndex++;
      quizState.board.position(quizState.chess.fen());
      updateMoveHistory();

      if (isGameOver(quizState.chess)) {
        quizState.status = 'complete';
        triggerCorrect({ move: move.san, gameOver: true });
      } else {
        quizState.status = 'playing';
      }
    }
  } catch (e) {
    console.warn('Opponent response failed:', san, e);
  }
}

// ══════════════════════════════════════════
// SQUARE HIGHLIGHTING — FIXED
// ══════════════════════════════════════════

/**
 * Highlight a square on the board.
 * SAFE: Always validates the square first.
 * Uses [data-square] attribute selector — NEVER builds "#quizBoard .square-" + undefined.
 */
function highlightSquare(square) {
  if (!isValidSquare(square)) {
    console.warn('highlightSquare: invalid coordinate:', square);
    return;
  }

  const boardEl = document.getElementById('quizBoard');
  if (!boardEl) return;

  // SAFE: Validate before building selector
  const selector = '#quizBoard [data-square="' + square + '"]';
  try {
    const el = document.querySelector(selector);
    if (el) {
      el.style.boxShadow = 'inset 0 0 0 3px #a855f7';
      el.style.background = 'rgba(168,85,247,0.25)';
    }
  } catch (e) {
    console.warn('Selector failed — fallback iteration:', e);
    // Fallback: iterate all squares
    boardEl.querySelectorAll('[data-square]').forEach(sq => {
      if (sq.getAttribute('data-square') === square) {
        sq.style.boxShadow = 'inset 0 0 0 3px #a855f7';
        sq.style.background = 'rgba(168,85,247,0.25)';
      }
    });
  }
}

/**
 * Clear all square highlights from the board.
 */
function clearHighlights() {
  const boardEl = document.getElementById('quizBoard');
  if (!boardEl) return;
  boardEl.querySelectorAll('[data-square]').forEach(sq => {
    sq.style.boxShadow = '';
    sq.style.background = '';
  });
}

// ══════════════════════════════════════════
// CALLBACK TRIGGERS
// ══════════════════════════════════════════

function triggerCorrect(data) {
  if (typeof quizState.onCorrect === 'function') quizState.onCorrect(data);
  updateScoreDisplay();
}

function triggerIncorrect(data) {
  if (typeof quizState.onIncorrect === 'function') quizState.onIncorrect(data);
}

function triggerFinish(result) {
  if (typeof quizState.onFinish === 'function') quizState.onFinish(result);
}

// ══════════════════════════════════════════
// NAVIGATION (exported)
// ══════════════════════════════════════════

export function nextPuzzle() {
  // Allow proceeding if puzzle was scored (correct/solution), completed, or failed (incorrect/wrong)
  if (!quizState.puzzleScored && quizState.status !== 'complete' && quizState.status !== 'incorrect') return false;

  if (quizState.currentPuzzleIndex < quizState.puzzles.length - 1) {
    quizState.currentPuzzleIndex++;
    quizState.status = 'playing';
    quizState.puzzleScored = false;
    clearHighlights();
    loadPuzzleByIndex(quizState.currentPuzzleIndex);
    if (quizState.board) quizState.board.draggable = true;
    return true;
  }

  // No more puzzles
  quizState.status = 'complete';
  triggerFinish(getSessionResult());
  return false;
}

export function resetPuzzle() {
  if (!quizState.currentPuzzle) return;

  quizState.status = 'playing';
  quizState.puzzleScored = false;
  quizState.solutionIndex = 0;
  quizState.moveHistory = [];
  clearHighlights();

  // Recreate Chess from original FEN
  try {
    quizState.chess = new window.Chess(quizState.currentPuzzle.fen);
  } catch (e) {
    quizState.chess = new window.Chess();
  }

  if (quizState.board) {
    quizState.board.position(quizState.chess.fen());
    quizState.board.draggable = true;
  }
  updateMoveHistory();
}

// ══════════════════════════════════════════
// HINT (exported)
// ══════════════════════════════════════════

export function giveHint() {
  if (!quizState.currentPuzzle || quizState.status === 'complete') return null;
  if (quizState.hintsUsed >= 3) return null;

  quizState.hintsUsed++;

  const solution = quizState.currentPuzzle.solution;
  const hintIndex = Math.min(quizState.solutionIndex, solution.length - 1);
  const hintMove = solution[hintIndex];
  if (!hintMove) return null;

  let fromSquare = null;
  let toSquare = null;

  // Try to get from/to by making the move temporarily and undoing
  try {
    const move = quizState.chess.move(hintMove, { sloppy: true });
    if (move) {
      fromSquare = move.from;
      toSquare = move.to;
      quizState.chess.undo();
    }
  } catch (_) {
    // Parsing failed — use fallback below
  }

  // Fallback: extract from raw string
  if (!fromSquare) {
    if (hintMove === 'O-O' || hintMove === 'O-O-O') {
      const turn = quizState.chess.turn();
      fromSquare = turn === 'w' ? 'e1' : 'e8';
      toSquare = hintMove === 'O-O'
        ? (turn === 'w' ? 'g1' : 'g8')
        : (turn === 'w' ? 'c1' : 'c8');
    } else if (hintMove.length >= 4) {
      fromSquare = hintMove.slice(0, 2);
      toSquare = hintMove.slice(2, 4);
    }
  }

  // SAFETY: validate before highlighting
  if (isValidSquare(fromSquare)) highlightSquare(fromSquare);
  if (isValidSquare(toSquare)) highlightSquare(toSquare);

  return { from: fromSquare, to: toSquare };
}

// ══════════════════════════════════════════
// SOLUTION (exported)
// ══════════════════════════════════════════

export function showSolution() {
  if (!quizState.currentPuzzle) return null;
  if (quizState.status === 'complete') return null;

  const solution = quizState.currentPuzzle.solution;
  if (!solution || solution.length === 0) return null;

  // Play through solution from original FEN
  try {
    quizState.chess = new window.Chess(quizState.currentPuzzle.fen);
  } catch (e) {
    quizState.chess = new window.Chess();
  }

  const moves = [];
  for (const san of solution) {
    try {
      const m = quizState.chess.move(san, { sloppy: true });
      if (m) moves.push(m.san);
    } catch (_) {}
  }

  if (quizState.board) quizState.board.position(quizState.chess.fen());

  quizState.moveHistory = moves;
  updateMoveHistory();
  quizState.status = 'complete';
  quizState.puzzleScored = true;

  return { move: solution.join(' → ') };
}

// ══════════════════════════════════════════
// EXPLANATION (exported)
// ══════════════════════════════════════════

export async function generateExplanation() {
  if (!quizState.currentPuzzle) return '<p>No puzzle loaded.</p>';

  try {
    const expl = await generatePuzzleExplanation({
      puzzle: quizState.currentPuzzle,
      move: quizState.moveHistory[0] || 'initial',
      evalBefore: quizState.lastEval?.before || { score: 0 },
      evalAfter: quizState.lastEval?.after || { score: 0 },
      legalAlternatives: []
    });
    return renderAIExplanation(expl, 'tactic');
  } catch (e) {
    console.error('generateExplanation failed:', e);
    return '<div class="quiz-explanation-fallback"><p>' +
      (quizState.currentPuzzle.explanation || 'No explanation available.') +
      '</p></div>';
  }
}

// ══════════════════════════════════════════
// SESSION RESULT (exported)
// ══════════════════════════════════════════

export function getSessionResult() {
  const total = quizState.puzzles.length;
  const score = quizState.score;
  return {
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    survivalMode: quizState.survivalMode,
    survivalStreak: quizState.survivalStreak
  };
}

// ══════════════════════════════════════════
// QUALITY LABELS (exported)
// ══════════════════════════════════════════

export function getQualityLabel(quality) {
  if (quality == null) return 'N/A';
  if (quality >= 80) return 'Excellent';
  if (quality >= 60) return 'Good';
  if (quality >= 40) return 'Average';
  if (quality >= 20) return 'Poor';
  return 'Blunder';
}

export function getQualityColor(quality) {
  if (quality == null) return '#888';
  if (quality >= 80) return '#4ade80';
  if (quality >= 60) return '#a855f7';
  if (quality >= 40) return '#fbbf24';
  if (quality >= 20) return '#fb923c';
  return '#f87171';
}

// ══════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════

function updateMoveHistory() {
  const strip = document.getElementById('quizMoveHistory');
  if (!strip) return;
  strip.innerHTML = quizState.moveHistory.map((m, i) =>
    `<span class="quiz-move-pill">${Math.floor(i / 2) + 1}${i % 2 === 0 ? '.' : '...'} ${m}</span>`
  ).join('');
}

function updateScoreDisplay() {
  const bar = document.getElementById('quizScoreBar');
  if (bar) bar.textContent = `${quizState.score}/${quizState.puzzles.length}`;
}

function clearFeedback() {
  const fb = document.getElementById('quizFeedback');
  if (fb) fb.style.display = 'none';
  const ea = document.getElementById('quizExplanationArea');
  if (ea) ea.style.display = 'none';
}
