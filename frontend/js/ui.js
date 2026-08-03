import { state } from './state.js';
import { getToken } from './utils.js';
import { launchConfetti } from './animations.js';

export function renderSidebar() {
  const token = getToken();
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML =
    '<div class="logo"><span class="logo-icon">♛</span><span class="logo-text"><span>Queen</span> Chess</span></div><div class="sidebar-buttons">' +
    (token ? '<button onclick="logout()"><span class="nav-icon">🚪</span><span class="nav-label">Logout</span></button>' : '<button onclick="goToLogin()"><span class="nav-icon">🔑</span><span class="nav-label">Login</span></button>') +
    '<button onclick="loadHome()"><span class="nav-icon">🏠</span><span class="nav-label">Home</span></button><button onclick="loadPlay()"><span class="nav-icon">♟</span><span class="nav-label">Play</span></button><button onclick="loadMatches()"><span class="nav-icon">📁</span><span class="nav-label">My Games</span></button><button onclick="loadLearning()"><span class="nav-icon">📚</span><span class="nav-label">Learning</span></button><button onclick="loadQuiz()"><span class="nav-icon">🧩</span><span class="nav-label">Quiz</span></button><button onclick="loadProfile()"><span class="nav-icon">👤</span><span class="nav-label">Profile</span></button><button onclick="loadPremium()"><span class="nav-icon">💎</span><span class="nav-label">Premium</span></button></div>';
}

export function showGameOverModal(result, moveCount, accuracy, duration, analysis, ratingChange, newRating, rankAfter, playerLevel) {
  const isDraw = result === 'draw';
  let winnerName; let loserName;
  if (isDraw) {
    winnerName = 'Draw';
    loserName = 'Draw';
  } else if (result === 'White') {
    winnerName = state.playerColor === 'white' ? 'You' : 'AI';
    loserName = state.playerColor === 'white' ? 'AI' : 'You';
  } else {
    winnerName = state.playerColor === 'black' ? 'You' : 'AI';
    loserName = state.playerColor === 'black' ? 'AI' : 'You';
  }

  const oldModal = document.querySelector('.modal-overlay');
  if (oldModal) oldModal.remove();

  const ratingDelta = ratingChange !== undefined ? (ratingChange > 0 ? '+' + ratingChange : ratingChange) : '—';
  const nextRating = newRating || '—';
  const nextRank = rankAfter || '—';
  const nextLevel = playerLevel || '—';

  const strengths = analysis && analysis.strengths ? analysis.strengths.slice(0, 3).map((item) => `<div class="strength-item">✓ ${item}</div>`).join('') : '';
  const weaknesses = analysis && analysis.weaknesses ? analysis.weaknesses.slice(0, 3).map((item) => `<div class="weakness-item">✗ ${item}</div>`).join('') : '';
  const openingScore = analysis && analysis.openingScore ? '⭐'.repeat(Math.round(analysis.openingScore / 25)) : '—';
  const middleGameScore = analysis && analysis.middleGameScore ? '⭐'.repeat(Math.round(analysis.middleGameScore / 25)) : '—';
  const endgameScore = analysis && analysis.endgameScore ? '⭐'.repeat(Math.round(analysis.endgameScore / 25)) : '—';
  const performance = analysis && analysis.performanceScore ? analysis.performanceScore + '%' : '—';
  const coachRecommended = analysis && analysis.coachRecommendations ? analysis.coachRecommendations.slice(0, 2).map((item) => `<div class="coach-item">💡 ${item}</div>`).join('') : '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="game-over-modal">
        <div class="modal-header-fixed">
            <div class="trophy-glow"></div>
            <div class="modal-trophy">${isDraw ? '🤝' : '🏆'}</div>
            <div class="modal-title">${isDraw ? 'Game Drawn' : 'Game Over'}</div>
            <div class="modal-subtitle">${isDraw ? 'A hard-fought battle!' : result + ' wins!'}</div>
        </div>
        <div class="modal-body-scroll">
            <div class="modal-players"><div class="modal-player"><div class="icon">${state.playerColor === 'white' ? '🤍' : '🖤'}</div><div class="player-label">You</div></div><div class="modal-vs">VS</div><div class="modal-player"><div class="icon">🤖</div><div class="player-label">AI</div></div></div>
            <div class="modal-results-grid">
                <div class="modal-result-item"><div class="label">🏆 Winner</div><div class="value ${!isDraw && winnerName === 'You' ? 'winner' : ''}">${isDraw ? '—' : winnerName}</div></div>
                <div class="modal-result-item"><div class="label">❌ Loser</div><div class="value ${!isDraw && loserName === 'You' ? 'loser' : ''}">${isDraw ? '—' : loserName}</div></div>
                <div class="modal-result-item"><div class="label">♟ Moves</div><div class="value">${moveCount}</div></div>
                <div class="modal-result-item"><div class="label">🎯 Accuracy</div><div class="value">${accuracy}%</div></div>
                <div class="modal-result-item"><div class="label">⏱ Duration</div><div class="value">${duration}</div></div>
                <div class="modal-result-item"><div class="label">📊 Result</div><div class="value ${!isDraw && winnerName === 'You' ? 'winner' : ''}">${isDraw ? 'Draw' : result}</div></div>
                <div class="modal-result-item"><div class="label">📈 Rating Δ</div><div class="value" style="color:${ratingChange > 0 ? '#22c55e' : ratingChange < 0 ? '#ef4444' : '#aaa'}">${ratingDelta}</div></div>
                <div class="modal-result-item"><div class="label">🏅 Rating</div><div class="value">${nextRating}</div></div>
                <div class="modal-result-item"><div class="label">🎖 Rank</div><div class="value">${nextRank}</div></div>
                <div class="modal-result-item"><div class="label">📊 Level</div><div class="value">${nextLevel}</div></div>
                <div class="modal-result-item"><div class="label">📋 Performance</div><div class="value">${performance}</div></div>
            </div>
            ${strengths ? `<div style="margin:4px 0"><div style="font-size:11px;color:#4ade80;margin-bottom:4px;font-weight:600;">💪 STRENGTHS</div>${strengths}</div>` : ''}
            ${weaknesses ? `<div style="margin:4px 0"><div style="font-size:11px;color:#f87171;margin-bottom:4px;font-weight:600;">⚠ WEAKNESSES</div>${weaknesses}</div>` : ''}
            ${analysis && analysis.openingScore ? `<div style="margin:4px 0;padding:10px;background:rgba(255,255,255,0.03);border-radius:12px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>Opening: ${openingScore}</span><span>Middle: ${middleGameScore}</span><span>Endgame: ${endgameScore}</span></div></div>` : ''}
            ${coachRecommended ? `<div style="margin:4px 0"><div style="font-size:11px;color:#c084fc;margin-bottom:4px;font-weight:600;">🎯 COACH</div>${coachRecommended}</div>` : ''}
        </div>
        <div class="modal-footer-fixed">
            <div class="modal-actions">
                <button class="view-analysis-btn" onclick="viewGameAnalysis()">📊 View Analysis</button>
                <button class="play-again-btn" onclick="playAgain()">🔄 Play Again</button>
            </div>
        </div>
    </div>`;

  document.body.appendChild(overlay);
  launchConfetti();
}
