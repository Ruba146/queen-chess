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
    const winRate = total > 0 ? ((user.stats?.rapid?.wins || 0) / total * 100).toFixed(1) + '%' : '0%';

    let rank = 'Beginner';
    const rating = user.ratings?.rapid || 1200;
    if (rating >= 800) rank = 'Bronze';
    if (rating >= 1200) rank = 'Silver';
    if (rating >= 1600) rank = 'Gold';
    if (rating >= 2000) rank = 'Platinum';
    if (rating >= 2400) rank = 'Diamond';
    if (rating >= 2700) rank = 'Master';
    if (rating >= 2900) rank = 'Grandmaster';

    document.getElementById('content').innerHTML = `
      <div class="profile-page">
          <div class="profile-header">
              <div class="profile-avatar">${avatarHtml}</div>
              <div class="profile-info">
                  <h2>${name}</h2>
                  <div class="username-tag">@${user.username}</div>
                  <div class="member-since">Member since ${joinDate} • ${user.email}</div>
                  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                      <span class="rank-badge ${rank.toLowerCase()}">🏅 ${rank}</span>
                      <span class="level-badge ${(user.playerLevel || 'Beginner').toLowerCase()}">📊 ${user.playerLevel || 'Beginner'}</span>
                  </div>
              </div>
          </div>
          <div class="profile-stats-grid">
              <div class="profile-stat-card">
                  <div class="stat-icon">🏅</div>
                  <div class="stat-label">Rating</div>
                  <div class="stat-value">${rating}</div>
                  <div class="stat-sub">${rank}</div>
              </div>
              <div class="profile-stat-card">
                  <div class="stat-icon">🎮</div>
                  <div class="stat-label">Total Games</div>
                  <div class="stat-value">${total}</div>
                  <div class="stat-sub">${user.stats?.rapid?.wins || 0}W / ${user.stats?.rapid?.losses || 0}L / ${user.stats?.rapid?.draws || 0}D</div>
              </div>
              <div class="profile-stat-card">
                  <div class="stat-icon">📈</div>
                  <div class="stat-label">Win Rate</div>
                  <div class="stat-value">${winRate}</div>
                  <div class="stat-sub">${user.winStreak?.rapid || 0} win streak</div>
              </div>
              <div class="profile-stat-card">
                  <div class="stat-icon">📊</div>
                  <div class="stat-label">Level</div>
                  <div class="stat-value">${user.playerLevel || 'Beginner'}</div>
                  <div class="stat-sub">${stats.avgAccuracy || 0}% avg accuracy</div>
              </div>
              <div class="profile-stat-card">
                  <div class="stat-icon">♟</div>
                  <div class="stat-label">Preferred Side</div>
                  <div class="stat-value">${(user.preferredSide || 'random').charAt(0).toUpperCase() + (user.preferredSide || 'random').slice(1)}</div>
                  <div class="stat-sub">Difficulty: ${(user.mostPlayedDifficulty || 'intermediate').charAt(0).toUpperCase() + (user.mostPlayedDifficulty || 'intermediate').slice(1)}</div>
              </div>
              <div class="profile-stat-card">
                  <div class="stat-icon">📖</div>
                  <div class="stat-label">Favorite Opening</div>
                  <div class="stat-value" style="font-size:16px;">${user.favoriteOpening || 'Unknown'}</div>
                  <div class="stat-sub">Consistency: ${stats.consistency || 50}%</div>
              </div>
          </div>
          <div class="profile-settings">
              <h3>⚙️ Account Settings</h3>
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
