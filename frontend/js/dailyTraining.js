/**
 * Daily Training — Personalized daily chess training sessions.
 *
 * Generates a new training session every day based on:
 *   - Player rating
 *   - Previous games
 *   - Accuracy, Blunders, Weak tactical themes, Weak endgames, Favorite openings
 *
 * Training includes:
 *   - Tactical puzzles
 *   - Opening exercises
 *   - Endgame exercises
 *   - Strategy lesson
 *   - AI recommendation
 *
 * Reuses:
 *   - apiFetch for backend calls
 *   - puzzleService for puzzle data
 *   - endgameService for endgame data
 *   - openingService for opening data
 *   - aiCoachService for player profile
 *   - learningView for render helpers
 */

import { apiFetch } from './utils.js';
import { getPlayerLearningProfile } from './aiCoachService.js';

const state = {
  session: null,
  profile: null,
  activeComponent: null
};

export function renderDailyTraining() {
  return `
    <div class="daily-training-page">
      <div class="daily-training-header">
        <div class="daily-training-title">
          <h2>📅 Daily Training</h2>
          <p id="dailyTrainingDate" style="color:#aaa;font-size:13px;">Loading...</p>
        </div>
        <div id="dailyTrainingStats" class="learning-hero-stats">
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value" id="dailyTrainingCount">-</span>
            <span class="learning-hero-stat-label">Exercises</span>
          </div>
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value" id="dailyTrainingTime">-</span>
            <span class="learning-hero-stat-label">Minutes</span>
          </div>
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value" id="dailyTrainingDifficulty">-</span>
            <span class="learning-hero-stat-label">Level</span>
          </div>
        </div>
      </div>

      <div id="dailyTrainingLoading" style="text-align:center;padding:40px;color:#888;">
        <div style="font-size:32px;margin-bottom:12px;">🔄</div>
        <p>Generating your personalized training session...</p>
      </div>

      <div id="dailyTrainingContent" style="display:none;">
        <div id="dailyTrainingAI" class="ai-explanation-main" style="margin-bottom:16px;display:none;"></div>

        <div class="daily-training-components" id="dailyTrainingComponents"></div>

        <div class="learning-practice-cta" style="margin-top:20px;">
          <div class="learning-cta-content">
            <h3>🎯 Ready to train?</h3>
            <p>Complete each exercise. Your progress is tracked and adapts to your performance.</p>
            <button class="learning-cta-btn" id="dailyTrainingStartBtn">Start Training</button>
          </div>
        </div>
      </div>

      <div id="dailyTrainingError" style="display:none;text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
        <p style="color:#f87171;">Unable to generate training session. Make sure you have games played and are logged in.</p>
        <button class="learning-cta-btn" id="dailyTrainingRetryBtn" style="margin-top:12px;">Retry</button>
      </div>
    </div>
  `;
}

export async function initDailyTraining() {
  const dateEl = document.getElementById('dailyTrainingDate');
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  try {
    // Load player profile
    state.profile = await getPlayerLearningProfile();

    // Generate daily training session from backend
    const response = await apiFetch('/api/ai/training/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: state.profile })
    });

    state.session = response.data;
    renderSession();

  } catch (error) {
    console.error('Daily Training Error:', error);
    document.getElementById('dailyTrainingLoading').style.display = 'none';
    document.getElementById('dailyTrainingError').style.display = 'block';
  }

  document.getElementById('dailyTrainingRetryBtn')?.addEventListener('click', () => {
    document.getElementById('dailyTrainingError').style.display = 'none';
    document.getElementById('dailyTrainingLoading').style.display = 'block';
    initDailyTraining();
  });

  document.getElementById('dailyTrainingStartBtn')?.addEventListener('click', startTraining);
}

function renderSession() {
  if (!state.session) return;

  document.getElementById('dailyTrainingLoading').style.display = 'none';
  document.getElementById('dailyTrainingContent').style.display = 'block';

  // Update stats
  setNumericText('dailyTrainingCount', state.session.components?.length || 0);
  setNumericText('dailyTrainingTime', state.session.sessionDuration || 0);
  setTextValue('dailyTrainingDifficulty',
    (state.session.difficulty || 'intermediate').charAt(0).toUpperCase() +
    (state.session.difficulty || 'intermediate').slice(1)
  );

  // AI Recommendation
  if (state.session.aiRecommendation) {
    const aiEl = document.getElementById('dailyTrainingAI');
    aiEl.innerHTML = `<span style="color:#c084fc;">🤖 Coach says:</span> ${state.session.aiRecommendation}`;
    aiEl.style.display = 'block';
  }

  // Render components
  const componentsContainer = document.getElementById('dailyTrainingComponents');
  if (componentsContainer && state.session.components) {
    componentsContainer.innerHTML = state.session.components.map(comp =>
      renderComponentCard(comp)
    ).join('');
  }
}

function renderComponentCard(component) {
  const typeLabels = {
    tactics: '⚡ Tactical Puzzles',
    opening: '♟ Opening Exercises',
    endgame: '🏁 Endgame Practice',
    strategy: '🧠 Strategy Lesson'
  };

  const difficultyColors = {
    beginner: '#9ca3af',
    elementary: '#4ade80',
    intermediate: '#60a5fa',
    advanced: '#c084fc',
    expert: '#f472b6',
    master: '#fbbf24'
  };

  // Map component type to navigation section
  const navSections = {
    tactics: 'opening-search', // Will navigate to tactics via card click
    opening: 'openings',
    endgame: 'endgame',
    strategy: 'chat'
  };

  return `
    <div class="daily-training-component" data-component="${component.id}" data-nav="${navSections[component.type] || ''}" style="cursor:pointer;" onclick="document.querySelector('[data-section=\\'${navSections[component.type] || 'chat'}\\']')?.click()">
      <div class="learning-topic-card learning-hover-scale">
        <div class="learning-topic-icon" style="font-size:32px;">${component.icon || '📚'}</div>
        <div class="learning-topic-content">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
            <h4 class="learning-topic-title">${typeLabels[component.type] || component.title} →</h4>
            <span class="learning-difficulty-badge" style="background:${(difficultyColors[component.difficulty] || '#9ca3af')}15;color:${difficultyColors[component.difficulty] || '#9ca3af'};border-color:${(difficultyColors[component.difficulty] || '#9ca3af')}30;font-size:11px;padding:2px 8px;">
              ${component.difficulty || 'intermediate'}
            </span>
          </div>
          <p class="learning-topic-desc">${component.description || 'Training exercise'}</p>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
            ${component.count ? `<span class="learning-data-badge">${component.count} exercises</span>` : ''}
            ${component.themes ? component.themes.map(t => `<span class="learning-data-badge">${t}</span>`).join('') : ''}
            ${component.focus ? `<span class="learning-data-badge">${component.focus}</span>` : ''}
          </div>
          <div style="margin-top:8px;color:#888;font-size:12px;">
            Click to start practicing →
          </div>
        </div>
      </div>
    </div>
  `;
}

function startTraining() {
  // Scroll to first component
  const firstComponent = document.querySelector('.daily-training-component');
  if (firstComponent) {
    firstComponent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstComponent.style.boxShadow = '0 0 20px rgba(168,85,247,0.3)';
    setTimeout(() => { firstComponent.style.boxShadow = ''; }, 2000);
  }

  // Navigate to the puzzle trainer for tactical component
  // The user can use the AI Learning cards to navigate to specific modules
  const cards = document.querySelectorAll('.ai-card');
  cards.forEach(card => {
    if (card.dataset.section === 'tactics' || card.dataset.section === 'puzzle-trainer') {
      card.click();
    }
  });
}

function setNumericText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setTextValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

