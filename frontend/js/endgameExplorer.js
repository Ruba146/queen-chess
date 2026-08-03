import { evaluateFen, generateEndgameExplanation } from './learningService.js';
import { getEndgameSet, getEndgameById, getEndgameHint, getEndgameSolution, generateEndgameLesson, loadEndgamesFromLLM, regenerateEndgameList } from './endgameService.js';
import { renderAIExplanation, renderBadges, renderBoardPanel, renderSelect, renderStatus, setHtml, setText } from './learningView.js';

const state = {
  board: null,
  chess: null,
  endgame: null,
  explanationCount: 0
};

export function renderEndgameExplorer() {
  const endgames = getEndgameSet();
  const hasEndgames = endgames.length > 0;
  const styles = [
    { value: 'intermediate', label: '♟ General' },
    { value: 'beginner', label: '🌱 Beginner' },
    { value: 'advanced', label: '🎯 Advanced' },
    { value: 'strategic', label: '🧠 Strategic' }
  ];

  let selectOptions;
  if (!hasEndgames) {
    selectOptions = [{ value: '__loading__', label: '⏳ Loading AI endgames...' }];
  } else {
    selectOptions = endgames.map((endgame) => ({ value: endgame.id, label: endgame.name }));
  }

  return `
    <div class="learning-tool-shell">
      <div class="learning-tool-controls">
        ${renderSelect('endgameSelect', selectOptions, hasEndgames ? endgames[0].id : '__loading__')}
        <select id="endgameStyleSelect" class="learning-control-select">
          ${styles.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
        </select>
        <button id="endgameHint">Hint</button>
        <button id="endgameSolution">Solution</button>
        <button id="endgameReset">Reset</button>
        <button id="endgameNewExplanation" style="background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);color:#d8b4fe;padding:10px 14px;border-radius:12px;font-size:12px;cursor:pointer;">🔄 New Style</button>
        <button id="endgameNewListBtn" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#93c5fd;padding:10px 14px;border-radius:12px;font-size:12px;cursor:pointer;">🎲 Generate New Endgames</button>
      </div>
      <div class="learning-explorer-layout">
        <div>
          ${renderBoardPanel('endgameBoard')}
          <div id="endgameFeedback" class="learning-dynamic-status">Play the conversion move.</div>
        <div class="learning-analysis-panel">
          <h4 id="endgameTitle"></h4>
          <div id="endgameMeta" class="learning-badge-row"></div>
          <div id="endgameExplanation"></div>
      </div>
  `;
}

export async function initEndgameExplorer() {
  state.chess = new window.Chess();
  state.board = window.Chessboard('endgameBoard', {
    position: 'start',
    draggable: true,
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop
  });
  bindControls();

  // Load 10 endgames from the LLM
  const loaded = await loadEndgamesFromLLM();
  if (loaded) {
    const endgames = getEndgameSet();
    state.endgame = endgames[0] || null;

    // Refresh the select with actual endgames
    const select = document.getElementById('endgameSelect');
    if (select) {
      select.innerHTML = '';
      endgames.forEach((eg) => {
        const option = document.createElement('option');
        option.value = eg.id;
        option.textContent = eg.name;
        select.appendChild(option);
      });
      select.value = state.endgame?.id || endgames[0]?.id;
    }

    if (state.endgame) {
      loadEndgame(state.endgame.id);
    }
  } else {
    setHtml('endgameExplanation', renderStatus('Could not load endgames from AI. Please try again later.'));
  }
}

function bindControls() {
  document.getElementById('endgameSelect')?.addEventListener('change', (event) => loadEndgame(event.target.value));
  document.getElementById('endgameReset')?.addEventListener('click', () => loadEndgame(state.endgame.id));
  document.getElementById('endgameHint')?.addEventListener('click', () => {
    setHtml('endgameFeedback', 'Hint: Improve king activity and restrict the opponent.');
  });
  document.getElementById('endgameSolution')?.addEventListener('click', () => {
    setHtml('endgameFeedback', `Solution candidate: ${getEndgameSolution(state.endgame.id)}`);
  });
  document.getElementById('endgameNewExplanation')?.addEventListener('click', () => {
    // Increment counter and regenerate with different style
    state.explanationCount++;
    generateFreshExplanation(state.endgame);
  });
  document.getElementById('endgameStyleSelect')?.addEventListener('change', () => {
    generateFreshExplanation(state.endgame);
  });
  document.getElementById('endgameNewListBtn')?.addEventListener('click', async () => {
    setHtml('endgameExplanation', renderStatus('🎲 Generating new endgame list from AI...'));
    const loaded = await regenerateEndgameList();
    if (loaded) {
      const endgames = getEndgameSet();
      state.endgame = endgames[0] || null;

      // Refresh select
      const select = document.getElementById('endgameSelect');
      if (select) {
        select.innerHTML = '';
        endgames.forEach((eg) => {
          const option = document.createElement('option');
          option.value = eg.id;
          option.textContent = eg.name;
          select.appendChild(option);
        });
        select.value = state.endgame?.id || endgames[0]?.id;
      }

      if (state.endgame) {
        loadEndgame(state.endgame.id);
      }
    } else {
      setHtml('endgameExplanation', renderStatus('Could not generate new endgame list. Please try again.'));
    }
  });
}

async function loadEndgame(id) {
  state.endgame = getEndgameSet().find((endgame) => endgame.id === id) || getEndgameSet()[0];
  state.chess = new window.Chess(state.endgame.fen);
  state.board.position(state.endgame.fen);
  setText('endgameTitle', state.endgame.name);
  setHtml('endgameMeta', renderBadges([state.endgame.difficulty, ...state.endgame.themes]));
  setHtml('endgameFeedback', 'Play the conversion move.');

  // Generate explanation from LLM
  setHtml('endgameExplanation', renderStatus('Generating AI endgame explanation...'));
  await generateFreshExplanation(state.endgame);
}

async function generateFreshExplanation(endgame) {
  setHtml('endgameExplanation', renderStatus('Generating AI endgame explanation...'));

  const styleSelect = document.getElementById('endgameStyleSelect');
  const style = styleSelect ? styleSelect.value : 'intermediate';

  try {
    const lesson = await generateEndgameLesson(endgame.fen, endgame.name, {
      themes: endgame.themes,
      style: style,
      regenerate: state.explanationCount > 0
    });

    if (lesson) {
      setHtml('endgameExplanation', renderAIExplanation(lesson, 'endgame'));
    } else {
      // Fallback to the existing generateEndgameExplanation call with evaluation
      const evalBefore = { score: 0, bestmove: null, mate: null };
      const result = await generateEndgameExplanation({
        endgame: state.endgame,
        move: state.endgame.solution[0] || '',
        evalBefore,
        evalAfter: evalBefore
      });
      if (result) {
        setHtml('endgameExplanation', renderAIExplanation(result, 'endgame'));
      } else {
        setHtml('endgameExplanation', renderStatus('AI explanation is temporarily unavailable.'));
      }
    }
  } catch {
    setHtml('endgameExplanation', renderStatus('AI explanation is temporarily unavailable.'));
  }
}

async function onDrop(source, target) {
  const beforeFen = state.chess.fen();
  const move = state.chess.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';

  state.board.position(state.chess.fen());
  const expected = state.endgame.solution[0];
  const correct = move.san === expected || `${move.from}${move.to}${move.promotion || ''}` === expected;
  const [evalBefore, evalAfter] = await Promise.all([
    evaluateFen(beforeFen, 8),
    evaluateFen(state.chess.fen(), 8)
  ]);
  const result = await generateEndgameExplanation({ endgame: state.endgame, move, evalBefore, evalAfter });

  setHtml('endgameFeedback', correct ? '✅ Solution matched.' : `🔄 Playable, but compare it with ${expected}.`);
  setHtml('endgameExplanation', renderAIExplanation(result, 'endgame'));
}
