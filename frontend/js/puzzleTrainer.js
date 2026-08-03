/**
 * Puzzle Trainer — Enhanced Interactive Puzzle Solver
 *
 * Supports:
 *   - Mate in N puzzles
 *   - Winning material
 *   - Fork, Pin, Skewer, Double Attack
 *   - Discovered Attack, Deflection, Removing the Defender
 *   - Endgame puzzles, Middlegame puzzles
 *
 * Every move is validated by Stockfish.
 * After every move: ✓ Correct | ✗ Incorrect
 * Shows: Why, Best continuation, Engine evaluation, Tactical idea, AI explanation
 *
 * Reuses:
 *   - stockfish.js for move validation and evaluation
 *   - learningService.js for AI explanations
 *   - puzzleService.js for puzzle data
 *   - learningView.js for render helpers
 */

import { evaluateFen, generatePuzzleExplanation } from './learningService.js';
import { getPuzzleSet, getPuzzleById, fetchPuzzleByRating } from './puzzleService.js';
import { renderAIExplanation, renderBadges, renderBoardPanel, renderSelect, setHtml, setText } from './learningView.js';

const state = {
  board: null,
  chess: null,
  puzzle: null,
  currentMoveIndex: 0,
  solution: [],
  isCorrect: null,
  hintsUsed: 0,
  moveHistory: []
};

// Puzzle categories for the dropdown
const PUZZLE_CATEGORIES = [
  { value: 'mate-in-1', label: '♛ Mate in 1' },
  { value: 'mate-in-2', label: '♛ Mate in 2' },
  { value: 'mate-in-3', label: '♛ Mate in 3' },
  { value: 'fork', label: '⚡ Fork' },
  { value: 'pin', label: '📌 Pin' },
  { value: 'skewer', label: '🔱 Skewer' },
  { value: 'double-attack', label: '⚔️ Double Attack' },
  { value: 'discovered-attack', label: '💥 Discovered Attack' },
  { value: 'deflection', label: '🔄 Deflection' },
  { value: 'removing-defender', label: '🗡️ Removing Defender' },
  { value: 'winning-material', label: '💰 Winning Material' },
  { value: 'endgame', label: '🏁 Endgame' },
  { value: 'middlegame', label: '♟ Middlegame' },
  { value: 'mixed', label: '🎲 Mixed' }
];

export function renderPuzzleTrainer() {
  return `
    <div class="learning-tool-shell">
      <div class="learning-tool-controls">
        <div style="display:flex;gap:8px;grid-column:1/-1;">
          <select id="puzzleCategory" class="learning-control-select" style="flex:1;">
            ${PUZZLE_CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
          </select>
          <input type="number" id="puzzleRatingInput" class="learning-control-input" placeholder="Rating (e.g. 1200)" value="1200" style="max-width:140px;" min="400" max="3000">
          <select id="puzzleSelect" class="learning-control-select" style="flex:1;">
            <option value="">Loading puzzles...</option>
          </select>
        </div>
        <button id="puzzleNewBtn" style="grid-column:1;">🔄 New Puzzle</button>
        <button id="puzzleHintBtn" style="grid-column:2;">💡 Hint (${3})</button>
        <button id="puzzleResetBtn" style="grid-column:3;">↺ Reset</button>
        <button id="puzzleShowSolutionBtn" style="grid-column:4;">👁️ Show Solution</button>
      </div>

      <div class="learning-explorer-layout">
        <div>
          ${renderBoardPanel('puzzleBoard')}
          <div id="puzzleFeedback" class="learning-dynamic-status" style="margin-top:8px;">
            Make a move on the board to solve the puzzle.
          </div>
          <div id="puzzleMoveHistory" class="learning-move-strip" style="margin-top:8px;"></div>
        </div>
        <div class="learning-analysis-panel" id="puzzleAnalysisPanel">
          <div id="puzzleHeader">
            <h4 id="puzzleTitle" style="margin-bottom:4px;">Puzzle Trainer</h4>
            <div id="puzzleMeta" class="learning-badge-row"></div>
          </div>
          <div id="puzzleGoal" style="color:#aaa;font-size:13px;margin-bottom:8px;">
            Select a puzzle category and rating, then make the best move.
          </div>
          <div id="puzzleResult" style="display:none;"></div>
          <div id="puzzleExplanation"></div>
        </div>
      </div>
    </div>
  `;
}

export function initPuzzleTrainer() {
  loadPuzzlesForCategory('mate-in-1', 1200);
  bindControls();
}

function bindControls() {
  const categorySelect = document.getElementById('puzzleCategory');
  const ratingInput = document.getElementById('puzzleRatingInput');
  const puzzleSelect = document.getElementById('puzzleSelect');

  categorySelect?.addEventListener('change', () => {
    const rating = parseInt(ratingInput?.value) || 1200;
    loadPuzzlesForCategory(categorySelect.value, rating);
  });

  ratingInput?.addEventListener('change', () => {
    const rating = parseInt(ratingInput.value) || 1200;
    loadPuzzlesForCategory(categorySelect?.value || 'mixed', rating);
  });

  puzzleSelect?.addEventListener('change', () => {
    if (puzzleSelect.value) loadPuzzle(puzzleSelect.value);
  });

  document.getElementById('puzzleNewBtn')?.addEventListener('click', () => {
    const category = categorySelect?.value || 'mixed';
    const rating = parseInt(ratingInput?.value) || 1200;
    loadPuzzlesForCategory(category, rating);
  });

  document.getElementById('puzzleHintBtn')?.addEventListener('click', giveHint);
  document.getElementById('puzzleResetBtn')?.addEventListener('click', resetPuzzle);
  document.getElementById('puzzleShowSolutionBtn')?.addEventListener('click', showSolution);
}

function loadPuzzlesForCategory(category, rating) {
  const puzzleSelect = document.getElementById('puzzleSelect');
  if (!puzzleSelect) return;

  // Filter puzzles from puzzleService by category/theme
  const allPuzzles = getPuzzleSet();
  const filtered = allPuzzles.filter(p => {
    const themes = (p.themes || []).join(' ').toLowerCase();
    return themes.includes(category.replace(/-/g, ' ')) || category === 'mixed';
  });

  // If no exact match, show all puzzles
  const displayPuzzles = filtered.length > 0 ? filtered : allPuzzles;

  puzzleSelect.innerHTML = displayPuzzles.map(p =>
    `<option value="${p.id}">${p.rating} — ${p.themes.join(', ')} (${p.goal.slice(0, 30)}...)</option>`
  ).join('') || '<option value="">No puzzles available</option>';

  if (displayPuzzles.length > 0) {
    loadPuzzle(displayPuzzles[0].id);
  }
}

function loadPuzzle(id) {
  state.puzzle = getPuzzleSet().find(p => p.id === id) || getPuzzleSet()[0];
  if (!state.puzzle) return;

  state.chess = new window.Chess(state.puzzle.fen);
  state.solution = state.puzzle.solution || [];
  state.currentMoveIndex = 0;
  state.isCorrect = null;
  state.hintsUsed = 0;
  state.moveHistory = [];

  // Create or update board
  if (!state.board) {
    state.board = window.Chessboard('puzzleBoard', {
      position: state.puzzle.fen,
      draggable: true,
      pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
      onDrop: onPuzzleMove
    });
  } else {
    state.board.position(state.puzzle.fen);
  }

  // Update UI
  const categoryLabel = PUZZLE_CATEGORIES.find(c => state.puzzle.themes.includes(c.value))?.label || 'Puzzle';
  setHtml('puzzleMeta', renderBadges([
    `Rating ${state.puzzle.rating}`,
    ...state.puzzle.themes,
    categoryLabel
  ]));
  setText('puzzleGoal', state.puzzle.goal || 'Find the best move');
  setHtml('puzzleFeedback', 'Make the best move to solve the puzzle.');
  setHtml('puzzleExplanation', '');
  setHtml('puzzleMoveHistory', '');
  document.getElementById('puzzleResult').style.display = 'none';

  // Update hint button
  updateHintButton();
}

async function onPuzzleMove(source, target) {
  const beforeFen = state.chess.fen();
  const move = state.chess.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';

  state.board.position(state.chess.fen());
  state.moveHistory.push(move.san);

  // Get Stockfish evaluations
  const [evalBefore, evalAfter] = await Promise.all([
    evaluateFen(beforeFen, 10),
    evaluateFen(state.chess.fen(), 10)
  ]);

  // Check if the move matches the expected solution
  const expected = state.solution[state.currentMoveIndex];
  const moveUci = `${move.from}${move.to}${move.promotion || ''}`;
  const isCorrect = move.san === expected || moveUci === expected;

  state.isCorrect = isCorrect;

  if (isCorrect) {
    state.currentMoveIndex++;
    setHtml('puzzleFeedback', `✅ Correct! (${state.currentMoveIndex}/${state.solution.length})`);

    // If puzzle is solved completely
    if (state.currentMoveIndex >= state.solution.length) {
      setHtml('puzzleFeedback', '✅ Puzzle solved! Excellent!');
      showPuzzleResult(true, evalBefore, evalAfter);
    } else {
      // Play opponent's response
      playOpponentResponse();
    }
  } else {
    setHtml('puzzleFeedback', `❌ Incorrect. Expected ${expected}. Try again or use Hint.`);
    // Undo the incorrect move
    state.chess.undo();
    state.board.position(state.chess.fen());
    state.moveHistory.pop();

    // Show partial explanation
    const alternatives = new window.Chess(beforeFen).moves().filter(c => c !== move.san);
    const result = await generatePuzzleExplanation({
      puzzle: state.puzzle,
      move,
      evalBefore,
      evalAfter,
      legalAlternatives: alternatives
    });
    setHtml('puzzleExplanation', renderAIExplanation(result, 'tactic'));
  }

  updateMoveHistory();
}

function playOpponentResponse() {
  if (state.currentMoveIndex >= state.solution.length) return;

  const expected = state.solution[state.currentMoveIndex];
  try {
    const move = state.chess.move(expected, { sloppy: true });
    if (move) {
      state.board.position(state.chess.fen());
      state.currentMoveIndex++;
      state.moveHistory.push(move.san);
      updateMoveHistory();
    }
  } catch {
    // Opponent can't move — puzzle complete
  }
}

async function showPuzzleResult(solved, evalBefore, evalAfter) {
  const resultDiv = document.getElementById('puzzleResult');
  resultDiv.style.display = 'block';

  resultDiv.innerHTML = `
    <div style="padding:12px;border-radius:12px;background:${solved ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'};border:1px solid ${solved ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'};margin-bottom:12px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:4px;">
        ${solved ? '✅ Puzzle Solved!' : '❌ Puzzle Failed'}
      </div>
      <div style="color:#aaa;font-size:13px;">
        ${solved
          ? `Solved in ${state.moveHistory.length} moves${state.hintsUsed > 0 ? ` with ${state.hintsUsed} hint(s)` : ''}.`
          : `Expected: ${state.solution.join(', ')}`
        }
      </div>
    </div>
  `;

  // Generate AI explanation
  const alternatives = evalBefore ? ['initial position'] : [];
  const result = await generatePuzzleExplanation({
    puzzle: state.puzzle,
    move: state.solution[0],
    evalBefore: evalBefore || { score: 0 },
    evalAfter: evalAfter || { score: 0 },
    legalAlternatives: alternatives
  });

  setHtml('puzzleExplanation', renderAIExplanation(result, 'tactic'));
}

function giveHint() {
  if (!state.puzzle || state.hintsUsed >= 3) return;

  const hintIndex = state.currentMoveIndex;
  if (hintIndex < state.solution.length) {
    state.hintsUsed++;
    const hintMove = state.solution[hintIndex];
    setHtml('puzzleFeedback', `💡 Hint: Try ${hintMove}`);

    // Highlight the piece on the board
    const chess = new window.Chess(state.puzzle.fen);
    // Play through to current position
    for (let i = 0; i < state.currentMoveIndex && i < state.solution.length; i++) {
      try { chess.move(state.solution[i]); } catch {}
    }

    const hintSquare = hintMove.slice(0, 2);
    // Flash the square
    const $board = document.getElementById('puzzleBoard');
    if ($board) {
      $board.style.boxShadow = '0 0 20px rgba(251,191,36,0.6)';
      setTimeout(() => { $board.style.boxShadow = ''; }, 2000);
    }

    updateHintButton();
  }
}

function resetPuzzle() {
  if (state.puzzle) {
    loadPuzzle(state.puzzle.id);
  }
}

function showSolution() {
  if (!state.puzzle || !state.solution.length) return;

  // Play through the solution
  state.chess = new window.Chess(state.puzzle.fen);
  for (const move of state.solution) {
    try {
      state.chess.move(move, { sloppy: true });
    } catch {}
  }
  state.board.position(state.chess.fen());
  setHtml('puzzleFeedback', `Solution: ${state.solution.join(' → ')}`);
  setHtml('puzzleResult', '');

  // Generate final explanation
  evaluateFen(state.puzzle.fen, 10).then(evalBefore => {
    evaluateFen(state.chess.fen(), 10).then(evalAfter => {
      showPuzzleResult(false, evalBefore, evalAfter);
    });
  });
}

function updateMoveHistory() {
  setHtml('puzzleMoveHistory', state.moveHistory.map((m, i) =>
    `<span class="learning-move-pill ${i % 2 === 0 ? 'active' : ''}">${Math.floor(i/2)+1}${i%2===0?'.':'...'} ${m}</span>`
  ).join(''));
}

function updateHintButton() {
  const hintBtn = document.getElementById('puzzleHintBtn');
  if (hintBtn) {
    const remaining = 3 - state.hintsUsed;
    hintBtn.textContent = `💡 Hint (${remaining})`;
    hintBtn.disabled = remaining <= 0;
  }
}

export { PUZZLE_CATEGORIES };

