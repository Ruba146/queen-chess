import { state } from './state.js';
import { apiFetch } from './utils.js';

export async function getDisplayName() {
  if (state.cachedProfile) return state.cachedProfile.displayName || state.cachedProfile.username;
  try {
    const profile = await apiFetch('/api/auth/profile');
    state.cachedProfile = profile;
    return profile.displayName || profile.username;
  } catch (error) {
    return 'Player';
  }
}

export async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>⚠️ Login Required</h2><button onclick="goToLogin()">Login</button></div>';
    return;
  }

  try {
    const user = await apiFetch('/api/auth/profile');
    const stats = await apiFetch('/api/auth/extended-stats/rapid');
    state.cachedProfile = user;

    const name = user.displayName || user.username;
    const initial = (user.displayName || user.username || '?').charAt(0).toUpperCase();
    const avatarHtml = user.profilePicture ? `<img src="${user.profilePicture}" alt="Avatar">` : initial;
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
    const total = (user.stats?.rapid?.wins || 0) + (user.stats?.rapid?.losses || 0) + (user.stats?.rapid?.draws || 0);
    const wins = user.stats?.rapid?.wins || 0;
    const losses = user.stats?.rapid?.losses || 0;
    const draws = user.stats?.rapid?.draws || 0;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%';
    const winRateNum = total > 0 ? Math.round((wins / total) * 100) : 0;

    let rank = 'Beginner';
    const rating = user.ratings?.rapid || 1200;
    if (rating >= 800) rank = 'Bronze';
    if (rating >= 1200) rank = 'Silver';
    if (rating >= 1600) rank = 'Gold';
    if (rating >= 2000) rank = 'Platinum';
    if (rating >= 2400) rank = 'Diamond';
    if (rating >= 2700) rank = 'Master';
    if (rating >= 2900) rank = 'Grandmaster';

    const level = user.playerLevel || 'Beginner';
    const accuracy = Math.round(stats?.avgAccuracy || 0);
    const streak = user.winStreak?.rapid || 0;
    const consistency = stats?.consistency || 50;
    const preferredSide = (user.preferredSide || 'random').charAt(0).toUpperCase() + (user.preferredSide || 'random').slice(1);
    const difficulty = (user.mostPlayedDifficulty || 'intermediate').charAt(0).toUpperCase() + (user.mostPlayedDifficulty || 'intermediate').slice(1);
    const favoriteOpening = user.favoriteOpening || 'Unknown';

    // ── Achievements derived from existing profile data ──
    const achievements = [];
    achievements.push({ icon: '🎯', label: 'First Steps', desc: 'Completed your first game', earned: total > 0 });
    achievements.push({ icon: '🏆', label: 'First Win', desc: 'Won your first game', earned: wins > 0 });
    achievements.push({ icon: '🔥', label: 'On Fire', desc: 'Reached a winning streak', earned: streak >= 3 });
    achievements.push({ icon: '📈', label: 'Sharp Shooter', desc: 'Maintain 60%+ win rate', earned: winRateNum >= 60 });
    achievements.push({ icon: '🧠', label: 'Strategist', desc: 'Reached 70%+ accuracy', earned: accuracy >= 70 });
    achievements.push({ icon: '🎖️', label: 'Level Up', desc: 'Reached advanced level', earned: level.toLowerCase() === 'advanced' || level.toLowerCase() === 'expert' || level.toLowerCase() === 'master' });

    // ── Recent games summary (derived from stats) ──
    const recentGames = [
      { result: 'Win', icon: '🟢', label: 'Total Wins', value: wins, tone: 'win' },
      { result: 'Loss', icon: '🔴', label: 'Total Losses', value: losses, tone: 'loss' },
      { result: 'Draw', icon: '⚪', label: 'Total Draws', value: draws, tone: 'draw' }
    ];

    // ── Learning progress bars ──
    const learningBars = [
      { label: 'Rating Progress', value: Math.min(100, Math.round(((rating - 800) / 2200) * 100)) },
      { label: 'Consistency', value: Math.min(100, consistency) },
      { label: 'Accuracy', value: Math.min(100, accuracy) }
    ];

    // ── Badges ──
    const badges = [
      `🏅 ${rank}`,
      `📊 ${level}`,
      `🎯 ${accuracy}% accuracy`,
      `♟ ${preferredSide}`
    ];

    document.getElementById('content').innerHTML = `
      <div class="profile-page profile-page-premium">
          <!-- Profile Hero -->
          <div class="profile-hero card-fade-in">
              <div class="profile-hero-glow"></div>
              <div class="profile-avatar profile-avatar-lg">${avatarHtml}</div>
              <div class="profile-info">
                  <h2>${name}</h2>
                  <div class="username-tag">@${user.username}</div>
                  <div class="member-since">Member since ${joinDate}</div>
                  <div class="profile-badge-row">
                      <span class="rank-badge ${rank.toLowerCase()}">🏅 ${rank}</span>
                      <span class="level-badge ${level.toLowerCase()}">📊 ${level}</span>
                      <span class="rank-badge silver">♟ ${user.email}</span>
                  </div>
              </div>
              <div class="profile-rating-pill">
                  <div class="profile-rating-value" data-count="${rating}">${rating}</div>
                  <div class="profile-rating-label">Rapid Rating</div>
              </div>
          </div>

          <!-- Stat Dashboard -->
          <div class="profile-stats-grid">
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">🏅</div>
                  <div class="stat-label">Rating</div>
                  <div class="stat-value" data-count="${rating}">${rating}</div>
                  <div class="stat-sub">${rank}</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">🎮</div>
                  <div class="stat-label">Games Played</div>
                  <div class="stat-value" data-count="${total}">${total}</div>
                  <div class="stat-sub">${wins}W / ${losses}L / ${draws}D</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">🟢</div>
                  <div class="stat-label">Wins</div>
                  <div class="stat-value stat-win" data-count="${wins}">${wins}</div>
                  <div class="stat-sub">${winRate} win rate</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">🔴</div>
                  <div class="stat-label">Losses</div>
                  <div class="stat-value stat-loss" data-count="${losses}">${losses}</div>
                  <div class="stat-sub">${draws} draws</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">📈</div>
                  <div class="stat-label">Win Rate</div>
                  <div class="stat-value" data-count="${winRateNum}">${winRate}</div>
                  <div class="stat-sub">${streak} win streak</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">📊</div>
                  <div class="stat-label">Level</div>
                  <div class="stat-value">${level}</div>
                  <div class="stat-sub">${accuracy}% avg accuracy</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">🤖</div>
                  <div class="stat-label">AI Score</div>
                  <div class="stat-value" data-count="${accuracy}">${accuracy}</div>
                  <div class="stat-sub">Consistency ${consistency}%</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">🧩</div>
                  <div class="stat-label">Puzzle Rating</div>
                  <div class="stat-value" data-count="${Math.max(800, rating - 300)}">${Math.max(800, rating - 300)}</div>
                  <div class="stat-sub">Keep solving!</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">♟</div>
                  <div class="stat-label">Preferred Side</div>
                  <div class="stat-value" style="font-size:18px;">${preferredSide}</div>
                  <div class="stat-sub">Difficulty: ${difficulty}</div>
              </div>
              <div class="profile-stat-card card-fade-in">
                  <div class="stat-icon">📖</div>
                  <div class="stat-label">Favorite Opening</div>
                  <div class="stat-value" style="font-size:16px;">${favoriteOpening}</div>
                  <div class="stat-sub">Your signature</div>
              </div>
          </div>

          <!-- Recent Games -->
          <div class="profile-section-card card-fade-in">
              <div class="profile-section-head">
                  <h3>🎮 Recent Games</h3>
                  <span class="profile-section-badge">${total} total</span>
              </div>
              <div class="profile-recent-grid">
                  ${recentGames.map(g => `
                    <div class="profile-recent-item recent-${g.tone}">
                        <span class="profile-recent-icon">${g.icon}</span>
                        <div>
                            <div class="profile-recent-label">${g.label}</div>
                            <div class="profile-recent-value" data-count="${g.value}">${g.value}</div>
                        </div>
                    </div>
                  `).join('')}
              </div>
          </div>

          <!-- Learning Progress -->
          <div class="profile-section-card card-fade-in">
              <div class="profile-section-head">
                  <h3>📚 Learning Progress</h3>
                  <span class="profile-section-badge">${badges.length} badges</span>
              </div>
              <div class="profile-progress-list">
                  ${learningBars.map(bar => `
                    <div class="profile-progress-row">
                        <div class="profile-progress-label">${bar.label}</div>
                        <div class="profile-progress-track">
                            <div class="profile-progress-fill" style="width:0%" data-width="${bar.value}%"></div>
                        </div>
                        <div class="profile-progress-value">${bar.value}%</div>
                    </div>
                  `).join('')}
              </div>
              <div class="profile-badge-pills">
                  ${badges.map(b => `<span class="badge-pill">${b}</span>`).join('')}
              </div>
          </div>

          <!-- Achievements -->
          <div class="profile-section-card card-fade-in">
              <div class="profile-section-head">
                  <h3>🏆 Achievements</h3>
                  <span class="profile-section-badge">${achievements.filter(a => a.earned).length}/${achievements.length} unlocked</span>
              </div>
              <div class="profile-achievements-grid">
                  ${achievements.map(a => `
                    <div class="profile-achievement ${a.earned ? 'earned' : 'locked'}">
                        <div class="achievement-icon">${a.icon}</div>
                        <div class="achievement-label">${a.label}</div>
                        <div class="achievement-desc">${a.desc}</div>
                        <div class="achievement-state">${a.earned ? 'Unlocked' : 'Locked'}</div>
                    </div>
                  `).join('')}
              </div>
          </div>

          <!-- Account Settings -->
          <div class="profile-settings card-fade-in">
              <div class="profile-section-head">
                  <h3>⚙️ Account Settings</h3>
                  <span class="profile-section-badge">Manage</span>
              </div>
              <div class="settings-row">
                  <label>Display Name</label>
                  <input type="text" id="displayNameInput" value="${user.displayName || user.username}" placeholder="Display Name">
                  <button class="save-btn" onclick="updateDisplayName()">Save</button>
              </div>
              <div class="settings-row">
                  <label>Username</label>
                  <input type="text" id="usernameInput" value="${user.username}" placeholder="Username">
                  <button class="save-btn" onclick="updateUsername()">Save</button>
              </div>
              <div class="settings-row">
                  <label>Preferred Side</label>
                  <select id="preferredSideSelect">
                      <option value="random" ${(user.preferredSide || 'random') === 'random' ? 'selected' : ''}>Random</option>
                      <option value="white" ${user.preferredSide === 'white' ? 'selected' : ''}>White</option>
                      <option value="black" ${user.preferredSide === 'black' ? 'selected' : ''}>Black</option>
                  </select>
                  <button class="save-btn" onclick="updatePreferredSide()">Save</button>
              </div>
              <div class="settings-divider"></div>
              <div class="settings-row">
                  <label>Current Password</label>
                  <input type="password" id="currentPwd" placeholder="Current password">
              </div>
              <div class="settings-row">
                  <label>New Password</label>
                  <input type="password" id="newPwd" placeholder="New password">
                  <button class="save-btn" onclick="changePassword()">Change</button>
              </div>
              <div class="settings-row">
                  <label>Profile Picture URL</label>
                  <input type="text" id="profilePicInput" value="${user.profilePicture || ''}" placeholder="Image URL">
                  <button class="save-btn" onclick="updateProfilePic()">Save</button>
              </div>
          </div>
      </div>`;

    // Animate stat counters
    animateCounters();
    // Animate progress bars
    animateProgressBars();
  } catch (error) {
    document.getElementById('content').innerHTML = '<div class="analysis-card" style="margin:auto;"><h2>⚠ Error Loading Profile</h2><p class="sub-text">Please try again later.</p></div>';
  }
}

export async function updateDisplayName() {
  const value = document.getElementById('displayNameInput').value;
  if (!value) return alert('Enter a display name');
  try {
    await apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ displayName: value }) });
    state.cachedProfile = null;
    alert('Display name updated!');
    loadProfile();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

export async function updateUsername() {
  const value = document.getElementById('usernameInput').value;
  if (!value) return alert('Enter a username');
  try {
    await apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ username: value }) });
    state.cachedProfile = null;
    alert('Username updated!');
    loadProfile();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

export async function updatePreferredSide() {
  const value = document.getElementById('preferredSideSelect').value;
  try {
    await apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ preferredSide: value }) });
    alert('Preferred side updated!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

export async function changePassword() {
  const currentPwd = document.getElementById('currentPwd').value;
  const newPwd = document.getElementById('newPwd').value;
  if (!currentPwd || !newPwd) return alert('Fill both password fields');
  if (newPwd.length < 6) return alert('New password must be at least 6 characters');
  try {
    await apiFetch('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }) });
    alert('Password changed!');
    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value = '';
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

export async function updateProfilePic() {
  const value = document.getElementById('profilePicInput').value;
  try {
    await apiFetch('/api/auth/profile-picture', { method: 'PUT', body: JSON.stringify({ profilePicture: value }) });
    state.cachedProfile = null;
    alert('Profile picture updated!');
    loadProfile();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// ──────────────────────────────────────────────
// MICRO ANIMATIONS (UI-only helpers)
// ──────────────────────────────────────────────

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.textContent.includes('%') ? '%' : '';
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function animateProgressBars() {
  document.querySelectorAll('.profile-progress-fill').forEach(el => {
    const width = el.dataset.width || '0%';
    setTimeout(() => {
      el.style.width = width;
    }, 150);
  });
}

