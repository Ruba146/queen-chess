import { state } from './state.js';
import { apiFetch } from './utils.js';
import { initEngine } from './stockfish.js';

export async function analyzeGame(gameId) {
  try {
    const analysis = await apiFetch('/api/analysis/' + gameId);
    const gameData = analysis;

    document.getElementById('content').innerHTML = `
      <div class="ai-report">
          <div class="report-header">
              <h2>📊 AI Performance Report</h2>
              <div class="report-subtitle">${gameData.opening || 'Unknown Opening'} • ${gameData.totalMoves || 0} moves • ${gameData.accuracy || 0}% accuracy</div>
              <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap;">
                  <span class="rank-badge ${(gameData.rankAfterGame || 'beginner').toLowerCase()}">🏅 ${gameData.rankAfterGame || 'Beginner'}</span>
                  <span class="level-badge ${(gameData.playerLevelAfterGame || 'beginner').toLowerCase()}">📊 ${gameData.playerLevelAfterGame || 'Beginner'}</span>
                  ${gameData.ratingChange !== undefined ? `<span style="color:${gameData.ratingChange > 0 ? '#22c55e' : gameData.ratingChange < 0 ? '#ef4444' : '#aaa'};font-weight:600;">Rating: ${gameData.ratingChange > 0 ? '+' : ''}${gameData.ratingChange}</span>` : ''}
              </div>
          </div>
          <div class="report-section report-full-width">
              <h3>📋 Overview</h3>
              <div class="report-grid">
                  <div class="report-item"><div class="item-label">🎯 Accuracy</div><div class="item-value" style="color:${gameData.accuracy >= 80 ? '#22c55e' : gameData.accuracy >= 60 ? '#fbbf24' : '#ef4444'}">${gameData.accuracy || 0}%</div></div>
                  <div class="report-item"><div class="item-label">📊 Performance</div><div class="item-value" style="color:${gameData.performanceScore >= 80 ? '#22c55e' : gameData.performanceScore >= 60 ? '#fbbf24' : '#ef4444'}">${gameData.performanceScore || 0}%</div></div>
                  <div class="report-item"><div class="item-label">♟ Total Moves</div><div class="item-value">${gameData.totalMoves || 0}</div></div>
                  <div class="report-item"><div class="item-label">🎮 Playing Style</div><div class="item-value" style="font-size:16px;">${gameData.playingStyle || 'Balanced'}</div></div>
                  <div class="report-item"><div class="item-label">📉 Avg Centipawn Loss</div><div class="item-value">${gameData.averageCentipawnLoss || 0}</div></div>
                  <div class="report-item"><div class="item-label">💎 Brilliant Moves</div><div class="item-value" style="color:#06b6d4;">${gameData.brilliantMoves || 0}</div></div>
                  <div class="report-item"><div class="item-label">✅ Best Moves</div><div class="item-value" style="color:#22c55e;">${gameData.bestMoves || 0}</div></div>
                  <div class="report-item"><div class="item-label">⚡ Inaccuracies</div><div class="item-value" style="color:#f97316;">${gameData.inaccuracies || 0}</div></div>
                  <div class="report-item"><div class="item-label">⚠ Mistakes</div><div class="item-value" style="color:#f97316;">${gameData.mistakes || 0}</div></div>
                  <div class="report-item"><div class="item-label">❌ Blunders</div><div class="item-value" style="color:#ef4444;">${gameData.blunders || 0}</div></div>
                  <div class="report-item"><div class="item-label">🎯 Missed Wins</div><div class="item-value" style="color:#ef4444;">${gameData.missedWins || 0}</div></div>
                  <div class="report-item"><div class="item-label">🏆 Result</div><div class="item-value">${gameData.result || 'Unknown'}</div></div>
              </div>
          </div>
          <div class="report-section report-full-width">
              <h3>🎯 Game Phase Analysis</h3>
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
          <div class="report-grid-dashboard">
              ${gameData.strengths && gameData.strengths.length > 0 ? `
              <div class="report-section">
                  <h3>💪 Strengths</h3>
                  ${gameData.strengths.map((item) => `<div class="strength-item">✓ ${item}</div>`).join('')}
              </div>` : ''}
              ${gameData.weaknesses && gameData.weaknesses.length > 0 ? `
              <div class="report-section">
                  <h3>⚠ Areas to Improve</h3>
                  ${gameData.weaknesses.map((item) => `<div class="weakness-item">✗ ${item}</div>`).join('')}
              </div>` : ''}
          </div>
          <div class="report-grid-dashboard">
              <div class="report-section">
                  <h3>🎯 Performance Metrics</h3>
                  <div class="report-grid" style="grid-template-columns:1fr 1fr;">
                      <div class="report-item"><div class="item-label">Tactical Ability</div><div class="item-value" style="font-size:16px;">${gameData.tacticalAbilityScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">Positional Play</div><div class="item-value" style="font-size:16px;">${gameData.positionalPlayScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">Decision Making</div><div class="item-value" style="font-size:16px;">${gameData.decisionMakingScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">Consistency</div><div class="item-value" style="font-size:16px;">${gameData.consistencyScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">Piece Activity</div><div class="item-value" style="font-size:16px;">${gameData.pieceActivityScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">King Safety</div><div class="item-value" style="font-size:16px;">${gameData.kingSafetyScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">Endgame Quality</div><div class="item-value" style="font-size:16px;">${gameData.endgameQualityScore || 50}%</div></div>
                      <div class="report-item"><div class="item-label">Material Balance</div><div class="item-value" style="font-size:16px;">${gameData.materialBalance || 0}</div></div>
                  </div>
              </div>
              ${gameData.coachRecommendations && gameData.coachRecommendations.length > 0 ? `
              <div class="report-section">
                  <h3>🎯 Coach Recommendations</h3>
                  ${gameData.coachRecommendations.map((item) => `<div class="coach-item">💡 ${item}</div>`).join('')}
              </div>` : ''}
          </div>
          <div class="report-section report-full-width">
              <h3>📈 Evaluation Graph</h3>
              <div class="graph-container" id="evalGraphContainer">
                  <canvas id="evalCanvas" class="graph-canvas"></canvas>
              </div>
              <div class="graph-labels">
                  <span>Move 1</span>
                  <span style="color:#22c55e;">Best Line</span>
                  <span style="color:#a855f7;">Your Moves</span>
                  <span>Move ${gameData.totalMoves || 0}</span>
              </div>
          </div>
          <button class="back-btn-sm" onclick="loadMatches()" style="margin:0 auto;display:block;width:200px;">← Back to Games</button>
      </div>`;

    setTimeout(() => drawEvalGraph(gameData.evaluationData), 100);

    if (gameData.analysis && gameData.analysis.length > 0) {
      window._analysisData = gameData;
    }
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
  const response = await fetch('https://queen-chess.onrender.com/api/game/my-games', { headers: { Authorization: 'Bearer ' + token } });
  const games = await response.json();
  const gameData = games.find((item) => item._id === gameId);
  if (!gameData) {
    alert('Game not found');
    return;
  }

  document.getElementById('content').innerHTML = `<div class="analysis-layout"><div class="analysis-left"><div class="game-summary-card"><h3>Game Summary</h3><div class="summary-stat"><span class="label">🎯 Accuracy</span><span class="value">${gameData.accuracy || 0}%</span></div><div class="summary-stat"><span class="label">♟ Moves</span><span class="value">${gameData.moves?.length || 0}</span></div><div class="summary-stat"><span class="label">🏆 Result</span><span class="value">${gameData.result || 'Unknown'}</span></div><div class="summary-stat"><span class="label">📖 Opening</span><span class="value">${gameData.opening || 'Unknown'}</span></div><div id="moveReview" class="move-review-box"><h4 style="color:#aaa;">Current Move</h4><p style="color:#666;font-size:11px;">Click Next to begin</p></div></div><button class="back-btn-sm" onclick="loadMatches()" style="margin-top:4px;">← Back to Games</button></div><div class="analysis-center"><div id="analysisBoard"></div><div class="move-center-buttons"><button onclick="previousMove()">← Previous</button><button onclick="playAnalysisMove()">▶ Play</button><button onclick="nextMove()">Next →</button></div></div><div class="analysis-right"><div class="moves-list-panel"><h4>Game Moves</h4><div id="movesList"></div></div></div></div>`;

  state.analysisGame = new window.Chess();
  if (!state.engine) initEngine(() => {});
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
  if (state.currentMoveIndex < 0 || !state.engine || state.engineBusy) return;
  state.engineBusy = true;
  state.engine.postMessage('stop');
  setTimeout(() => {
    state.engine.postMessage('position fen ' + state.analysisGame.fen());
    state.pendingReviewAnalysis = true;
    state.engine.postMessage('go depth 12');
  }, 100);
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
