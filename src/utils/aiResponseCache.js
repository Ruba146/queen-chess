/**
 * AI Response Cache
 * In-memory cache for AI responses to avoid redundant API calls.
 */

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function initCache() {
  // Clear expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now > entry.expiresAt) {
        cache.delete(key);
      }
    }
  }, 1000 * 60 * 5); // Every 5 minutes
  console.log("[Cache] AI response cache initialized");
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl = CACHE_TTL) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

function clearCache() {
  cache.clear();
}

module.exports = {
  initCache,
  getCache,
  setCache,
  clearCache,
};