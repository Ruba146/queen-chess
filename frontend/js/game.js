import { state } from './state.js';
import { apiFetch, getToken } from './utils.js';
import { showGameOverModal } from './ui.js';
import { initEngine as initStockfishEngine, postEngineMessage } from './stockfish.js';

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
  console.log('[makeAIMove] enter pendingAIMove(before):', state.pendingAIMove, 'engineReady:', state.engineReady, 'engineBusy:', state.engineBusy);
  if (!state.game || state.game.game_over()) {
    console.log('[makeAIMove] exit (no game or game over)');
    return;
  }
  if (!state.engine) {
    console.log('[makeAIMove] exit (no engine) -> initStockfishEngine');
    initStockfishEngine(() => makeAIMove());
    return;
  }
  state.pendingAIMove = true;
  console.log('[makeAIMove] pendingAIMove set true');

  const level = state.aiSettings[state.aiLevel] || state.aiSettings.intermediate;
  const fen = state.game.fen();
  console.log('[makeAIMove] fen:', fen, 'level:', level);

  postEngineMessage('stop');
  console.log('[makeAIMove] posted stop');
  postEngineMessage('position fen ' + fen);
  console.log('[makeAIMove] posted position');
  postEngineMessage('setoption name Skill Level value ' + level.skill);
  console.log('[makeAIMove] posted setoption Skill Level', level.skill);
  postEngineMessage('go depth ' + level.depth);
  console.log('[makeAIMove] posted go depth', level.depth);
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
  console.log('[onDrop] enter pendingAIMove:', state.pendingAIMove, 'turn:', state.game?.turn?.());
  if (state.pendingAIMove) {
    console.log('[onDrop] early return snapback because pendingAIMove is true');
    return 'snapback';
  }
  const piece = state.game.get(source);
  if (!piece || piece.color !== state.playerColor[0] || state.game.turn() !== state.playerColor[0]) {
    console.log('[onDrop] snapback due to invalid piece/turn. piece:', piece, 'playerColor:', state.playerColor);
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
  postEngineMessage('position fen ' + state.game.fen());
  console.log('[onDrop] posted live position fen', state.game.fen());
  state.pendingLiveAnalysis = true;
  postEngineMessage('go depth 12');
  console.log('[onDrop] posted live go depth 12');

  checkGameStatus();
  updateMoveCount();
  console.log('PLY:', state.game.history().length);
  maybeUpdateLiveInference();

  if (!state.game.game_over()) setTimeout(() => makeAIMove(), 300);
  return move;
}


function checkGameStatus() {
  const status = document.getElementById('gameStatusValue');
  if (state.game.in_checkmate()) {
    const winner = state.game.turn() === 'w' ? 'Black' : 'White';
    if (status) status.innerHTML = '🏆 ' + winner + ' wins!';
    state.board.draggable = false;
    setTimeout(() => saveGame(winner), 500);
  } else if (state.game.in_draw()) {
    if (status) status.innerHTML = '🤝 Draw!';
    state.board.draggable = false;
    setTimeout(() => saveGame('draw'), 500);
  } else if (status) {
    const turn = state.game.turn() === 'w' ? 'White' : 'Black';
    status.innerHTML = turn + "'s Turn";
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
    duration = Math.floor(durationSec / 60) + 'm ' + durationSec % 60 + 's';
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
    showGameOverModal(result, state.game.history().length, state.currentAccuracy, duration, data.analysis || {}, data.ratingChange || 0, data.newRating || 1200, data.rankAfterGame || 'Beginner', data.playerLevelAfterGame || 'Beginner');
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
  document.getElementById('content').innerHTML = `<div class="game-layout"><div class="game-left"><div id="board" class="fade-in"></div><div class="game-controls-bar"><button onclick="undoMove()">↩ Undo</button><button onclick="getHint()">💡 Hint</button><button onclick="resignGame()">🏳 Resign</button><div class="toggle-switch" onclick="toggleHints()"><div class="toggle-track ${hintsActive}"><div class="toggle-thumb"></div></div>Show Legal Moves</div></div><div id="liveReview" class="live-review"><div id="beginnerCoach" class="coach-box">💡 Beginner Coach Ready</div>AI Analysis Waiting...</div></div><div class="game-right"><div class="game-info-panel"><div class="panel-header"><h3>Game Info</h3></div><div class="game-info-row-item"><span class="label">🤍 White Timer</span><span class="value timer" id="whiteTimer">00:00</span></div><div class="game-info-row-item"><span class="label">🖤 Black Timer</span><span class="value timer" id="blackTimer">00:00</span></div><div class="game-info-row-item"><span class="label">🎯 Difficulty</span><span class="value">${state.aiLevel.charAt(0).toUpperCase() + state.aiLevel.slice(1)}</span></div><div class="game-info-row-item"><span class="label">♟ Moves</span><span class="value" id="moveCount">0</span></div><div class="game-info-row-item"><span class="label">📊 Status</span><span class="status-badge" id="gameStatusValue">${state.playerColor}'s Turn</span></div><div class="game-info-row-item"><span class="label">⚔ Captured</span><span class="captured" id="capturedPieces">—</span></div><div class="game-info-row-item"><span class="label">🤍 White Win %</span><span class="captured" id="whiteWinPct">—</span></div><div class="game-info-row-item"><span class="label">🖤 Black Win %</span><span class="captured" id="blackWinPct">—</span></div><div class="game-info-row-item"><span class="label">🤝 Draw %</span><span class="captured" id="drawPct">—</span></div></div></div></div>`;

  startGameTimer();
}

function startGameTimer() {
  if (state.gameTimerInterval) clearInterval(state.gameTimerInterval);

  // Preserve existing UI (#whiteTimer / #blackTimer). Only the active side changes.
  // Current project uses a simple elapsed-style clock UI (not a fixed time control), so we keep that.
  let whiteElapsedSec = 0;
  let blackElapsedSec = 0;
  let lastTickMs = Date.now();

  const formatClock = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  state.gameTimerInterval = setInterval(() => {
    const now = Date.now();
    const deltaSec = Math.max(0, Math.floor((now - lastTickMs) / 1000));
    if (deltaSec === 0) return;
    lastTickMs = now;

    const turn = state.game && typeof state.game.turn === 'function' ? state.game.turn() : null;
    if (turn === 'w') whiteElapsedSec += deltaSec;
    else if (turn === 'b') blackElapsedSec += deltaSec;

    const whiteTimer = document.getElementById('whiteTimer');
    const blackTimer = document.getElementById('blackTimer');
    if (whiteTimer) whiteTimer.textContent = formatClock(whiteElapsedSec);
    if (blackTimer) blackTimer.textContent = formatClock(blackElapsedSec);
  }, 250);
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
  if (!state.engine) return;
  postEngineMessage('stop');
  setTimeout(() => {
    postEngineMessage('position fen ' + state.game.fen());
    postEngineMessage('go depth 10');
    const coach = document.getElementById('beginnerCoach');
    if (coach) coach.innerHTML = '💡 Analyzing best move...';

    const handler = (event) => {
      const line = event.data;
      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && move.length >= 4) {
          const coach2 = document.getElementById('beginnerCoach');
          if (coach2) coach2.innerHTML = '💡 Hint: Try ' + move.substring(0, 2) + ' → ' + move.substring(2, 4);
        }
        state.engine.removeEventListener('message', handler);
      }
    };
    state.engine.addEventListener('message', handler);
  }, 100);
}

export function resignGame() {
  if (state.game.game_over()) return;
  if (confirm('Are you sure you want to resign?')) {
    const winner = state.playerColor === 'white' ? 'Black' : 'White';
    state.board.draggable = false;
    const status = document.getElementById('gameStatusValue');
    if (status) status.innerHTML = '🏳 ' + winner + ' wins (resignation)';
    state.game = new window.Chess();
    saveGame(winner);
  }
}

export function updateMoveCount() {
  const moveCount = document.getElementById('moveCount');
  if (moveCount) moveCount.textContent = state.game.history().length;
}

function setWinPctUI({ whiteWin, blackWin, draw }) {
  const whiteEl = document.getElementById('whiteWinPct');
  const blackEl = document.getElementById('blackWinPct');
  const drawEl = document.getElementById('drawPct');
  if (whiteEl) whiteEl.textContent = whiteWin == null ? '—' : `${whiteWin.toFixed(2)}%`;
  if (blackEl) blackEl.textContent = blackWin == null ? '—' : `${blackWin.toFixed(2)}%`;
  if (drawEl) drawEl.textContent = draw == null ? '—' : `${draw.toFixed(2)}%`;
}

function getOpeningFromFirstPlyMoves(first10Ply) {
  // Fast best-effort mapping; real backend can do richer opening detection.
  const joined = first10Ply.map((m) => m.san).join(' ');
  if (joined.includes('e4 e5 Nf3 Nc6 Bb5')) return { opening_name: "Ruy Lopez", opening_eco: 'C60' };
  if (joined.includes('e4 e5 Nf3 Nc6 Bc4')) return { opening_name: "Italian Game", opening_eco: 'C50' };
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
  if (ply < 10) return;
  if (state.lastPredictionPlyCount === ply) return;
  state.lastPredictionPlyCount = ply;

  // Only send the first 10 half-moves (ply)
  const history = state.game.history();
  const first10PlySan = history.slice(0, 10);

  const first_10_moves = state.game
    .history()
    .slice(0, 10);



  // Ratings: best-effort fallbacks (this project currently doesn't track per-side live ratings in state)
  const white_rating = state.whiteRating ?? 1200;
  const black_rating = state.blackRating ?? 1200;

  const { opening_name, opening_eco } = getOpeningFromFirstPlyMoves(first10PlySan.map((san) => ({ san })));

  const payload = {
    first_10_moves,
    white_rating,
    black_rating,
    opening_name,
    opening_eco
  };


  console.log('Calling AI...');
  try {
    const res = await fetch('https://chess-ai-6gwx.onrender.com/predict', {


      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Inference API error: ${res.status}`);

    const data = await res.json();

    // Expected shape: { white_win_pct, black_win_pct, draw_pct } OR { whiteWinPct, ... }
    const whiteWinRaw = data.white_win_pct ?? data.whiteWinPct ?? data.whiteWin ?? data.white_win ?? data.white_probability ?? null;
    const blackWinRaw = data.black_win_pct ?? data.blackWinPct ?? data.blackWin ?? data.black_win ?? data.black_probability ?? null;
    const drawRaw = data.draw_pct ?? data.drawPct ?? data.draw ?? data.draw_probability ?? null;

    // API seems to return probabilities in [0..1]; convert to percent for display.
    const whiteWin = whiteWinRaw == null ? null : (whiteWinRaw <= 1 ? whiteWinRaw * 100 : whiteWinRaw);
    const blackWin = blackWinRaw == null ? null : (blackWinRaw <= 1 ? blackWinRaw * 100 : blackWinRaw);
    const draw = drawRaw == null ? null : (drawRaw <= 1 ? drawRaw * 100 : drawRaw);


    state.livePrediction.whiteWin = whiteWin;
    state.livePrediction.blackWin = blackWin;
    state.livePrediction.draw = draw;

    setWinPctUI({ whiteWin, blackWin, draw });
  } catch (e) {
    // Silent fail: keep UI as-is or show dashes
    setWinPctUI({ whiteWin: null, blackWin: null, draw: null });
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
  if (state.engine) return;
  initStockfishEngine((line) => {
    if (state.pendingLiveAnalysis && line.includes('score cp')) {
      const match = line.match(/score cp (-?\d+)/);
      if (match) {
        const score = parseInt(match[1], 10);
        let review = 'Good Move';
        if (score > 250) review = '🔥 Brilliant';
        else if (score > 120) review = '✨ Great Move';
        else if (score < -250) review = '❌ Blunder';
        else if (score < -100) review = '⚠ Mistake';
        const liveReview = document.getElementById('liveReview');
        if (liveReview) liveReview.innerHTML = review;
        state.pendingLiveAnalysis = false;
      }
    }
    if (state.pendingReviewAnalysis && line.includes('score cp')) {
      const match = line.match(/score cp (-?\d+)/);
      if (!match) return;
      const score = parseInt(match[1], 10);
      let title = 'Best Move';
      let color = '#22c55e';
      if (score < -300) { title = 'Blunder'; color = '#ef4444'; }
      else if (score < -120) { title = 'Mistake'; color = '#f97316'; }
      else if (score > 250) { title = 'Brilliant'; color = '#06b6d4'; }
      else if (score > 120) { title = 'Great Move'; color = '#a855f7'; }
      document.getElementById('moveReview').innerHTML = `<div class="move-review-box"><h4>Move ${state.currentMoveIndex + 1}</h4><div class="eval" style="color:${color}">${title}</div><div class="quality">Move: ${state.analysisMoves[state.currentMoveIndex]} | Eval: ${(score / 100).toFixed(2)}</div></div>`;
      state.pendingReviewAnalysis = false;
    }
    if (line.includes('bestmove')) {
      console.log('[engine listener] received bestmove line, pendingAIMove:', state.pendingAIMove, 'line:', line);
      state.engineBusy = false;
    }
    if (state.pendingAIMove && line.startsWith('bestmove')) {
      console.log('[engine listener] applying bestmove. pendingAIMove:', state.pendingAIMove, 'line:', line);
      const move = line.split(' ')[1];

      if (move === '(none)' || move.length < 4) return;
      state.game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: 'q' });
      state.board.position(state.game.fen());
      checkGameStatus();
      state.pendingAIMove = false;
    }
  });
}

export { makeAIMove, checkGameStatus };

import { loadMatches } from './dashboard.js';
