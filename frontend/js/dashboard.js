import { state } from './state.js';
import { apiFetch } from './utils.js';
import { getDisplayName } from './profile.js';

export async function loadHome() {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>👑 Queen Chess</h2><p class="sub-text">Login to view your dashboard.</p><button onclick="goToLogin()">Login</button></div>';
    return;
  }

  try {
    const [stats, profile] = await Promise.all([
      apiFetch('/api/game/stats/rapid'),
      apiFetch('/api/auth/profile')
    ]);
    state.cachedProfile = profile;
    const name = profile.displayName || profile.username;

    document.getElementById('content').innerHTML =
      `<div class="home-page"><div class="topbar"><div><h1>Hello, ${name} 👑</h1><p>Continue improving your chess skills.</p></div></div><div class="stats-grid"><div class="stat-box"><h3>🎮 Total Games</h3><span>${stats.gamesPlayed}</span></div><div class="stat-box"><h3>📈 Win Rate</h3><span>${stats.winRate}</span></div><div class="stat-box"><h3>🏅 Rating</h3><span>${stats.rating}</span></div><div class="stat-box"><h3>🎖 Rank</h3><span><span class="rank-badge ${(stats.tier || 'Beginner').toLowerCase()}">${stats.tier || 'Beginner'}</span></span></div></div><div class="dashboard-grid"><div class="dashboard-card"><h2>♟ Continue Playing</h2><p>Jump into a new AI match and improve.</p><button onclick="loadPlay()">Start Match</button></div><div class="dashboard-card"><h2>📚 Learning</h2><p>Study openings, tactics, and endgames.</p><button onclick="loadLearning()">Open Learning</button></div></div></div>`;
  } catch (error) {
    document.getElementById('content').innerHTML = '<div class="dashboard-card" style="margin:auto;"><h1>⚠ Failed To Load Stats</h1><p>Please try again later.</p></div>';
  }
}

export function loadLearning() {
  document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>📚 Learning</h2><p class="sub-text">Coming soon...</p></div>';
}

export function loadQuiz() {
  document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>🧩 Quiz</h2><p class="sub-text">Chess puzzles and tactical training.</p></div>';
}

export function loadPremium() {
  document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>💎 Premium</h2><p class="sub-text">This is trial version; you will be notified before service is activated.</p></div>';
}

export function loadMatches() {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>⚠️ Login Required</h2><button onclick="goToLogin()">Login</button></div>';
    return;
  }

  apiFetch('/api/game/my-games')
    .then((games) => {
      if (!games || games.length === 0) {
        document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>No Games Yet 😢</h2><p style="color:#aaa;">Play your first match to see history.</p></div>';
        return;
      }

      games.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;"><div><h2>♟ My Games</h2><p style="color:#999;">Recent matches and analysis</p></div></div><div class="games-container">';
      games.forEach((game) => {
        const hasReport = game.strengths && game.strengths.length > 0;
        html += `<div class="game-card"><div class="game-header"><div class="result">${game.result || 'Unknown'}</div><div class="date">${new Date(game.createdAt).toLocaleDateString()}</div></div><div class="game-body">♟ Moves: ${game.moves?.length || 0}<br>🎯 Accuracy: ${game.accuracy || 0}%<br>🏅 Rating: ${game.ratingAfterGame || '—'} (${game.ratingChange > 0 ? '+' : ''}${game.ratingChange || 0})<br>📊 Level: ${game.playerLevelAfterGame || '—'}</div><div class="game-actions"><button onclick="analyzeGame('${game._id}')">🔍 ${hasReport ? 'Full Analysis' : 'Analyze'}</button></div></div>`;
      });

      html += '</div>';
      document.getElementById('content').innerHTML = html;
    })
    .catch(() => {
      document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>⚠ Error loading games</h2></div>';
    });
}
