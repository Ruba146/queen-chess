/**
 * AI Coach Service - Generates personalized learning plans from real game data.
 *
 * Uses existing backend endpoints:
 *   GET /api/auth/extended-stats/rapid  -> rating, accuracy, consistency, playerLevel, favoriteOpening
 *   GET /api/game/my-games             -> full game data with analysis fields
 *
 * PRIMARY:  POST /api/ai/coach/plan — LLM generates all recommendations
 * FALLBACK: Minimal static message when backend is unavailable
 *
 * No hardcoded chess recommendations.
 * Every recommendation comes from the AI backend (OpenRouter via OpenRouter).
 */

import { apiFetch } from './utils.js';

/**
 * Fetch the player's learning profile from the backend.
 * Aggregates: rating, accuracy, opening stats, mistake patterns, endgame quality, time usage.
 */
export async function getPlayerLearningProfile() {
  const [profileResult, statsResult, gamesResult] = await Promise.allSettled([
    apiFetch('/api/auth/profile'),
    apiFetch('/api/auth/extended-stats/rapid'),
    apiFetch('/api/game/my-games')
  ]);

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
  const games = gamesResult.status === 'fulfilled' ? gamesResult.value : [];

  return buildLearningProfile({ profile, stats, games });
}

/**
 * Generate a personalized learning plan from the player's profile.
 * This is used as a CLIENT-SIDE FALLBACK when the backend AI call fails.
 * It uses a simple "unavailable" pattern — no hardcoded chess knowledge.
 *
 * @param {Object} profileData - Output of getPlayerLearningProfile()
 * @returns {Object} { summary, difficulty, studyTime, openings, tactics, endgames }
 */
export function generateLearningPlan(profileData) {
  const UNAVAILABLE_MSG = 'AI explanation is temporarily unavailable.';
  const rating = profileData.rating || 1200;
  const totalGames = profileData.gamesPlayed || 0;

  const difficulty = rating < 1000 ? 'Beginner' : rating < 1400 ? 'Intermediate' : rating < 1800 ? 'Advanced' : 'Expert';
  const baseTime = totalGames < 10 ? 20 : 30;
  const studyTime = rating < 1000 ? baseTime : rating < 1600 ? baseTime + 10 : baseTime + 20;

  return {
    summary: `📊 ${UNAVAILABLE_MSG} Backend AI plan could not be generated.`,
    difficulty,
    studyTime,
    openings: [UNAVAILABLE_MSG],
    tactics: [UNAVAILABLE_MSG],
    endgames: [UNAVAILABLE_MSG]
  };
}

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

function buildLearningProfile({ profile, stats, games }) {
  const openingCounts = {};
  let totalBlunders = 0;
  let totalMoves = 0;
  let totalMissedWins = 0;
  let totalDuration = 0;
  let playedGames = 0;
  let aggOpeningScore = 0;
  let aggMiddleGameScore = 0;
  let aggEndgameScore = 0;
  let aggTacticalAbility = 0;
  let aggPositionalPlay = 0;
  let aggConsistency = 0;
  let aggDecisionMaking = 0;
  let aggEndgameQuality = 0;

  const nonTrainingGames = (games || []).filter(g => !g.isTrainingDataset);

  nonTrainingGames.forEach((game) => {
    if (!game) return;
    playedGames++;

    // Opening statistics
    const opening = game.opening || 'Unknown Opening';
    openingCounts[opening] = (openingCounts[opening] || 0) + 1;

    // Aggregate analysis metrics
    totalBlunders += game.blunders || 0;
    totalMoves += game.moves?.length || 0;
    totalMissedWins += game.missedWins || 0;
    totalDuration += game.duration || 0;
    aggOpeningScore += game.openingScore || 0;
    aggMiddleGameScore += game.middleGameScore || 0;
    aggEndgameScore += game.endgameScore || 0;
    aggTacticalAbility += game.tacticalAbilityScore || 0;
    aggPositionalPlay += game.positionalPlayScore || 0;
    aggConsistency += game.consistencyScore || 0;
    aggDecisionMaking += game.decisionMakingScore || 0;
    aggEndgameQuality += game.endgameQualityScore || 0;
  });

  const divisor = Math.max(1, playedGames);

  // Most played opening
  const mostPlayedOpening = Object.entries(openingCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    username: profile?.username || stats?.username || 'Player',
    rating: stats?.rating || profile?.ratings?.rapid || 1200,
    avgAccuracy: stats?.avgAccuracy || 0,
    consistencyScore: stats?.consistency || Math.round(aggConsistency / divisor),
    favoriteOpening: stats?.favoriteOpening,
    mostPlayedOpening,
    blunderRate: totalMoves > 0 ? totalBlunders / totalMoves : 0,
    totalBlunders,
    totalMissedWins,
    gamesPlayed: stats?.gamesPlayed || playedGames,
    totalDuration,
    openingScore: Math.round(aggOpeningScore / divisor),
    middleGameScore: Math.round(aggMiddleGameScore / divisor),
    endgameScore: Math.round(aggEndgameScore / divisor),
    tacticalAbilityScore: Math.round(aggTacticalAbility / divisor),
    positionalPlayScore: Math.round(aggPositionalPlay / divisor),
    decisionMakingScore: Math.round(aggDecisionMaking / divisor),
    endgameQualityScore: Math.round(aggEndgameQuality / divisor),
    openingCounts,
    games: nonTrainingGames
  };
}

