/**
 * Opening Service - Provider abstraction for chess opening data.
 *
 * PRIMARY:   LLM-generated opening list (via OpenRouter)
 * SECONDARY: Lichess Opening Explorer API (https://explorer.lichess.ovh/masters)
 * FALLBACK:  Minimal built-in ECO catalog (10 entries) for offline/demo.
 *
 * To switch provider, replace the implementation of fetchOpeningMetadata()
 * and getOpenings() — no UI changes needed.
 */

import { apiFetch } from './utils.js';

/**
 * AI Opening Cache — stores openings discovered from the LLM so they persist
 * during the session without re-querying the LLM.
 */
const aiOpeningCache = new Map();

let aiOpeningCounter = 0;
let openingsLoaded = false;

const LICHHESS_EXPLORER_BASE = 'https://explorer.lichess.ovh/masters';

/**
 * Convert SAN moves to UCI format for the Lichess API.
 */
function sanMovesToUci(moves) {
  if (!window.Chess) return [];
  const chess = new window.Chess();
  return moves.map((san) => {
    const move = chess.move(san, { sloppy: true });
    return move ? `${move.from}${move.to}${move.promotion || ''}` : null;
  }).filter(Boolean);
}

/**
 * Return the list of available openings.
 * Returns AI-discovered openings from the cache.
 */
export function getOpenings() {
  const local = [];
  for (const opening of aiOpeningCache.values()) {
    local.push(opening);
  }
  return local;
}

/**
 * Find an opening by its id.
 * Returns null if not found.
 */
export function getOpeningById(id) {
  return aiOpeningCache.get(id) || null;
}

/**
 * Fetch enriched metadata from the Lichess Masters Explorer.
 */
export async function fetchOpeningMetadata(opening) {
  const uciMoves = sanMovesToUci(opening.moves);
  const play = uciMoves.join(',');
  if (!play) return { ...opening, games: null, explorerMoves: [] };

  try {
    const url = `${LICHHESS_EXPLORER_BASE}?play=${encodeURIComponent(play)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { ...opening, games: null, explorerMoves: [] };
    }
    const data = await response.json();

    return {
      ...opening,
      games: (data.white || 0) + (data.draws || 0) + (data.black || 0),
      explorerMoves: data.moves || [],
      averageRating: data.averageRating || null
    };
  } catch {
    return { ...opening, games: null, explorerMoves: [] };
  }
}

/**
 * Search for openings by name, ECO, or category.
 * Searches AI-discovered openings.
 */
export function searchOpenings(query = '', difficulty = 'All', category = 'All') {
  const q = query.toLowerCase();
  const allOpenings = getOpenings();
  return allOpenings.filter((opening) => {
    const haystack = `${opening.name} ${opening.eco || ''} ${opening.category || ''}`.toLowerCase();
    return (!q || haystack.includes(q)) &&
      (difficulty === 'All' || opening.difficulty === difficulty) &&
      (category === 'All' || opening.category === category);
  });
}

/**
 * Search for an opening by name using the AI backend.
 */
export async function aiSearchOpeningByName(name) {
  if (!name || !name.trim()) return null;

  const normalizedName = name.trim();
  const cacheKey = normalizedName.toLowerCase();

  // Check AI cache first
  for (const [id, opening] of aiOpeningCache) {
    if (opening.name.toLowerCase() === cacheKey) {
      return opening;
    }
  }

  try {
    const response = await apiFetch('/api/ai/search/opening', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: normalizedName })
    });

    const data = response?.data;
    if (!data) return null;

    aiOpeningCounter++;
    const aiId = `ai-opening-${aiOpeningCounter}`;

    const aiOpening = {
      id: aiId,
      name: normalizedName,
      eco: data.eco || 'N/A',
      category: 'AI Generated',
      difficulty: data.difficulty || 'Intermediate',
      moves: data.moves || [],
      aiGenerated: true,
      aiExplanation: data,
      games: null,
      explorerMoves: []
    };

    aiOpeningCache.set(aiId, aiOpening);

    return aiOpening;
  } catch {
    return null;
  }
}

/**
 * Check if an opening was AI-generated.
 * @param {string} id - Opening id
 * @returns {boolean}
 */
export function isAIGeneratedOpening(id) {
  return id && id.startsWith('ai-opening-');
}

/**
 * Get the AI explanation data for an AI-generated opening.
 * @param {string} id - Opening id
 * @returns {Object|null}
 */
export function getAIExplanation(id) {
  const opening = aiOpeningCache.get(id);
  return opening?.aiExplanation || null;
}

/**
 * Load 10 openings from the LLM to populate the explorer dropdown.
 * Called once during initialization. Cache result for the session.
 * @returns {Promise<boolean>} true if openings were loaded
 */
export async function loadOpeningsFromLLM() {
  if (openingsLoaded) return true;
  if (aiOpeningCache.size > 0) {
    openingsLoaded = true;
    return true;
  }

  try {
    const response = await apiFetch('/api/ai/explore/openings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const openings = response?.data;
    if (!openings || !Array.isArray(openings) || openings.length === 0) {
      return false;
    }

    // Clear any existing cache and populate with LLM openings
    aiOpeningCache.clear();
    aiOpeningCounter = 0;

    for (const opening of openings) {
      aiOpeningCounter++;
      const aiId = `ai-opening-${aiOpeningCounter}`;
      aiOpeningCache.set(aiId, {
        id: aiId,
        name: opening.name || 'Unknown Opening',
        eco: opening.eco || 'N/A',
        category: opening.category || 'AI Generated',
        difficulty: opening.difficulty || 'Intermediate',
        moves: opening.moves || [],
        aiGenerated: true,
        games: null,
        explorerMoves: []
      });
    }

    openingsLoaded = true;
    return true;
  } catch {
    return false;
  }
}

