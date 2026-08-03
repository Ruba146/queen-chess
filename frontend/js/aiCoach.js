import { generateLearningPlan, getPlayerLearningProfile } from './aiCoachService.js';
import { renderBadges, renderStatus, setHtml } from './learningView.js';
import { apiFetch } from './utils.js';

export function renderAICoach() {
  return `
    <div class="learning-tool-shell">
      <div class="learning-coach-live">
        <div>
          <h4>Personalized Learning Plan</h4>
          <div id="coachSummary">${renderStatus('Loading your recent games and profile...')}</div>
        </div>
        <button id="refreshCoachPlan">Refresh Plan</button>
      </div>
      <div id="coachMeta" class="learning-badge-row"></div>
      <div id="coachPlan" class="learning-plan-grid"></div>
    </div>
  `;
}

export function initAICoach() {
  document.getElementById('refreshCoachPlan')?.addEventListener('click', loadPlan);
  loadPlan();
}

async function loadPlan() {
  setHtml('coachPlan', renderStatus('Analyzing rating, accuracy, openings, mistakes, and endgames...'));
  try {
    const profile = await getPlayerLearningProfile();
    
    // Try backend AI coach first
    let plan;
    try {
      const response = await apiFetch('/api/ai/coach/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          rating: profile.rating,
          avgAccuracy: profile.avgAccuracy,
          consistencyScore: profile.consistencyScore,
          blunderRate: profile.blunderRate,
          tacticalAbilityScore: profile.tacticalAbilityScore,
          positionalPlayScore: profile.positionalPlayScore,
          openingScore: profile.openingScore,
          endgameQualityScore: profile.endgameQualityScore,
          gamesPlayed: profile.gamesPlayed,
          favoriteOpening: profile.favoriteOpening || profile.mostPlayedOpening,
          decisionMakingScore: profile.decisionMakingScore
        })
      });
      plan = response.data;
    } catch {
      // Fallback to client-side generation
      plan = generateLearningPlan(profile);
    }

    // Build structured coach plan display with bullet points
    const summary = plan.summary || '';
    const todayGoal = plan.todayGoal || '';
    const focus = plan.focus || '';
    const strengths = plan.strengths || [];
    const weaknesses = plan.weaknesses || [];
    const recommendedOpening = plan.recommendedOpening || '';
    const recommendedEndgame = plan.recommendedEndgame || '';
    const trainingPriority = plan.trainingPriority || '';
    const ratingTarget = plan.ratingTarget || '';

    // Show meta info
    setHtml('coachMeta', renderBadges([
      `${profile.username}`,
      `Rating ${profile.rating}`,
      `${profile.gamesPlayed || 0} games`
    ]));

    // If summary exists, use it. Otherwise build from structured fields.
    if (summary && summary.length > 80) {
      setHtml('coachSummary', summary);
      setHtml('coachPlan', `
        <div class="learning-plan-card" style="grid-column:1/-1;">
          <h5>🤖 Coach's Plan</h5>
          <p style="color:#ddd;font-size:13px;line-height:1.8;white-space:pre-wrap;">${summary}</p>
        </div>
      `);
    } else {
      // Build structured display from individual fields
      setHtml('coachSummary', 'Your personalized chess improvement plan is ready.');
      
      let planHtml = `<div class="learning-plan-card" style="grid-column:1/-1;"><h5>🤖 Coach's Plan</h5><div style="display:flex;flex-direction:column;gap:10px;">`;

      if (todayGoal) {
        planHtml += `<div><span class="learning-detail-label">🎯 Today's Goal</span><p style="color:#ddd;font-size:13px;">${todayGoal}</p></div>`;
      }
      if (focus) {
        planHtml += `<div><span class="learning-detail-label">📌 Focus</span><p style="color:#ddd;font-size:13px;">${focus}</p></div>`;
      }
      if (strengths.length > 0) {
        planHtml += `<div><span class="learning-detail-label" style="color:#4ade80;">💪 Strengths</span><ul style="margin:4px 0 0 0;padding:0;list-style:none;">${strengths.map(s => `<li style="color:#bbb;font-size:12px;padding:2px 0 2px 18px;position:relative;">• ${s}</li>`).join('')}</ul></div>`;
      }
      if (weaknesses.length > 0) {
        planHtml += `<div><span class="learning-detail-label" style="color:#f87171;">⚠️ Weaknesses</span><ul style="margin:4px 0 0 0;padding:0;list-style:none;">${weaknesses.map(w => `<li style="color:#bbb;font-size:12px;padding:2px 0 2px 18px;position:relative;">• ${w}</li>`).join('')}</ul></div>`;
      }
      if (recommendedOpening) {
        planHtml += `<div><span class="learning-detail-label">📖 Recommended Opening</span><p style="color:#ddd;font-size:13px;">${recommendedOpening}</p></div>`;
      }
      if (recommendedEndgame) {
        planHtml += `<div><span class="learning-detail-label">🏁 Recommended Endgame</span><p style="color:#ddd;font-size:13px;">${recommendedEndgame}</p></div>`;
      }
      if (trainingPriority) {
        planHtml += `<div><span class="learning-detail-label">⚡ Training Priority</span><p style="color:#ddd;font-size:13px;">${trainingPriority}</p></div>`;
      }
      if (ratingTarget) {
        planHtml += `<div><span class="learning-detail-label">🎯 Rating Target</span><p style="color:#ddd;font-size:13px;">${ratingTarget}</p></div>`;
      }

      planHtml += `</div></div>`;
      setHtml('coachPlan', planHtml);
    }
  } catch (error) {
    setHtml('coachPlan', renderStatus(`Unable to build a plan yet: ${error.message}`));
  }
}

