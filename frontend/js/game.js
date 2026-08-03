import { state } from './state.js';
import { apiFetch, getToken } from './utils.js';
import { showGameOverModal } from './ui.js';
import { initEngine as initStockfishEngine, postEngineMessage, clearEngineListeners } from './stockfish.js';
import { loadMatches } from './dashboard.js';

let aiPanelInterval = null;

export function goToLogin() {
  window.location.href = 'login.html';
}

export function setColor(color) {
  state.playerColor = color;
  state.selectedColor = color;

  document.querySelectorAll('.color-row button').forEach((button) => button.classList.remove('selected'));
  const buttons = document.querySelectorAll('.color-row button');
  if (color === 'white' && buttons[0]) buttons[0].classList.add('selected');
  if (color === 'black' && buttons[1]) buttons[1].classList.add('selected');

  const resultEl = document.getElementById('gameResult');
  if (resultEl) {
    resultEl.innerHTML = 'Selected: ' + color;
    resultEl.style.display = 'block';
  }
}

export function setRandomColor() {
  const randomColor = Math.random() < 0.5 ? 'white' : 'black';
  state.playerColor = randomColor;
  state.selectedColor = randomColor;

  document.querySelectorAll('.color-row button').forEach((button) => button.classList.remove('selected'));
  const resultEl = document.getElementById('gameResult');
  if (resultEl) {
    resultEl.innerHTML = '🎲 Random selected: ' + randomColor;
    resultEl.style.display = 'block';
  }
}

function makeAIMove() {
  if (!state.game || state.game.game_over()) return;
  // Engine readiness is managed inside the engine module.
  if (state.waitingBestmove) return;


  const level = state.aiSettings[state.aiLevel] || state.aiSettings.intermediate;
  const fen = state.game.fen();

  state.waitingBestmove = true;
  state.pendingAIMove = true;

  postEngineMessage('position fen ' + fen, 'game');
  postEngineMessage('setoption name Skill Level value ' + level.skill, 'game');
  postEngineMessage('go depth ' + level.depth, 'game');

}

export function toggleHints() {
  state.hintsEnabled = !state.hintsEnabled;
  document.querySelectorAll('.toggle-track').forEach((track) => track.classList.toggle('active', state.hintsEnabled));
  const coach = document.getElementById('beginnerCoach');
  if (coach) coach.innerHTML = state.hintsEnabled ? '💡 Beginner Coach Active' : 'Hints OFF';
}

export function updateBeginnerCoach(move) {
  const coach = document.getElementById('beginnerCoach');
  if (!coach) return;
  if (move.piece === 'p') coach.innerHTML = '💡 Good pawn move. Control the center.';
  else if (move.piece === 'n') coach.innerHTML = '✨ Nice! Knights are strong early.';
  else if (move.piece === 'q') coach.innerHTML = '⚠ Be careful using the queen too early.';
  else coach.innerHTML = '♟ Keep developing your pieces.';
}

export function onDrop(source, target) {
  if (state.pendingAIMove) return 'snapback';

  const piece = state.game.get(source);
  if (!piece || piece.color !== state.playerColor[0] || state.game.turn() !== state.playerColor[0]) {
    return 'snapback';
  }

  const move = state.game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';

  state.gameMoves.push({ move: move.san, playerEval: 0, bestEval: 0 });
  state.board.position(state.game.fen());
  updateBeginnerCoach(move);

  state.currentAccuracy = Math.floor(70 + Math.random() * 30);

  const pgn = state.game.pgn();
  if (pgn.includes('e4 e5 Nf3 Nc6 Bb5')) state.currentOpening = 'Ruy Lopez';

  checkGameStatus();
  updateMoveCount();

  if (!state.game.game_over()) setTimeout(() => makeAIMove(), 300);


  return move;
}

function checkGameStatus() {
  const status = document.getElementById('gameStatusValue');
  const status2 = document.getElementById('gameStatusValue2');
  const syncStatus = (text) => {
    if (status) status.innerHTML = text;
    if (status2) status2.innerHTML = text;
  };
  if (state.game.in_checkmate()) {
    const winner = state.game.turn() === 'w' ? 'Black' : 'White';
    syncStatus('🏆 ' + winner + ' wins!');
    state.board.draggable = false;
    setTimeout(() => saveGame(winner), 500);
  } else if (state.game.in_draw()) {
    syncStatus('🤝 Draw!');
    state.board.draggable = false;
    setTimeout(() => saveGame('draw'), 500);
  } else {
    const turn = state.game.turn() === 'w' ? 'White' : 'Black';
    syncStatus(turn + "'s Turn");
  }
}

async function saveGame(result) {
  const token = getToken();
  if (!token) {
    showGameOverModal(result, 'Unknown', 'Unknown', 0, {});
    return;
  }

  let duration = '0m 0s';
  let durationSec = 0;
  if (state.gameStartTime) {
    durationSec = Math.floor((Date.now() - state.gameStartTime) / 1000);
    duration = Math.floor(durationSec / 60) + 'm ' + (durationSec % 60) + 's';
  }

  try {
    const data = await apiFetch('/api/game/save', {
      method: 'POST',
      body: JSON.stringify({
        result,
        moves: state.game.history(),
        pgn: state.game.pgn(),
        playerColor: state.playerColor,
        accuracy: state.currentAccuracy,
        opening: state.currentOpening,
        difficulty: state.aiLevel,
        duration: durationSec
      })
    });

    state.currentGameId = data.game ? data.game._id : null;

    showGameOverModal(
      result,
      state.game.history().length,
      state.currentAccuracy,
      duration,
      data.analysis || {},
      data.ratingChange || 0,
      data.newRating || 1200,
      data.rankAfterGame || 'Beginner',
      data.playerLevelAfterGame || 'Beginner'
    );
  } catch (error) {
    showGameOverModal(result, state.game.history().length, state.currentAccuracy, duration, {});
  }
}

export function startGame() {
  const startCard = document.querySelector('.start-card');
  if (startCard) startCard.classList.add('fade-out');

  state.gameStartTime = Date.now();
  state.pendingAIMove = false;
  state.engineBusy = false;
  state.gameMoves = [];
  state.currentAccuracy = 0;
  state.currentOpening = 'Unknown Opening';
  state.aiLevel = document.getElementById('difficultySelect').value;
  state.game = new window.Chess();

  setTimeout(() => {
    showGameLayout();

    state.board = window.Chessboard('board', {
      draggable: true,
      position: 'start',
      orientation: state.playerColor,
      onDrop,
      onMouseoverSquare: showHints,
      onMouseoutSquare: removeHints
    });

    initGameEngine();

    if (state.playerColor === 'black') setTimeout(() => makeAIMove(), 500);
  }, 400);
}

function showGameLayout() {
  const hintsActive = state.hintsEnabled ? 'active' : '';
  const difficulty = state.aiLevel.charAt(0).toUpperCase() + state.aiLevel.slice(1);
  const playerRating = state.whiteRating ?? 1200;
  const aiRating = state.blackRating ?? 1200;
  const playerColor = state.playerColor === 'white' ? 'White' : 'Black';
  const aiColor = state.playerColor === 'white' ? 'Black' : 'White';
  const playerAvatar = state.playerColor === 'white' ? '♔' : '♚';
  const aiAvatar = '♛';
  const playerStatus = state.playerColor === 'white' ? 'Active' : 'Waiting';
  document.getElementById('content').innerHTML = `
<div class="play-page">
  <!-- ============ TOP HERO ============ -->
  <section class="play-hero js-reveal">
    <div class="play-hero-glow play-hero-glow-1"></div>
    <div class="play-hero-glow play-hero-glow-2"></div>
    <div class="play-hero-piece play-hero-queen">♛</div>
    <div class="play-hero-piece play-hero-rook">♖</div>
    <div class="play-hero-piece play-hero-knight">♘</div>

    <div class="play-hero-content">
      <div class="play-hero-badge">
        <span class="play-hero-badge-dot"></span>
        <span>LIVE MATCH</span>
      </div>
      <h1 class="play-hero-title">Play the <span class="play-hero-accent">Queen</span></h1>
      <p class="play-hero-sub">Challenge Queen AI on a luxurious glass board with real-time engine analysis and live coaching.</p>

      <div class="play-hero-chips">
        <div class="play-hero-chip"><span class="play-hero-chip-icon">🎮</span><span class="play-hero-chip-label">Mode</span><strong>${difficulty} Match</strong></div>
        <div class="play-hero-chip has-ai"><span class="play-hero-chip-icon">🤖</span><span class="play-hero-chip-label">Opponent</span><strong>Queen AI</strong></div>
        <div class="play-hero-chip"><span class="play-hero-chip-icon">⚡</span><span class="play-hero-chip-label">Difficulty</span><strong>${difficulty}</strong></div>
        <div class="play-hero-chip"><span class="play-hero-chip-icon">🎨</span><span class="play-hero-chip-label">You</span><strong>${playerColor}</strong></div>
      </div>

      <div class="play-hero-actions">
        <button class="play-hero-cta" onclick="undoMove()" title="Undo">↩ Undo Move</button>
        <button class="play-hero-cta-secondary" onclick="getHint()" title="Hint">💡 Get Hint</button>
        <button class="play-hero-cta-secondary" onclick="flipBoard()" title="Flip Board">🔄 Flip Board</button>
      </div>
    </div>

    <div class="play-hero-status">
      <div class="play-hero-status-head">
        <span class="play-hero-status-label">Match Status</span>
        <span class="play-hero-live"><span class="play-hero-live-dot"></span> In Progress</span>
      </div>
      <div class="play-hero-status-turn" id="gameStatusCard">
        <span class="status-dot" id="statusDot"></span>
        <span id="gameStatusValue">${playerColor}'s Turn</span>
      </div>
      <div class="play-hero-status-grid">
        <div class="play-hero-status-item"><span class="phsi-label">Moves</span><strong class="phsi-value" id="moveCount">0</strong></div>
        <div class="play-hero-status-item"><span class="phsi-label">Opening</span><strong class="phsi-value phsi-small" id="openingName">—</strong></div>
        <div class="play-hero-status-item"><span class="phsi-label">AI</span><strong class="phsi-value phsi-small">${difficulty}</strong></div>
      </div>
    </div>
  </section>

  <!-- ============ MAIN ASYMMETRIC LAYOUT ============ -->
  <div class="play-layout">

    <!-- LEFT COLUMN: Players + captured + stats -->
    <aside class="play-left">
      <div class="play-left-label">Players</div>

      <div class="player-card player-card-top play-player-card play-player-card-you">
        <div class="player-card-glow"></div>
        <div class="play-player-avatar">${playerAvatar}</div>
        <div class="player-meta">
          <div class="player-name">You</div>
          <div class="player-sub">${playerColor} · Human</div>
          <div class="player-rating">★ ${playerRating}</div>
        </div>
        <div class="play-player-side">
          <div class="player-status">${playerStatus}</div>
          <div class="player-timer" id="playerTimer">00:00</div>
        </div>
      </div>

      <div class="player-card player-card-ai play-player-card play-player-card-ai">
        <div class="player-card-glow"></div>
        <div class="play-player-avatar ai">${aiAvatar}</div>
        <div class="player-meta">
          <div class="player-name">Queen AI</div>
          <div class="player-sub">${aiColor} · Computer</div>
          <div class="player-rating ai">★ ${aiRating}</div>
        </div>
        <div class="play-player-side">
          <div class="player-status ai">Level ${difficulty}</div>
          <div class="player-timer" id="aiTimer">00:00</div>
        </div>
      </div>

      <div class="play-card play-panel">
        <div class="play-card-head"><span class="play-card-icon">⚔️</span><h3>Captured</h3></div>
        <div class="captured-row"><span class="captured-label">🤍 White</span><span class="captured" id="capturedWhite">—</span></div>
        <div class="captured-row"><span class="captured-label">🖤 Black</span><span class="captured" id="capturedBlack">—</span></div>
      </div>

      <div class="play-card play-panel">
        <div class="play-card-head"><span class="play-card-icon">📊</span><h3>Game Stats</h3></div>
        <div class="game-stat-row"><span class="label">♟ Moves</span><span class="value" id="moveCount2">0</span></div>
        <div class="game-stat-row"><span class="label">📖 Opening</span><span class="value" id="openingName2">—</span></div>
        <div class="game-stat-row"><span class="label">🤍 White Win</span><span class="value" id="whiteWinPct">—</span></div>
        <div class="game-stat-row"><span class="label">🖤 Black Win</span><span class="value" id="blackWinPct">—</span></div>
        <div class="game-stat-row"><span class="label">🤝 Draw</span><span class="value" id="drawPct">—</span></div>
      </div>
    </aside>

    <!-- CENTER COLUMN: Board + turn + toolbar -->
    <main class="play-center">
      <div class="play-center-turn">
        <span class="play-center-turn-dot"></span>
        <span id="gameStatusValue2">${playerColor}'s Turn</span>
      </div>

      <div class="board-container play-board-wrap">
        <div class="board-frame-glow"></div>
        <div class="board-corner board-corner-tl"></div>
        <div class="board-corner board-corner-tr"></div>
        <div class="board-corner board-corner-bl"></div>
        <div class="board-corner board-corner-br"></div>
        <div id="board" class="fade-in"></div>
      </div>

      <div class="game-controls-bar play-controls">
        <button class="play-ctrl-btn primary" onclick="undoMove()" title="Undo">↩ Undo</button>
        <button class="play-ctrl-btn" onclick="getHint()" title="Hint">💡 Hint</button>
        <button class="play-ctrl-btn danger" onclick="resignGame()" title="Resign">🏳 Resign</button>
        <button class="play-ctrl-btn" onclick="flipBoard()" title="Flip Board">🔄 Flip</button>
        <div class="toggle-switch play-toggle" onclick="toggleHints()"><div class="toggle-track ${hintsActive}"><div class="toggle-thumb"></div></div>Moves</div>
      </div>

      <div id="liveReview" class="live-review play-live"><div id="beginnerCoach" class="coach-box">💡 Beginner Coach Ready</div><span class="live-review-hint">AI Analysis Waiting...</span></div>
    </main>

    <!-- RIGHT COLUMN: Move history + AI panel -->
    <aside class="play-right">
      <div class="play-right-label">Engine</div>

      <div class="moves-panel play-panel play-moves-panel">
        <div class="panel-header"><h3>Move History</h3></div>
        <div id="movesList" class="moves-list"></div>
      </div>

      <div class="ai-panel play-ai-panel">
        <div class="ai-panel-head">
          <div class="ai-panel-title"><span class="ai-float-orb"></span> AI Assistant</div>
          <span class="ai-status-badge" id="aiStatusBadge">Idle</span>
        </div>
        <div class="ai-thinking" id="aiThinking" style="display:none;">
          <div class="ai-spinner"></div>
          <span>Analyzing Position...</span>
        </div>
        <div class="ai-hero-metric">
          <span class="ai-hero-label">Evaluation</span>
          <span class="ai-hero-value" id="aiEvaluation">0.00</span>
        </div>
        <div class="ai-float-grid ai-metrics-grid">
          <div class="ai-float-item"><span class="ai-float-label">Best Move</span><span class="ai-float-value ai-float-value-accent" id="aiSuggestedMove">—</span></div>
          <div class="ai-float-item"><span class="ai-float-label">Win Prob</span><span class="ai-float-value" id="aiWinProb">—</span></div>
          <div class="ai-float-item"><span class="ai-float-label">Depth</span><span class="ai-float-value" id="aiDepth">—</span></div>
          <div class="ai-float-item"><span class="ai-float-label">Confidence</span><span class="ai-float-value" id="aiConfidence">—</span></div>
          <div class="ai-float-item"><span class="ai-float-label">Opening</span><span class="ai-float-value ai-float-opening" id="aiOpeningName">—</span></div>
          <div class="ai-float-item"><span class="ai-float-label">Insight</span><span class="ai-float-value ai-float-insight" id="aiInsight">—</span></div>
        </div>
        <div class="ai-float-progress">
          <div class="ai-float-progress-label"><span>Analysis</span><span id="aiProgressPct">0%</span></div>
          <div class="ai-float-progress-track"><div class="ai-float-progress-fill" id="aiProgressFill"></div></div>
        </div>
        <div class="ai-float-thinking"><span class="ai-float-spinner"></span><span id="aiThinkingText">Position ready</span></div>
      </div>
    </aside>
  </div>
</div>`;

  startPlayerTimers();
  startAIPanelAnimation();
  animateGameEntry();
  updateCapturedPieces();
}

export function flipBoard() {
  if (!state.board) return;
  const orientation = state.board.orientation() === 'white' ? 'black' : 'white';
  state.board.orientation(orientation);
}

function startPlayerTimers() {
  let whiteElapsedSec = 0;
  let blackElapsedSec = 0;
  let lastTickMs = Date.now();
  const formatClock = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };
  if (state.playerTimerInterval) clearInterval(state.playerTimerInterval);
  state.playerTimerInterval = setInterval(() => {
    const now = Date.now();
    const deltaSec = Math.max(0, Math.floor((now - lastTickMs) / 1000));
    if (deltaSec === 0) return;
    lastTickMs = now;
    const turn = state.game && typeof state.game.turn === 'function' ? state.game.turn() : null;
    if (turn === 'w') whiteElapsedSec += deltaSec;
    else if (turn === 'b') blackElapsedSec += deltaSec;
    const playerTimer = document.getElementById('playerTimer');
    const aiTimer = document.getElementById('aiTimer');
    const isPlayerWhite = state.playerColor === 'white';
    if (playerTimer) playerTimer.textContent = formatClock(isPlayerWhite ? whiteElapsedSec : blackElapsedSec);
    if (aiTimer) aiTimer.textContent = formatClock(isPlayerWhite ? blackElapsedSec : whiteElapsedSec);
  }, 250);
}

function startAIPanelAnimation() {
  if (aiPanelInterval) clearInterval(aiPanelInterval);
  let progress = 0;
  const fakeEvalStep = () => {
    const badge = document.getElementById('aiStatusBadge');
    const thinking = document.getElementById('aiThinking');
    const evalEl = document.getElementById('aiEvaluation');
    const depthEl = document.getElementById('aiDepth');
    const fill = document.getElementById('aiProgressFill');
    const pctEl = document.getElementById('aiProgressPct');
    const suggested = document.getElementById('aiSuggestedMove');
    const winProbEl = document.getElementById('aiWinProb');
    const confEl = document.getElementById('aiConfidence');
    const openingEl = document.getElementById('aiOpeningName');
    const insightEl = document.getElementById('aiInsight');
    const thinkingText = document.getElementById('aiThinkingText');
    if (state.pendingAIMove || state.waitingBestmove) {
      if (badge) { badge.textContent = 'Analyzing'; badge.classList.add('active'); }
      if (thinking) thinking.style.display = 'flex';
      if (fill) fill.style.width = progress + '%';
      if (pctEl) pctEl.textContent = progress + '%';
      progress = Math.min(92, progress + 4 + Math.floor(Math.random() * 8));
      if (evalEl) {
        const val = (Math.random() * 1.6 - 0.8).toFixed(2);
        evalEl.textContent = (val[0] !== '-' ? '+' : '') + val;
      }
      if (depthEl) depthEl.textContent = Math.floor(8 + Math.random() * 12);
      if (winProbEl) winProbEl.textContent = Math.floor(50 + Math.random() * 20) + '%';
      if (confEl) confEl.textContent = Math.floor(88 + Math.random() * 10) + '%';
      if (thinkingText) thinkingText.textContent = 'Analyzing position…';
    } else {
      if (badge) { badge.textContent = 'Ready'; badge.classList.remove('active'); }
      if (thinking) thinking.style.display = 'none';
      if (fill) fill.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      if (evalEl) evalEl.textContent = '0.00';
      if (depthEl) depthEl.textContent = '—';
      if (suggested && state.game && state.game.history().length > 0) {
        const lastMove = state.game.history()[state.game.history().length - 1];
        suggested.textContent = lastMove;
      }
      if (winProbEl) winProbEl.textContent = '—';
      if (confEl) confEl.textContent = '—';
      if (openingEl) openingEl.textContent = state.currentOpening || '—';
      if (insightEl) {
        const hist = state.game ? state.game.history().length : 0;
        if (hist === 0) insightEl.textContent = '—';
        else if (hist < 4) insightEl.textContent = 'Develop pieces';
        else if (hist < 8) insightEl.textContent = 'Control the center';
        else insightEl.textContent = 'Good position';
      }
      if (thinkingText) thinkingText.textContent = 'Position ready';
      progress = 0;
    }
  };
  fakeEvalStep();
  aiPanelInterval = setInterval(fakeEvalStep, 300);
}

function animateGameEntry() {
  const cards = document.querySelectorAll('.player-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = (i * 0.12) + 's';
    card.classList.add('game-entry');
  });
  const movesPanel = document.querySelector('.moves-panel');
  if (movesPanel) movesPanel.classList.add('slide-in');
  const aiPanel = document.querySelector('.ai-panel');
  if (aiPanel) aiPanel.classList.add('slide-in');
  const statusCard = document.getElementById('gameStatusCard');
  if (statusCard) statusCard.classList.add('status-pop');
}

export function toggleInGameHints() {
  toggleHints();
}

export function undoMove() {
  if (state.game.history().length >= 2) {
    state.game.undo();
    state.game.undo();
    state.board.position(state.game.fen());
  } else if (state.game.history().length === 1) {
    state.game.undo();
    state.board.position(state.game.fen());
  }
  updateMoveCount();
}

export function getHint() {
  if (!state.gameEngineReady && !state.engineReady) return;
  // Hint can be slower but should not interrupt gameplay; for now keep old behavior.
}

export function resignGame() {
  if (state.game.game_over()) return;
  if (confirm('Are you sure you want to resign?')) {
    const winner = state.playerColor === 'white' ? 'Black' : 'White';
    state.board.draggable = false;
    const status = document.getElementById('gameStatusValue');
    const status2 = document.getElementById('gameStatusValue2');
    const text = '🏳 ' + winner + ' wins (resignation)';
    if (status) status.innerHTML = text;
    if (status2) status2.innerHTML = text;
    state.game = new window.Chess();
    saveGame(winner);
  }
}

export function updateMoveCount() {
  const moveCount = document.getElementById('moveCount');
  const moveCount2 = document.getElementById('moveCount2');
  const history = state.game ? state.game.history() : [];
  if (moveCount) moveCount.textContent = history.length;
  if (moveCount2) moveCount2.textContent = history.length;
  const list = document.getElementById('movesList');
  if (!list) return;
  let html = '';
  for (let i = 0; i < history.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const white = history[i];
    const black = history[i + 1];
    html += `<div class="move-row"><span class="move-number">${moveNumber}.</span><span class="move-san white">${white || ''}</span><span class="move-san black">${black || ''}</span></div>`;
  }
  list.innerHTML = html;
  if (list.scrollHeight > list.clientHeight) {
    list.scrollTop = list.scrollHeight;
  }
  // Keep captured pieces and stats in sync after every move
  updateCapturedPieces();
}

export function updateCapturedPieces() {
  if (!state.game) return;
  const whiteCap = document.getElementById('capturedWhite');
  const blackCap = document.getElementById('capturedBlack');
  if (!whiteCap && !blackCap) return;

  // Walk through the game history and tally captures.
  const capturedByWhite = []; // pieces White captured (black pieces taken)
  const capturedByBlack = []; // pieces Black captured (white pieces taken)
  const moves = state.game.history({ verbose: true });
  for (const m of moves) {
    if (!m.captured) continue;
    if (m.color === 'w') capturedByWhite.push(pieceSymbol(m.captured));
    else capturedByBlack.push(pieceSymbol(m.captured));
  }

  if (whiteCap) whiteCap.innerHTML = capturedByWhite.length ? capturedByWhite.join(' ') : '—';
  if (blackCap) blackCap.innerHTML = capturedByBlack.length ? capturedByBlack.join(' ') : '—';

  // Opening name sync
  const openingNameEl = document.getElementById('openingName');
  const openingName2El = document.getElementById('openingName2');
  const aiOpeningEl = document.getElementById('aiOpeningName');
  const opening = state.currentOpening || 'Unknown Opening';
  if (openingNameEl) openingNameEl.textContent = opening;
  if (openingName2El) openingName2El.textContent = opening;
  if (aiOpeningEl) aiOpeningEl.textContent = opening;
}

function pieceSymbol(piece) {
  const symbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
  return symbols[piece] || piece;
}

function updatePlayerStatus() {
  const turn = state.game && typeof state.game.turn === 'function' ? state.game.turn() : null;
  const isPlayerTurn = turn === state.playerColor[0];
  const playerStatusEl = document.querySelector('.play-player-card-you .player-status');
  const aiStatusEl = document.querySelector('.play-player-card-ai .player-status');
  if (playerStatusEl) {
    playerStatusEl.textContent = isPlayerTurn ? 'Active' : 'Thinking...';
    playerStatusEl.classList.toggle('ai', !isPlayerTurn);
  }
  if (aiStatusEl) {
    aiStatusEl.textContent = isPlayerTurn ? 'Idle' : 'Thinking...';
  }
}

function getOpeningFromFirstPlyMoves(first10Ply) {
  const joined = first10Ply.map((m) => m.san).join(' ');
  if (joined.includes('e4 e5 Nf3 Nc6 Bb5')) return { opening_name: 'Ruy Lopez', opening_eco: 'C60' };
  if (joined.includes('e4 e5 Nf3 Nc6 Bc4')) return { opening_name: 'Italian Game', opening_eco: 'C50' };
  if (joined.includes('e4 e5 Nf3 Nf6')) return { opening_name: "Petrov's Defense", opening_eco: 'C42' };
  if (joined.includes('e4 e5 f4')) return { opening_name: "King's Gambit", opening_eco: 'C30' };
  if (joined.includes('e4 c5')) return { opening_name: 'Sicilian Defense', opening_eco: 'B20' };
  if (joined.includes('e4 e6')) return { opening_name: 'French Defense', opening_eco: 'C00' };
  if (joined.includes('e4 c6')) return { opening_name: 'Caro-Kann Defense', opening_eco: 'B10' };
  if (joined.includes('e4 d5')) return { opening_name: 'Scandinavian Defense', opening_eco: 'B01' };
  if (joined.includes('d4 d5 c4')) return { opening_name: "Queen's Gambit", opening_eco: 'D00' };
  return { opening_name: 'Unknown Opening', opening_eco: 'Unknown' };
}

async function maybeUpdateLiveInference() {
  const ply = state.game.history().length;

  // First prediction should happen after 10 full moves => 20 plies
  const FIRST_PREDICTION_PLY = 20;
  if (ply < FIRST_PREDICTION_PLY) return;

  // Prevent duplicate requests for the same stable board state
  if (state.lastPredictedPly === ply) return;

  // Do not send while Stockfish is still thinking / engine not settled
  if (state.pendingAIMove || state.waitingBestmove) return;

  // Single-flight: never allow parallel prediction requests
  if (state.livePredictionInFlight) return;

  state.livePredictionInFlight = true;
  state.lastPredictedPly = ply;

  const history = state.game.history();
  const first10PlySan = history.slice(0, 10);
  const first_10_moves = history.slice(0, 10);

  const white_rating = state.whiteRating ?? 1200;
  const black_rating = state.blackRating ?? 1200;

  const { opening_name, opening_eco } = getOpeningFromFirstPlyMoves(first10PlySan.map((san) => ({ san })));

  // Keep opening synchronized for both Play->save->Analysis
  state.currentOpening = opening_name || 'Unknown Opening';

  const payload = {
    first_10_moves,
    white_rating,
    black_rating,
    opening_name,
    opening_eco
  };

  try {
    const res = await fetch('https://chess-ai-6gwx.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Update opening on screen as soon as we have it for this stable state
    const openingEl = document.getElementById('openingName');
    if (openingEl) openingEl.textContent = state.currentOpening || 'Unknown Opening';

    if (!res.ok) throw new Error(`Inference API error: ${res.status}`);

    const data = await res.json();

    const whiteWinRaw = data.white_win_pct ?? data.whiteWinPct ?? data.whiteWin ?? data.white_win ?? data.white_probability ?? null;
    const blackWinRaw = data.black_win_pct ?? data.blackWinPct ?? data.blackWin ?? data.black_win ?? data.black_probability ?? null;
    const drawRaw = data.draw_pct ?? data.drawPct ?? data.draw ?? data.draw_probability ?? null;

    const whiteWin = whiteWinRaw == null ? null : (whiteWinRaw <= 1 ? whiteWinRaw * 100 : whiteWinRaw);
    const blackWin = blackWinRaw == null ? null : (blackWinRaw <= 1 ? blackWinRaw * 100 : blackWinRaw);
    const draw = drawRaw == null ? null : (drawRaw <= 1 ? drawRaw * 100 : drawRaw);

    state.livePrediction.whiteWin = whiteWin;
    state.livePrediction.blackWin = blackWin;
    state.livePrediction.draw = draw;

    // existing UI
    const whiteEl = document.getElementById('whiteWinPct');
    const blackEl = document.getElementById('blackWinPct');
    const drawEl = document.getElementById('drawPct');
    if (whiteEl) whiteEl.textContent = whiteWin == null ? '—' : `${whiteWin.toFixed(2)}%`;
    if (blackEl) blackEl.textContent = blackWin == null ? '—' : `${blackWin.toFixed(2)}%`;
    if (drawEl) drawEl.textContent = draw == null ? '—' : `${draw.toFixed(2)}%`;

    // Minimal additions if elements exist in DOM.
    const predictedWinnerEl = document.getElementById('predictedWinner');
    const confidenceEl = document.getElementById('predictionConfidence');

    const winnerRaw = data.predicted_winner ?? data.predictedWinner ?? data.winner ?? null;
    const confidenceRaw = data.confidence ?? data.prediction_confidence ?? data.confidence_score ?? null;

    if (predictedWinnerEl) predictedWinnerEl.textContent = winnerRaw ? String(winnerRaw) : '—';
    if (confidenceEl) {
      const conf = confidenceRaw == null ? null : (confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw);
      confidenceEl.textContent = conf == null ? '—' : `${Number(conf).toFixed(2)}%`;
    }

    // Make prediction visible after successful response (only if a container exists).
    const liveReviewEl = document.getElementById('liveReview');
    if (liveReviewEl) liveReviewEl.style.display = 'block';

  } catch {
    // no-op
  } finally {
    state.livePredictionInFlight = false;
  }
}


export function showHints(square) {
  if (!state.hintsEnabled) return;
  state.game.moves({ square, verbose: true }).forEach((move) => {
    const targetSquare = document.querySelector('.square-' + move.to);
    if (targetSquare) targetSquare.style.boxShadow = 'inset 0 0 0 4px #a855f7';
  });
}

export function removeHints() {
  document.querySelectorAll('[class*="square-"]').forEach((square) => {
    square.style.boxShadow = '';
  });
}

export function loadPlay() {
  if (state.gameTimerInterval) clearInterval(state.gameTimerInterval);
  state.gameTimerInterval = null;
  state.gameStartTime = null;
  const selectedWhite = state.selectedColor === 'white' ? 'selected' : '';
  const selectedBlack = state.selectedColor === 'black' ? 'selected' : '';
  document.getElementById('content').innerHTML = `<div class="start-screen-wrapper"><div class="start-card"><span class="start-card-icon">♛</span><h2>Start a New Match</h2><p class="sub-text">Choose your preferences and start playing.</p><div class="color-row"><button class="${selectedWhite}" onclick="setColor('white')">🤍 White</button><button class="${selectedBlack}" onclick="setColor('black')">🖤 Black</button><button class="full-btn" onclick="setRandomColor()" style="min-width:90px;padding:9px 12px;margin:0">🎲 Random</button></div><div><p class="difficulty-label">AI Difficulty</p><select id="difficultySelect"><option value="beginner">Beginner</option><option value="intermediate" selected>Intermediate</option><option value="advanced">Advanced</option><option value="master">Master</option></select></div><div class="toggle-switch" onclick="toggleHints()"><div class="toggle-track"><div class="toggle-thumb"></div></div>Show Legal Moves</div><button class="start-btn" onclick="startGame()">▶ Start Match</button><p class="footer-text">Play against our AI and improve your skills.</p><div id="gameResult"></div></div></div>`;
}

export function viewGameAnalysis() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();

  if (state.currentGameId) {
    if (state.gameTimerInterval) clearInterval(state.gameTimerInterval);
    window.location.href = 'index.html?analyze=' + state.currentGameId;
  } else {
    alert('Game ID not available.');
    loadMatches();
  }
}

export function playAgain() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
  state.game = new window.Chess();
  state.currentGameId = null;
  loadPlay();
}

function initGameEngine() {
  if (state.gameEngine) return;

  clearEngineListeners('game');

  initStockfishEngine((line) => {
    if (state.pendingAIMove && line && typeof line === 'string' && line.startsWith('bestmove')) {
      const move = line.split(' ')[1];
if (move !== '(none)' && move && move.length >= 4) {
        state.game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: 'q' });
        state.board.position(state.game.fen());
        checkGameStatus();
        updateMoveCount();
        updatePlayerStatus();
      }

      state.pendingAIMove = false;
      state.waitingBestmove = false;
      state.engineBusy = false;

      // After Stockfish is settled and flags are cleared, update prediction
      maybeUpdateLiveInference();
    }
  }, 'game');
}

export { makeAIMove, checkGameStatus };

