import { evaluateFen, generateMoveExplanation } from './learningService.js';
import { fetchOpeningMetadata, getOpeningById, getOpenings, searchOpenings, aiSearchOpeningByName, isAIGeneratedOpening, getAIExplanation, loadOpeningsFromLLM } from './openingService.js';
import { renderAIExplanation, renderBadges, renderBoardPanel, renderMoveList, renderSelect, renderStatus, setHtml, setText } from './learningView.js';

const state = {
  board: null,
  chess: null,
  opening: null,
  ply: 0,
  autoplay: null
};

export function renderOpeningExplorer() {
  const openings = getOpenings();
  const categories = openings.length > 0 ? ['All', ...new Set(openings.map((opening) => opening.category))] : ['All'];
  const difficulties = openings.length > 0 ? ['All', ...new Set(openings.map((opening) => opening.difficulty))] : ['All'];

  // Build select options — show loading state if no openings yet
  let selectOptions;
  if (openings.length === 0) {
    selectOptions = [{ value: '__loading__', label: '⏳ Loading AI openings...' }];
  } else {
    selectOptions = [
      ...openings.map((opening) => ({ value: opening.id, label: `${opening.eco || 'AI'} - ${opening.name}` })),
      { value: '__ai_search__', label: '🔍 AI Search Opening...' }
    ];
  }

  return `
    <div class="learning-tool-shell">
      <div class="learning-tool-controls">
        ${renderSelect('openingSelect', selectOptions, openings[0]?.id || '__loading__')}
        <input id="openingSearch" class="learning-control-input" type="search" placeholder="Search openings, ECO, category">
        ${renderSelect('openingDifficulty', difficulties.map((item) => ({ value: item, label: item })), 'All')}
        ${renderSelect('openingCategory', categories.map((item) => ({ value: item, label: item })), 'All')}
      </div>
      <div id="openingResults" class="learning-opening-results"></div>
      <div class="learning-explorer-layout">
        <div>
          ${renderBoardPanel('openingBoard')}
          <div class="learning-board-actions">
            <button id="openingPrev">Previous</button>
            <button id="openingNext">Next</button>
            <button id="openingAuto">Auto Play</button>
            <button id="openingReset">Reset</button>
          </div>
          <div id="openingMoves"></div>
        </div>
        <div class="learning-analysis-panel">
          <h4 id="openingTitle">Opening Explorer</h4>
          <div id="openingMeta" class="learning-badge-row"></div>
          <div id="openingExplanation">${renderStatus('Select an opening to generate move analysis.')}</div>
        </div>
      </div>
      <!-- Hidden AI search dialog -->
      <div id="aiOpeningSearchDialog" class="ai-search-dialog" style="display:none;">
        <div class="ai-search-dialog-content">
          <h4>🔍 Search Any Opening</h4>
          <div class="ai-search-input-row">
            <input id="aiOpeningSearchInput" class="learning-control-input" type="text" placeholder="e.g. London System, Caro-Kann, Pirc Defense..." />
            <button id="aiOpeningSearchConfirm" class="ai-search-btn">Search</button>
            <button id="aiOpeningSearchCancel" class="ai-chat-clear-btn">✕</button>
          </div>
          <div class="ai-search-examples">
            <span>Try:</span>
            <button class="ai-search-example" data-ai-name="London System">London System</button>
            <button class="ai-search-example" data-ai-name="Vienna Game">Vienna</button>
            <button class="ai-search-example" data-ai-name="Caro-Kann Defense">Caro-Kann</button>
            <button class="ai-search-example" data-ai-name="Ponziani Opening">Ponziani</button>
            <button class="ai-search-example" data-ai-name="King's Indian Defense">King's Indian</button>
          </div>
          <div id="aiOpeningSearchStatus" style="margin-top:8px;"></div>
        </div>
      </div>
    </div>
  `;
}

export async function initOpeningExplorer() {
  state.chess = new window.Chess();
  state.ply = 0;
  state.board = window.Chessboard('openingBoard', {
    position: 'start',
    draggable: false,
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png'
  });

  bindControls();
  renderOpeningResults();

  // Load 10 openings from the LLM
  const loaded = await loadOpeningsFromLLM();
  if (loaded) {
    const openings = getOpenings();
    state.opening = openings[0] || null;

    // Refresh the select with actual openings
    const select = document.getElementById('openingSelect');
    if (select) {
      // Remove loading option
      select.innerHTML = '';
      openings.forEach((op) => {
        const option = document.createElement('option');
        option.value = op.id;
        option.textContent = `${op.eco || 'AI'} - ${op.name}`;
        select.appendChild(option);
      });
      // Add AI search option
      const aiSearchOpt = document.createElement('option');
      aiSearchOpt.value = '__ai_search__';
      aiSearchOpt.textContent = '🔍 AI Search Opening...';
      select.appendChild(aiSearchOpt);

      select.value = state.opening?.id || openings[0]?.id;
    }

    // Update results
    renderOpeningResults();

    if (state.opening) {
      loadOpening(state.opening.id);
    }
  } else {
    // Show error state if LLM unavailable
    setHtml('openingExplanation', renderStatus('Could not load openings from AI. Please try again later.'));
  }
}

function bindControls() {
  document.getElementById('openingSelect')?.addEventListener('change', (event) => {
    const value = event.target.value;
    if (value === '__ai_search__') {
      showAISearchDialog();
    } else {
      loadOpening(value);
    }
  });
  document.getElementById('openingSearch')?.addEventListener('input', renderOpeningResults);
  document.getElementById('openingDifficulty')?.addEventListener('change', renderOpeningResults);
  document.getElementById('openingCategory')?.addEventListener('change', renderOpeningResults);
  document.getElementById('openingPrev')?.addEventListener('click', previousMove);
  document.getElementById('openingNext')?.addEventListener('click', nextMove);
  document.getElementById('openingAuto')?.addEventListener('click', toggleAutoPlay);
  document.getElementById('openingReset')?.addEventListener('click', resetOpening);

  // AI search dialog controls
  document.getElementById('aiOpeningSearchConfirm')?.addEventListener('click', performAISearch);
  document.getElementById('aiOpeningSearchInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performAISearch();
  });
  document.getElementById('aiOpeningSearchCancel')?.addEventListener('click', hideAISearchDialog);

  // AI search example buttons
  document.querySelectorAll('[data-ai-name]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.aiName;
      const input = document.getElementById('aiOpeningSearchInput');
      if (input && name) {
        input.value = name;
        performAISearch();
      }
    });
  });
}

// ──────────────────────────────────────────────
// AI Search Dialog (Opening Explorer)
// ──────────────────────────────────────────────

function showAISearchDialog() {
  const dialog = document.getElementById('aiOpeningSearchDialog');
  if (dialog) dialog.style.display = 'block';
  const input = document.getElementById('aiOpeningSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  const status = document.getElementById('aiOpeningSearchStatus');
  if (status) status.innerHTML = '';
}

function hideAISearchDialog() {
  const dialog = document.getElementById('aiOpeningSearchDialog');
  if (dialog) dialog.style.display = 'none';
}

async function performAISearch() {
  const input = document.getElementById('aiOpeningSearchInput');
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  const status = document.getElementById('aiOpeningSearchStatus');
  if (status) status.innerHTML = '<div class="learning-dynamic-status">🔍 Searching for opening...</div>';

  const result = await aiSearchOpeningByName(name);

  if (!result) {
    if (status) status.innerHTML = '<div class="learning-dynamic-status">Could not find this opening. Try a different name.</div>';
    return;
  }

  // Success: close dialog, update select, load the opening
  hideAISearchDialog();

  // Refresh the select options to include the new AI opening
  const select = document.getElementById('openingSelect');
  if (select) {
    // Add the new option if not present
    const existing = Array.from(select.options).find(opt => opt.value === result.id);
    if (!existing) {
      const option = document.createElement('option');
      option.value = result.id;
      option.textContent = `AI - ${result.name}`;
      select.appendChild(option);
    }
    select.value = result.id;
  }

  // Load the AI-generated opening
  loadOpening(result.id);
}

function renderOpeningResults() {
  const search = document.getElementById('openingSearch')?.value || '';
  const difficulty = document.getElementById('openingDifficulty')?.value || 'All';
  const category = document.getElementById('openingCategory')?.value || 'All';

  const openings = searchOpenings(search, difficulty, category);

  setHtml('openingResults', openings.map((opening) => {
    const isAI = isAIGeneratedOpening(opening.id);
    return `
    <button class="learning-result-row" data-opening-id="${opening.id}">
      <span>${isAI ? '🤖 ' : ''}${opening.name}</span>
      <span>${opening.eco || 'AI'}</span>
      <span>${opening.category || 'AI Generated'}</span>
      <span>${opening.difficulty || 'N/A'}</span>
    </button>`;
  }).join(''));

  document.querySelectorAll('[data-opening-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const select = document.getElementById('openingSelect');
      if (select) select.value = button.dataset.openingId;
      loadOpening(button.dataset.openingId);
    });
  });
}

async function loadOpening(id) {
  state.opening = getOpeningById(id);
  if (!state.opening) {
    setHtml('openingExplanation', renderStatus('Opening not found. Try searching for it with AI Search.'));
    return;
  }
  state.ply = 0;

  // Check if this is an AI-generated opening (no predefined moves)
  const isAI = isAIGeneratedOpening(id);

  if (isAI) {
    // AI-generated openings may have moves from the LLM, or may not.
    // Use them if available, otherwise start from the initial position.
    const aiExplanation = getAIExplanation(id);
    const badges = [
      state.opening.category || 'AI Generated',
      state.opening.difficulty || 'Intermediate',
      'AI Powered'
    ];
    setText('openingTitle', `♟ ${state.opening.name}`);
    setHtml('openingMeta', renderBadges(badges));
    resetPosition();

    // If we have an AI explanation, show it directly instead of per-move analysis
    if (aiExplanation) {
      setHtml('openingExplanation', renderAIExplanation(aiExplanation, 'opening'));
    } else {
      // Still try to fetch explanation from backend
      setHtml('openingExplanation', renderStatus('Generating AI explanation...'));
      await explainCurrentMove();
    }
  } else {
    // Standard opening with predefined moves
    setText('openingTitle', `${state.opening.eco} ${state.opening.name}`);
    setHtml('openingMeta', renderBadges([state.opening.category, state.opening.difficulty, `${state.opening.moves.length} plies`]));
    setHtml('openingExplanation', renderStatus('Loading opening database metadata and engine evaluation...'));
    const metadata = await fetchOpeningMetadata(state.opening);
    state.opening = metadata;
    setHtml('openingMeta', renderBadges([
      metadata.eco,
      metadata.category,
      metadata.difficulty,
      metadata.games === null ? 'Explorer offline' : `${metadata.games} master games`
    ]));
    resetPosition();
    await explainCurrentMove();
  }
}

function resetPosition() {
  state.chess.reset();
  for (let i = 0; i < state.ply; i += 1) state.chess.move(state.opening.moves[i], { sloppy: true });
  state.board.position(state.chess.fen());
  highlightLastMove();
  setHtml('openingMoves', renderMoveList(state.opening.moves, state.ply - 1));
}

async function explainCurrentMove() {
  const moveSan = state.opening.moves[Math.max(0, state.ply - 1)] || 'Starting position';
  const before = new window.Chess();
  for (let i = 0; i < Math.max(0, state.ply - 1); i += 1) before.move(state.opening.moves[i], { sloppy: true });
  const fenBefore = before.fen();
  const after = new window.Chess(fenBefore);
  if (state.ply > 0) after.move(moveSan, { sloppy: true });
  const fenAfter = after.fen();

  // Always reach the AI explanation call — even if Stockfish evaluation fails.
  // The evaluateFen() helper has a .catch() guard that resolves with a default
  // value so the promise chain never permanently breaks.
  let evalBefore, evalAfter;
  try {
    [evalBefore, evalAfter] = await Promise.all([
      evaluateFen(fenBefore, 7),
      evaluateFen(fenAfter, 7)
    ]);
  } catch {
    evalBefore = { score: 0, bestmove: null, mate: null };
    evalAfter = { score: 0, bestmove: null, mate: null };
  }

  const result = await generateMoveExplanation({
    move: moveSan,
    fenBefore,
    fenAfter,
    evalBefore,
    evalAfter,
    metadata: state.opening,
    rating: 1200
  });
  setHtml('openingExplanation', renderAIExplanation(result, 'opening'));
}

function nextMove() {
  if (state.ply >= state.opening.moves.length) return;
  state.ply += 1;
  resetPosition();
  explainCurrentMove();
}

function previousMove() {
  if (state.ply <= 0) return;
  state.ply -= 1;
  resetPosition();
  explainCurrentMove();
}

function resetOpening() {
  state.ply = 0;
  stopAutoPlay();
  resetPosition();
  explainCurrentMove();
}

function toggleAutoPlay() {
  if (state.autoplay) {
    stopAutoPlay();
    return;
  }
  state.autoplay = setInterval(() => {
    if (state.ply >= state.opening.moves.length) {
      stopAutoPlay();
      return;
    }
    nextMove();
  }, 1300);
}

function stopAutoPlay() {
  if (state.autoplay) clearInterval(state.autoplay);
  state.autoplay = null;
}

function highlightLastMove() {
  document.querySelectorAll('#openingBoard .learning-last-move').forEach((square) => {
    square.classList.remove('learning-last-move');
  });
  if (state.ply <= 0) return;

  const replay = new window.Chess();
  let lastMove = null;
  for (let i = 0; i < state.ply; i += 1) {
    lastMove = replay.move(state.opening.moves[i], { sloppy: true });
  }
  if (!lastMove) return;

  [lastMove.from, lastMove.to].forEach((square) => {
    document.querySelector(`#openingBoard .square-${square}`)?.classList.add('learning-last-move');
  });
}
