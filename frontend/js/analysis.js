import { state } from './state.js';
import { apiFetch } from './utils.js';
import { initEngine, postEngineMessage } from './stockfish.js';

// Ensure we only ever use the analysis worker for post-game analysis.
const ANALYSIS_DEPTH = 12;



export async function analyzeGame(gameId) {
  try {
    const analysis = await apiFetch('/api/analysis/' + gameId);
    const gameData = analysis;

    // Build a final page with TWO tabs:
    // - Analysis: keep current AI Performance Report
    // - Moves: restore legacy move viewer (with Stockfish move analysis)
const accuracyColor = gameData.accuracy >= 80 ? '#16a34a' : gameData.accuracy >= 60 ? '#d97706' : '#dc2626';
    const perfColor = gameData.performanceScore >= 80 ? '#16a34a' : gameData.performanceScore >= 60 ? '#d97706' : '#dc2626';
    const result = gameData.result || 'Unknown';
    const resultIsWin = String(result).toLowerCase().includes('win');
    const resultIsDraw = String(result).toLowerCase() === 'draw';

document.getElementById('content').innerHTML = `
      <div class="anl-page">

        <!-- ============ HERO ============ -->
        <section class="anl-hero js-reveal">
          <div class="anl-hero-glow anl-hero-glow-1"></div>
          <div class="anl-hero-glow anl-hero-glow-2"></div>
          <div class="anl-hero-piece anl-hero-queen">♛</div>
          <div class="anl-hero-piece anl-hero-knight">♞</div>
          <div class="anl-hero-content">
            <span class="anl-hero-badge"><span class="anl-hero-badge-dot"></span> AI PERFORMANCE REPORT</span>
            <h1 class="anl-hero-title">Game <span class="anl-hero-accent">Analysis</span></h1>
            <p class="anl-hero-sub">${gameData.opening || 'Unknown Opening'} • ${gameData.totalMoves || 0} moves • ${gameData.accuracy || 0}% accuracy</p>
            <div class="anl-hero-chips">
              <span class="rank-badge ${(gameData.rankAfterGame || 'beginner').toLowerCase()}">🏅 ${gameData.rankAfterGame || 'Beginner'}</span>
              <span class="level-badge ${(gameData.playerLevelAfterGame || 'beginner').toLowerCase()}">📊 ${gameData.playerLevelAfterGame || 'Beginner'}</span>
              ${gameData.ratingChange !== undefined ? `<span class="anl-rating-chip" style="color:${gameData.ratingChange > 0 ? '#16a34a' : gameData.ratingChange < 0 ? '#dc2626' : '#71717a'};">Rating: ${gameData.ratingChange > 0 ? '+' : ''}${gameData.ratingChange}</span>` : ''}
            </div>
            <div class="anl-hero-actions">
              <button class="anl-hero-tab-btn active" id="tabBtnAnalysis" onclick="openAnalysisTab('analysis')">📊 Analysis</button>
              <button class="anl-hero-tab-btn" id="tabBtnMoves" onclick="openAnalysisTab('moves')">♟ Moves</button>
            </div>
          </div>
          <div class="anl-hero-score">
            <div class="anl-hero-score-ring">
              <div class="anl-hero-score-inner">
                <span class="anl-hero-score-value" style="color:${accuracyColor};">${gameData.accuracy || 0}%</span>
                <span class="anl-hero-score-label">Accuracy</span>
              </div>
            </div>
            <div class="anl-hero-score-meta">
              <div class="anl-hero-score-item"><span class="anl-hsi-label">Result</span><span class="anl-hsi-value ${resultIsWin ? 'win' : resultIsDraw ? 'draw' : ''}">${result}</span></div>
              <div class="anl-hero-score-item"><span class="anl-hsi-label">Performance</span><span class="anl-hsi-value" style="color:${perfColor};">${gameData.performanceScore || 0}%</span></div>
              <div class="anl-hero-score-item"><span class="anl-hsi-label">Moves</span><span class="anl-hsi-value">${gameData.totalMoves || 0}</span></div>
            </div>
          </div>
        </section>

        <div id="analysisTab" class="analysis-tab" style="display:block;">
          <div class="anl-report">

            <!-- ============ KPI GRID ============ -->
            <section class="anl-kpis">
              <div class="anl-kpi anl-kpi-accent">
                <span class="anl-kpi-icon">🎯</span>
                <div class="anl-kpi-body"><span class="anl-kpi-label">Accuracy</span><span class="anl-kpi-value" style="color:${accuracyColor};">${gameData.accuracy || 0}%</span></div>
              </div>
              <div class="anl-kpi">
                <span class="anl-kpi-icon">📊</span>
                <div class="anl-kpi-body"><span class="anl-kpi-label">Performance</span><span class="anl-kpi-value" style="color:${perfColor};">${gameData.performanceScore || 0}%</span></div>
              </div>
              <div class="anl-kpi">
                <span class="anl-kpi-icon">♟</span>
                <div class="anl-kpi-body"><span class="anl-kpi-label">Total Moves</span><span class="anl-kpi-value">${gameData.totalMoves || 0}</span></div>
              </div>
              <div class="anl-kpi">
                <span class="anl-kpi-icon">🎮</span>
                <div class="anl-kpi-body"><span class="anl-kpi-label">Playing Style</span><span class="anl-kpi-value anl-kpi-small">${gameData.playingStyle || 'Balanced'}</span></div>
              </div>
              <div class="anl-kpi">
                <span class="anl-kpi-icon">📉</span>
                <div class="anl-kpi-body"><span class="anl-kpi-label">Avg CP Loss</span><span class="anl-kpi-value">${gameData.averageCentipawnLoss || 0}</span></div>
              </div>
            </section>

            <!-- ============ MOVE QUALITY ============ -->
            <section class="anl-section">
              <div class="anl-section-head">
                <span class="anl-eyebrow">Move Quality</span>
                <h2>Performance <span class="anl-accent">Breakdown</span></h2>
              </div>
              <div class="anl-quality-grid">
                <div class="anl-quality-card anl-quality-brilliant"><span class="anl-quality-icon">💎</span><span class="anl-quality-value">${gameData.brilliantMoves || 0}</span><span class="anl-quality-label">Brilliant Moves</span></div>
                <div class="anl-quality-card anl-quality-best"><span class="anl-quality-icon">✅</span><span class="anl-quality-value">${gameData.bestMoves || 0}</span><span class="anl-quality-label">Best Moves</span></div>
                <div class="anl-quality-card anl-quality-inaccuracy"><span class="anl-quality-icon">⚡</span><span class="anl-quality-value">${gameData.inaccuracies || 0}</span><span class="anl-quality-label">Inaccuracies</span></div>
                <div class="anl-quality-card anl-quality-mistake"><span class="anl-quality-icon">⚠</span><span class="anl-quality-value">${gameData.mistakes || 0}</span><span class="anl-quality-label">Mistakes</span></div>
                <div class="anl-quality-card anl-quality-blunder"><span class="anl-quality-icon">❌</span><span class="anl-quality-value">${gameData.blunders || 0}</span><span class="anl-quality-label">Blunders</span></div>
                <div class="anl-quality-card anl-quality-missed"><span class="anl-quality-icon">🎯</span><span class="anl-quality-value">${gameData.missedWins || 0}</span><span class="anl-quality-label">Missed Wins</span></div>
              </div>
            </section>

            <!-- ============ PHASE + EVAL GRAPH ============ -->
            <section class="anl-section anl-section-split">
              <div class="anl-phase-card">
                <div class="anl-section-head">
                  <span class="anl-eyebrow">Game Phases</span>
                  <h2>Phase <span class="anl-accent">Analysis</span></h2>
                </div>
                <div class="phase-score">
                  <div class="phase-name">📖 Opening</div>
                  <div class="phase-bar"><div class="phase-fill" style="width:${gameData.openingScore || 50}%;background:linear-gradient(90deg,#7c3aed,#a855f7);"></div></div>
                  <div class="phase-value" style="color:#a855f7;">${gameData.openingScore || 50}%</div>
                </div>
                <div class="phase-score">
                  <div class="phase-name">⚔ Middle Game</div>
                  <div class="phase-bar"><div class="phase-fill" style="width:${gameData.middleGameScore || 50}%;background:linear-gradient(90deg,#7c3aed,#c084fc);"></div></div>
                  <div class="phase-value" style="color:#c084fc;">${gameData.middleGameScore || 50}%</div>
                </div>
                <div class="phase-score">
                  <div class="phase-name">♚ Endgame</div>
                  <div class="phase-bar"><div class="phase-fill" style="width:${gameData.endgameScore || 50}%;background:linear-gradient(90deg,#7c3aed,#e879f9);"></div></div>
                  <div class="phase-value" style="color:#e879f9;">${gameData.endgameScore || 50}%</div>
                </div>
              </div>
              <div class="anl-graph-card">
                <div class="anl-section-head">
                  <span class="anl-eyebrow">Evaluation</span>
                  <h2>Graph <span class="anl-accent">Trend</span></h2>
                </div>
                <div class="graph-container anl-graph-container" id="evalGraphContainer">
                  <canvas id="evalCanvas" class="graph-canvas"></canvas>
                </div>
                <div class="graph-labels">
                  <span>Move 1</span>
                  <span style="color:#16a34a;">Best Line</span>
                  <span style="color:#7c3aed;">Your Moves</span>
                  <span>Move ${gameData.totalMoves || 0}</span>
                </div>
              </div>
            </section>

            <!-- ============ STRENGTHS / WEAKNESSES ============ -->
            <section class="anl-section anl-section-duo">
              ${gameData.strengths && gameData.strengths.length > 0 ? `
              <div class="anl-strength-card">
                <div class="anl-section-head">
                  <span class="anl-eyebrow anl-eyebrow-green">Strengths</span>
                  <h2>What went <span class="anl-accent-green">right</span></h2>
                </div>
                ${gameData.strengths.map((item) => `<div class="strength-item">✓ ${item}</div>`).join('')}
              </div>` : ''}
              ${gameData.weaknesses && gameData.weaknesses.length > 0 ? `
              <div class="anl-weakness-card">
                <div class="anl-section-head">
                  <span class="anl-eyebrow anl-eyebrow-red">Areas to Improve</span>
                  <h2>Where to <span class="anl-accent-red">grow</span></h2>
                </div>
                ${gameData.weaknesses.map((item) => `<div class="weakness-item">✗ ${item}</div>`).join('')}
              </div>` : ''}
            </section>

            <!-- ============ PERFORMANCE METRICS ============ -->
            <section class="anl-section">
              <div class="anl-section-head">
                <span class="anl-eyebrow">Skill Metrics</span>
                <h2>Performance <span class="anl-accent">Metrics</span></h2>
              </div>
              <div class="report-grid anl-metrics-grid">
                <div class="report-item"><div class="item-label">Tactical Ability</div><div class="item-value" style="font-size:16px;">${gameData.tacticalAbilityScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">Positional Play</div><div class="item-value" style="font-size:16px;">${gameData.positionalPlayScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">Decision Making</div><div class="item-value" style="font-size:16px;">${gameData.decisionMakingScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">Consistency</div><div class="item-value" style="font-size:16px;">${gameData.consistencyScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">Piece Activity</div><div class="item-value" style="font-size:16px;">${gameData.pieceActivityScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">King Safety</div><div class="item-value" style="font-size:16px;">${gameData.kingSafetyScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">Endgame Quality</div><div class="item-value" style="font-size:16px;">${gameData.endgameQualityScore || 50}%</div></div>
                <div class="report-item"><div class="item-label">Material Balance</div><div class="item-value" style="font-size:16px;">${gameData.materialBalance || 0}</div></div>
              </div>
            </section>

            <!-- ============ COACH RECOMMENDATIONS ============ -->
            ${gameData.coachRecommendations && gameData.coachRecommendations.length > 0 ? `
            <section class="anl-section">
              <div class="anl-section-head">
                <span class="anl-eyebrow">Coach</span>
                <h2>Recommendations <span class="anl-accent">for you</span></h2>
              </div>
              <div class="anl-coach-list">
                ${gameData.coachRecommendations.map((item) => `<div class="coach-item">💡 ${item}</div>`).join('')}
              </div>
            </section>` : ''}

            <button class="anl-back-btn" onclick="loadMatches()">← Back to Games</button>
          </div>
        </div>

        <div id="movesTab" class="analysis-tab" style="display:none;">
          <div id="movesTabContent"></div>
        </div>
      </div>`;


    // expose tab switcher to inline onclick handlers
    window.openAnalysisTab = (tab) => {
      const analysisTabEl = document.getElementById('analysisTab');
      const movesTabEl = document.getElementById('movesTab');
      const btnAnalysis = document.getElementById('tabBtnAnalysis');
      const btnMoves = document.getElementById('tabBtnMoves');

      const isAnalysis = tab === 'analysis';
      if (analysisTabEl) analysisTabEl.style.display = isAnalysis ? 'block' : 'none';
      if (movesTabEl) movesTabEl.style.display = isAnalysis ? 'none' : 'block';

      // light visual feedback
      if (btnAnalysis) btnAnalysis.style.background = isAnalysis ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.05)';
      if (btnMoves) btnMoves.style.background = !isAnalysis ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.05)';

      if (!isAnalysis) {
        // ensure legacy viewer is mounted once
        if (!state.__movesTabInitialized) {
          state.__movesTabInitialized = true;
          analyzeGameLegacy(gameId);
        }
      }
    };

    setTimeout(() => drawEvalGraph(gameData.evaluationData), 100);
    if (gameData.analysis && gameData.analysis.length > 0) window._analysisData = gameData;
  } catch (error) {
    document.getElementById('content').innerHTML = `<div class="analysis-card" style="margin:auto;"><h2>⚠ Error Loading Analysis</h2><p class="sub-text">${error.message}</p><button onclick="loadMatches()">Back to Games</button></div>`;
  }
}


export function drawEvalGraph(evalData) {
  const canvas = document.getElementById('evalCanvas');
  if (!canvas || !evalData || evalData.length < 2) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width - 30;
  canvas.height = rect.height - 30;

  const width = canvas.width;
  const height = canvas.height;
  const padding = 30;
  ctx.clearRect(0, 0, width, height);

  let maxValue = Math.max(...evalData.map((entry) => Math.max(Math.abs(entry.bestEval), Math.abs(entry.playerEval), 100)));
  maxValue = Math.max(maxValue, 100);
  const scale = (height - padding * 2) / (maxValue * 2);
  const midY = padding + (height - padding * 2) / 2;

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, midY);
  ctx.lineTo(width - padding, midY);
  ctx.stroke();

  const step = (width - padding * 2) / (evalData.length - 1);

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  evalData.forEach((entry, index) => {
    const x = padding + index * step;
    const y = midY - (entry.bestEval / maxValue) * (height - padding * 2) / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  evalData.forEach((entry, index) => {
    const x = padding + index * step;
    const y = midY - (entry.playerEval / maxValue) * (height - padding * 2) / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#666';
  ctx.font = '10px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('0', padding - 10, midY + 3);
  ctx.fillText('+' + maxValue, padding - 10, padding + 10);
  ctx.fillText('-' + maxValue, padding - 10, height - padding + 3);
}

export async function analyzeGameLegacy(gameId) {
  const token = localStorage.getItem('token');
  const response = await fetch(window.location.origin + '/api/game/my-games', { headers: { Authorization: 'Bearer ' + token } });
  const games = await response.json();
  const gameData = games.find((item) => item._id === gameId);
  if (!gameData) {
    alert('Game not found');
    return;
  }

  document.getElementById('content').innerHTML = `<div class="analysis-layout"><div class="analysis-left"><div class="game-summary-card"><h3>Game Summary</h3><div class="summary-stat"><span class="label">🎯 Accuracy</span><span class="value">${gameData.accuracy || 0}%</span></div><div class="summary-stat"><span class="label">♟ Moves</span><span class="value">${gameData.moves?.length || 0}</span></div><div class="summary-stat"><span class="label">🏆 Result</span><span class="value">${gameData.result || 'Unknown'}</span></div><div class="summary-stat"><span class="label">📖 Opening</span><span class="value">${gameData.opening || 'Unknown'}</span></div><div id="moveReview" class="move-review-box"><h4 style="color:#aaa;">Current Move</h4><p style="color:#666;font-size:11px;">Click Next to begin</p></div></div><button class="back-btn-sm" onclick="loadMatches()" style="margin-top:4px;">← Back to Games</button></div><div class="analysis-center"><div id="analysisBoard"></div><div class="move-center-buttons"><button onclick="previousMove()">← Previous</button><button onclick="playAnalysisMove()">▶ Play</button><button onclick="nextMove()">Next →</button></div></div><div class="analysis-right"><div class="moves-list-panel"><h4>Game Moves</h4><div id="movesList"></div></div></div></div>`;

  state.analysisGame = new window.Chess();
  // Analysis-only engine (independent worker)
  initEngine(() => {}, 'analysis');
  state.analysisMoves = gameData.moves || [];

  renderMovesList();
  state.currentMoveIndex = -1;
  state.analysisBoard = window.Chessboard('analysisBoard', { position: 'start', draggable: false, orientation: gameData.playerColor === 'black' ? 'black' : 'white' });
  if (gameData.playerColor === 'black') state.analysisBoard.orientation('black');
}

export function nextMove() {
  if (state.currentMoveIndex >= state.analysisMoves.length - 1) return;
  state.currentMoveIndex += 1;
  state.analysisGame.move(state.analysisMoves[state.currentMoveIndex]);
  state.analysisBoard.position(state.analysisGame.fen());
  renderMovesList();
  analyzeCurrentMove();
}

export function previousMove() {
  if (state.currentMoveIndex < 0) return;
  state.analysisGame.undo();
  state.analysisBoard.position(state.analysisGame.fen());
  state.currentMoveIndex -= 1;
  renderMovesList();
  analyzeCurrentMove();
}

export function playAnalysisMove() {
  if (state.currentMoveIndex >= state.analysisMoves.length - 1) return;
  const playNext = () => {
    if (state.currentMoveIndex >= state.analysisMoves.length - 1) return;
    state.currentMoveIndex += 1;
    state.analysisGame.move(state.analysisMoves[state.currentMoveIndex]);
    state.analysisBoard.position(state.analysisGame.fen());
    renderMovesList();
    analyzeCurrentMove();
    setTimeout(playNext, 600);
  };
  playNext();
}

export function analyzeCurrentMove() {
  if (state.currentMoveIndex < 0 || state.engineBusy) return;

  state.engineBusy = true;

  setTimeout(() => {
    state.pendingReviewAnalysis = true;
    // Send to analysisEngine (independent worker)
    postEngineMessage('position fen ' + state.analysisGame.fen(), 'analysis');
    postEngineMessage('go depth 12', 'analysis');
  }, 0);

}





export function renderMovesList() {
  let html = '';
  state.analysisMoves.forEach((move, index) => {
    const activeClass = index === state.currentMoveIndex ? 'active-move' : '';
    html += `<button class="move-btn ${activeClass}" onclick="jumpToMove(${index})">${index + 1}. ${move}</button>`;
  });
  document.getElementById('movesList').innerHTML = html;
}

export function jumpToMove(index) {
  state.analysisGame = new window.Chess();
  for (let i = 0; i <= index; i += 1) state.analysisGame.move(state.analysisMoves[i]);
  state.currentMoveIndex = index;
  state.analysisBoard.position(state.analysisGame.fen());
  renderMovesList();
  analyzeCurrentMove();
}

// Expose legacy inline onclick handlers (analysis move playback)
window.nextMove = window.nextMove || nextMove;
window.previousMove = window.previousMove || previousMove;
window.jumpToMove = window.jumpToMove || jumpToMove;
window.playAnalysisMove = window.playAnalysisMove || playAnalysisMove;


export function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const analysisId = params.get('analyze');
  if (analysisId) {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => analyzeGame(analysisId), 100);
    return true;
  }
  return false;
}
