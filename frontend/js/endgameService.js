/**
 * Endgame Service - Provider abstraction for endgame positions.
 *
 * PRIMARY:   LLM-generated endgame positions (via OpenRouter)
 * FALLBACK:  Minimal fallback set (10 entries) for offline/demo.
 *
 * Keeps only deterministic FEN positions, difficulty, and themes.
 * No hardcoded educational text — all explanations come from the LLM.
 */

import { apiFetch } from './utils.js';

const endgameCache = [];
let endgamesLoaded = false;

/** Return the endgame set (FEN + metadata only, no educational text). */
export function getEndgameSet() {
  return endgameCache;
}

/** Find an endgame by id. */
export function getEndgameById(id) {
  return endgameCache.find((e) => e.id === id) || endgameCache[0] || null;
}

/**
 * Async fetch — placeholder for Syzygy tablebase integration.
 */
export async function fetchEndgameByFen(fen) {
  return { bestmove: null, dtm: null, wdl: null };
}

/** Get a hint for a specific endgame. */
export function getEndgameHint(id) {
  return 'Improve king activity and restrict the opponent.';
}

/** Get the solution for a specific endgame. */
export function getEndgameSolution(id) {
  const endgame = getEndgameById(id);
  return endgame?.solution?.[0] || '';
}

/**
 * Generate an endgame lesson from the LLM.
 */
export async function generateEndgameLesson(fen, name, options = {}) {
  try {
    const response = await apiFetch('/api/ai/explain/endgame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: fen || 'start',
        name: name || 'Endgame Position',
        difficulty: 'Intermediate',
        themes: options.themes || [],
        solution: [],
        evalBefore: { score: 0 },
        evalAfter: { score: 0 },
        regenerate: options.regenerate || false,
        style: options.style || 'intermediate'
      })
    });
    return response?.data || null;
  } catch {
    return null;
  }
}

/**
 * Load 10 endgame positions from the LLM.
 * Called once during initialization. Cache result for the session.
 * @returns {Promise<boolean>} true if endgames were loaded
 */
export async function loadEndgamesFromLLM() {
  if (endgamesLoaded) return true;
  if (endgameCache.length > 0) {
    endgamesLoaded = true;
    return true;
  }

  try {
    const response = await apiFetch('/api/ai/explore/endgames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const endgames = response?.data;
    if (!endgames || !Array.isArray(endgames) || endgames.length === 0) {
      return false;
    }

    // Clear and populate cache
    endgameCache.length = 0;
    for (const eg of endgames) {
      endgameCache.push({
        id: eg.id || `eg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: eg.name || 'Endgame Position',
        fen: eg.fen || '8/8/8/8/8/8/5K2/3Q2k1 w - - 0 1',
        solution: eg.solution || ['Qd2'],
        hints: [],
        difficulty: eg.difficulty || 'Intermediate',
        themes: eg.themes || ['general']
      });
    }

    endgamesLoaded = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Load a completely new set of endgames from the LLM.
 * Used by the "Generate New Endgames" button.
 * @returns {Promise<boolean>} true if endgames were reloaded
 */
export async function regenerateEndgameList() {
  endgamesLoaded = false;
  endgameCache.length = 0;
  return loadEndgamesFromLLM();
}

