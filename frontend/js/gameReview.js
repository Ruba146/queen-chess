/**
 * Game Review Module
 *
 * After every completed game, generates:
 *   - Game Summary
 *   - Opening Review
 *   - Critical Moments
 *   - Mistakes & Blunders
 *   - Missed Tactics
 *   - Strengths & Weaknesses
 *   - Recommended Training
 *   - Recommended Openings, Tactics, Endgames
 *
 * Reuses:
 *   - analysis.js for existing game data
 *   - apiFetch for backend calls
 *   - aiCoachService for player profile
 *   - learningView for render helpers
 *   - analysisService (backend) for metrics
 */

import { apiFetch } from './utils.js';
import { getPlayerLearningProfile } from './aiCoachService.js';
import { renderBadges } from './learningView.js';

const state = {
  review: null,
  game: null
};

export function renderGameReview(gameData) {
  state.game = gameData;
  return `
    <div class="game-review-page">
      <div id="gameReviewLoading" style="text-align:center;padding:40px;">
        <div style="font-size:32px;margin-bottom:12px;">🔄</div>
        <p style="color:#888;">Generating comprehensive game review...</p>
      </div>
      <div id="gameReviewContent" style="display:none;"></div>
      <div id="gameReviewError" style="display:none;text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
        <p style="color:#f87171;">Unable to generate review. Please ensure the game has been analyzed.</p>
      </div>
    </div>
  `;
}

export async function initGameReview(gameId) {
  try {
    // Fetch game data from analysis endpoint
    const gameResponse = await apiFetch(`/api/analysis/${gameId}`);
    state.game = gameResponse;

    // Get player profile
    const profile = await getPlayerLearningProfile();

    // Generate review
    const reviewResponse = await apiFetch('/api/ai/review/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: {
          _id: gameId,
          moves: state.game.moves || state.game.analysis?.map(m => m.move) || [],
          result: state.game.result,
          playerColor: state.game.playerColor || 'white',
          opening: state.game.opening,
          duration: state.game.duration,
          difficulty: state.game.difficulty,
          ratingsBefore: { player1: state.game.ratingBefore || 1200 },
          ratingsAfter: { player1: state.game.ratingAfter || 1200 },
          accuracy: state.game.accuracy,
          createdAt: new Date().toISOString()
        },
        profile
      })
    });

    state.review = reviewResponse.data;
    renderReviewContent();

  } catch (error) {
    console.error('Game Review Error:', error);
    document.getElementById('gameReviewLoading').style.display = 'none';
    document.getElementById('gameReviewError').style.display = 'block';
  }
}

function renderReviewContent() {
  if (!state.review) return;

  document.getElementById('gameReviewLoading').style.display = 'none';
  const content = document.getElementById('gameReviewContent');
  content.style.display = 'block';

  const s = state.review.summary || {};
  const stats = state.review.statistics || {};
  const phases = state.review.phaseScores || {};
  const critical = state.review.criticalMoments || [];
  const mistakes = state.review.mistakes || [];
  const blunders = state.review.blunders || [];
  const strengths = state.review.strengths || [];
  const weaknesses = state.review.weaknesses || [];
  const trainingRecs = state.review.trainingRecommendations || [];

  content.innerHTML = `
    <!-- Game Summary -->
    <div class="learning-intro-text">
      <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">📊 Game Review</h3>
      <p>${state.review.opening?.review || 'Opening review unavailable.'}</p>
    </div>

    <!-- Summary Stats -->
    <div class="learning-hero-stats" style="flex-wrap:wrap;">
      <div class="learning-hero-stat">
        <span class="learning-hero-stat-value">${s.accuracy || 0}%</span>
        <span class="learning-hero-stat-label">Accuracy</span>
      </div>
      <div class="learning-hero-stat">
        <span class="learning-hero-stat-value">${s.performanceScore || 0}</span>
        <span class="learning-hero-stat-label">Performance</span>
      </div>
      <div class="learning-hero-stat">
        <span class="learning-hero-stat-value">${s.averageCentipawnLoss || 0}</span>
        <span class="learning-hero-stat-label">Avg cp Loss</span>
      </div>
      <div class="learning-hero-stat">
        <span class="learning-hero-stat-value">${s.totalMoves || 0}</span>
        <span class="learning-hero-stat-label">Moves</span>
      </div>
      <div class="learning-hero-stat">
        <span class="learning-hero-stat-value">${s.ratingChange > 0 ? '+' : ''}${s.ratingChange || 0}</span>
        <span class="learning-hero-stat-label">Rating Δ</span>
      </div>
    </div>

    <!-- Phase Scores -->
    <div class="learning-coach-live" style="margin-top:8px;">
      <h4>Phase Scores</h4>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${renderPhaseScore('Opening', phases.opening)}
        ${renderPhaseScore('Middlegame', phases.middlegame)}
        ${renderPhaseScore('Endgame', phases.endgame)}
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="learning-plan-grid" style="margin-top:8px;">
      <div class="learning-plan-card">
        <h5>🎯 Move Quality</h5>
        <ul>
          <li>Best: ${stats.bestMoves || 0}</li>
          <li>Excellent: ${stats.excellentMoves || 0}</li>
          <li>Good: ${stats.goodMoves || 0}</li>
          <li>Inaccuracies: ${stats.inaccuracies || 0}</li>
        </ul>
      </div>
      <div class="learning-plan-card">
        <h5>⚠️ Errors</h5>
        <ul>
          <li>Mistakes: ${stats.mistakes || 0}</li>
          <li>Blunders: ${stats.blunders || 0}</li>
          <li>Brilliant: ${stats.brilliantMoves || 0}</li>
          <li>Missed Wins: ${stats.missedWins || 0}</li>
        </ul>
      </div>
      <div class="learning-plan-card">
        <h5>🧠 Skills</h5>
        <ul>
          <li>Tactical: ${stats.tacticalAbility || 0}%</li>
          <li>Positional: ${stats.positionalPlay || 0}%</li>
          <li>Decision: ${stats.decisionMaking || 0}%</li>
          <li>Consistency: ${stats.consistency || 0}%</li>
        </ul>
      </div>
      <div class="learning-plan-card">
        <h5>🏁 Playing Style</h5>
        <ul>
          <li>Style: ${s.playingStyle || 'Balanced'}</li>
          <li>Level: ${s.playerLevel || 'Beginner'}</li>
          <li>Opening: ${state.review.opening?.name || 'Unknown'}</li>
        </ul>
      </div>
    </div>

    <!-- Critical Moments -->
    ${critical.length > 0 ? `
    <div class="learning-collapsible open" style="margin-top:8px;">
      <div class="learning-collapsible-header" onclick="this.closest('.learning-collapsible').classList.toggle('open')">
        <span class="learning-collapsible-icon">🔑</span>
        <span class="learning-collapsible-title">Critical Moments (${critical.length})</span>
        <span class="learning-collapsible-arrow">▾</span>
      </div>
      <div class="learning-collapsible-body" style="max-height:2000px;">
        <div class="learning-collapsible-inner">
          ${critical.map(m => `
            <div style="padding:10px;border-radius:10px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.1);margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;">
                <span style="font-size:13px;">${m.description || `Move ${m.moveNumber}: ${m.move}`}</span>
                <span class="learning-data-badge" style="background:rgba(248,113,113,0.1);color:#f87171;border-color:rgba(248,113,113,0.2);">${m.classification || 'Critical'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Strengths & Weaknesses -->
    <div class="learning-plan-grid" style="margin-top:12px;">
      ${strengths.length > 0 ? `
      <div class="learning-plan-card">
        <h5>💪 Strengths</h5>
        <ul>${strengths.map(s => `<li style="color:#4ade80;">✓ ${s}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${weaknesses.length > 0 ? `
      <div class="learning-plan-card">
        <h5>📈 Areas to Improve</h5>
        <ul>${weaknesses.map(w => `<li style="color:#fbbf24;">→ ${w}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>

    <!-- Training Recommendations -->
    ${trainingRecs.length > 0 ? `
    <div class="learning-tip-box" style="margin-top:12px;">
      <span class="learning-detail-label" style="color:#fbbf24;">📚 Recommended Training</span>
      <ul style="list-style:none;padding:0;margin:4px 0 0 0;">
        ${trainingRecs.map(r => `<li style="color:#ddd;font-size:13px;padding:4px 0;line-height:1.5;">• ${r}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Opening & Endgame Recommendations -->
    ${state.review.recommendedTraining ? `
    <div class="learning-plan-grid" style="margin-top:12px;">
      ${state.review.recommendedTraining.tacticalThemes?.length > 0 ? `
      <div class="learning-plan-card">
        <h5>⚡ Recommended Tactics</h5>
        <ul>${state.review.recommendedTraining.tacticalThemes.map(t => `<li>• ${t}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${state.review.recommendedTraining.endgameThemes?.length > 0 ? `
      <div class="learning-plan-card">
        <h5>🏁 Recommended Endgames</h5>
        <ul>${state.review.recommendedTraining.endgameThemes.map(e => `<li>• ${e}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${state.review.recommendedTraining.openings?.length > 0 ? `
      <div class="learning-plan-card">
        <h5>♟ Recommended Openings</h5>
        <ul>${state.review.recommendedTraining.openings.map(o => `<li>• ${o}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- AI Narrative -->
    ${state.review.aiNarrative?.gameSummary ? `
    <div class="ai-explanation-main" style="margin-top:12px;">
      <span style="color:#c084fc;">🤖 AI Coach:</span> ${state.review.aiNarrative.gameSummary}
    </div>
    ` : ''}
    ${state.review.aiNarrative?.openingReview ? `
    <div class="ai-explanation-main" style="margin-top:8px;">
      <span style="color:#c084fc;">♟ Opening Review:</span> ${state.review.aiNarrative.openingReview}
    </div>
    ` : ''}
  `;
}

function renderPhaseScore(name, score) {
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  return `
    <div style="text-align:center;">
      <span style="display:block;font-size:11px;color:#888;">${name}</span>
      <span style="display:block;font-size:18px;font-weight:700;color:${color};">${score || 0}%</span>
    </div>
  `;
}

