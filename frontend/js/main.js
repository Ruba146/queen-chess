import { checkUrlParams } from './analysis.js';

let __appInitialized = false;

function init() {
  if (__appInitialized) return;
  __appInitialized = true;

  // If analysis query param exists, let analysis.js handle it.
  // Otherwise, game startup is triggered by page-specific buttons and inline handlers.
  try {
    if (typeof window !== 'undefined' && typeof checkUrlParams === 'function') {
      checkUrlParams();
    }
  } catch {
    // no-op: startup should not break gameplay
  }
}

document.addEventListener('DOMContentLoaded', init, { once: true });

