import { evaluateFen, generatePuzzleExplanation } from './learningService.js';
import { getPuzzleSet, getPuzzleById } from './puzzleService.js';
import { renderAIExplanation, renderBadges, renderBoardPanel, renderSelect, setHtml, setText } from './learningView.js';

const state = {
  board: null,
  chess: null,
  puzzle: null
};

export function renderTacticsExplorer() {
  const puzzles = getPuzzleSet();
  return `
    <div class="learning-tool-shell">
      <div class="learning-tool-controls">
        ${renderSelect('tacticsSelect', puzzles.map((puzzle) => ({ value: puzzle.id, label: `${puzzle.rating} - ${puzzle.themes.join(', ')}` })), puzzles[0].id)}
        <button id="tacticsHint">Hint</button>
        <button id="tacticsReset">Reset</button>
      </div>
      <div class="learning-explorer-layout">
        <div>
          ${renderBoardPanel('tacticsBoard')}
          <div id="tacticsFeedback" class="learning-dynamic-status">Make the best move on the board.</div>
        </div>
        <div class="learning-analysis-panel">
          <h4 id="tacticsGoal"></h4>
          <div id="tacticsMeta" class="learning-badge-row"></div>
          <div id="tacticsExplanation"></div>
        </div>
      </div>
    </div>
  `;
}

export function initTacticsExplorer() {
  state.puzzle = getPuzzleSet()[0];
  state.chess = new window.Chess(state.puzzle.fen);
  state.board = window.Chessboard('tacticsBoard', {
    position: state.puzzle.fen,
    draggable: true,
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop
  });
  bindControls();
  loadPuzzle(state.puzzle.id);
}

function bindControls() {
  document.getElementById('tacticsSelect')?.addEventListener('change', (event) => loadPuzzle(event.target.value));
  document.getElementById('tacticsReset')?.addEventListener('click', () => loadPuzzle(state.puzzle.id));
  document.getElementById('tacticsHint')?.addEventListener('click', () => {
    setHtml('tacticsFeedback', `Hint: look for ${state.puzzle.themes[0]} and forcing replies.`);
  });
}

function loadPuzzle(id) {
  state.puzzle = getPuzzleSet().find((puzzle) => puzzle.id === id) || getPuzzleSet()[0];
  state.chess = new window.Chess(state.puzzle.fen);
  state.board.position(state.puzzle.fen);
  setText('tacticsGoal', state.puzzle.goal);
  setHtml('tacticsMeta', renderBadges([`Rating ${state.puzzle.rating}`, ...state.puzzle.themes, state.puzzle.source]));
  setHtml('tacticsFeedback', 'Make the best move on the board.');
  setHtml('tacticsExplanation', '');
}

async function onDrop(source, target) {
  const beforeFen = state.chess.fen();
  const move = state.chess.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';

  state.board.position(state.chess.fen());
  const expected = state.puzzle.solution[0];
  const correct = move.san === expected || `${move.from}${move.to}${move.promotion || ''}` === expected;

  const [evalBefore, evalAfter] = await Promise.all([
    evaluateFen(beforeFen, 8),
    evaluateFen(state.chess.fen(), 8)
  ]);

  const alternatives = new window.Chess(beforeFen).moves().filter((candidate) => candidate !== move.san);
  const result = await generatePuzzleExplanation({
    puzzle: state.puzzle,
    move,
    evalBefore,
    evalAfter,
    legalAlternatives: alternatives
  });

  setHtml('tacticsFeedback', correct ? 'Correct. Engine verification complete.' : `Not best. Expected ${expected}.`);
  setHtml('tacticsExplanation', renderAIExplanation(result, 'tactic'));
}
