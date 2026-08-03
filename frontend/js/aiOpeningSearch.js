/**
 * AI Opening Search
 *
 * Features 2 & 3 from Phase 1:
 * - Search by opening name → AI generates complete explanation dynamically
 * - Search by moves → Backend identifies opening + generates explanation
 *
 * No hardcoded openings. Every explanation is LLM-generated via the existing
 * OpenRouter integration.
 *
 * Reuses render helpers from learningView.js for consistent UI.
 */

import { apiFetch } from './utils.js';
import { renderBadges, renderStatus, setHtml } from './learningView.js';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────

let lastResult = null;
let suggestionTimeout = null;

// ──────────────────────────────────────────────
// Render
// ──────────────────────────────────────────────

export function renderOpeningSearch() {
  return `
    <div class="learning-tool-shell">
      <div class="ai-search-tabs">
        <button class="ai-search-tab active" data-search-tab="name">🔍 Search by Name</button>
        <button class="ai-search-tab" data-search-tab="moves">♟ Search by Moves</button>
      </div>


      <div id="aiSearchByName" class="ai-search-panel">
        <div class="ai-search-input-row">
          <div class="ai-search-input-wrapper" style="flex:1;position:relative;">
            <input
              id="aiSearchNameInput"
              class="learning-control-input"
              type="text"
              placeholder="Search opening name, ECO code, variation..."
              autocomplete="off"
            />
            <div id="aiSearchSuggestions" class="ai-search-suggestions" style="display:none;"></div>
          <button id="aiSearchNameBtn" class="ai-search-btn">Search</button>
        </div>
        <div class="ai-search-examples">
          <span>Try:</span>
          <button class="ai-search-example" data-name="Italian Game">Italian Game</button>
          <button class="ai-search-example" data-name="London System">London System</button>
          <button class="ai-search-example" data-name="C50">C50</button>
          <button class="ai-search-example" data-name="Najdorf">Najdorf</button>
          <button class="ai-search-example" data-name="Sicilian Defense">Sicilian</button>
        </div>
      </div>

      <div id="aiSearchByMoves" class="ai-search-panel" style="display:none;">
        <div class="ai-search-input-row">
          <input
            id="aiSearchMovesInput"
            class="learning-control-input"
            type="text"
            placeholder="e.g. e4 e5 Nf3 Nc6 Bb5  or  d4 Nf6 c4 g6"
          />
          <button id="aiSearchMovesBtn" class="ai-search-btn">Identify</button>
        </div>
        <div class="ai-search-examples">
          <span>Try:</span>
          <button class="ai-search-moves-example" data-moves="e4 e5 Nf3 Nc6 Bb5">Ruy Lopez</button>
          <button class="ai-search-moves-example" data-moves="e4 c5">Sicilian</button>
          <button class="ai-search-moves-example" data-moves="d4 Nf6 c4 g6 Bg7">KID</button>
          <button class="ai-search-moves-example" data-moves="e4 e6 d4 d5">French</button>
          <button class="ai-search-moves-example" data-moves="d4 d5 c4 e6">QGD</button>
        </div>
        <p style="color:#888;font-size:12px;margin-top:4px;">
          Enter move sequences to automatically detect the opening, variation, and ECO code.
        </p>
      </div>

      <div id="aiSearchResults" class="ai-search-results">
        ${renderStatus('Enter an opening name, ECO code, or moves above to get AI-powered analysis.')}
      </div>
  `;
}

export function initOpeningSearch() {
  // Tab switching
  document.querySelectorAll('.ai-search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ai-search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const isName = tab.dataset.searchTab === 'name';
      const namePanel = document.getElementById('aiSearchByName');
      const movesPanel = document.getElementById('aiSearchByMoves');
      if (namePanel) namePanel.style.display = isName ? 'block' : 'none';
      if (movesPanel) movesPanel.style.display = isName ? 'none' : 'block';
    });
  });

  // Search by name
  document.getElementById('aiSearchNameBtn')?.addEventListener('click', searchByName);
  document.getElementById('aiSearchNameInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchByName();
    } else if (e.key === 'Escape') {
      hideSuggestions();
    } else {
      const input = e.target;
      const val = input.value.trim();
      if (val.length >= 2) {
        showSuggestions(val);
      } else {
        hideSuggestions();
      }
    }
  });

  // Search by moves
  document.getElementById('aiSearchMovesBtn')?.addEventListener('click', searchByMoves);
  document.getElementById('aiSearchMovesInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchByMoves();
  });

  // Example buttons (name)
  document.querySelectorAll('.ai-search-example').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const input = document.getElementById('aiSearchNameInput');
      if (input && name) {
        input.value = name;
        searchByName();
      }
    });
  });

  // Example buttons (moves)
  document.querySelectorAll('.ai-search-moves-example').forEach(btn => {
    btn.addEventListener('click', () => {
      const moves = btn.dataset.moves;
      const input = document.getElementById('aiSearchMovesInput');
      if (input && moves) {
        input.value = moves;
        searchByMoves();
      }
    });
  });
}

// ──────────────────────────────────────────────
// Search Logic
// ──────────────────────────────────────────────

async function searchByName() {
  const input = document.getElementById('aiSearchNameInput');
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  hideSuggestions();
  setHtml('aiSearchResults', renderStatus(`🔍 Analyzing "${name}"...`));

  try {
    const response = await apiFetch('/api/ai/search/opening', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    lastResult = response?.data || null;
    renderSearchResult(lastResult, name);
  } catch (error) {
    setHtml('aiSearchResults', renderStatus(`Error: ${error.message}. Please try again.`));
  }
}

async function searchByMoves() {
  const input = document.getElementById('aiSearchMovesInput');
  if (!input) return;

  const moves = input.value.trim();
  if (!moves) return;

  setHtml('aiSearchResults', renderStatus(`♟ Identifying opening from moves: ${moves}...`));

  try {
    const response = await apiFetch('/api/ai/identify-opening', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moves })
    });

    lastResult = response?.data || null;
    renderMovesSearchResult(lastResult, moves);
  } catch (error) {
    setHtml('aiSearchResults', renderStatus(`Error: ${error.message}. Please try again.`));
  }
}

// ──────────────────────────────────────────────
// Result Rendering (Name Search)
// ──────────────────────────────────────────────

function renderSearchResult(data, openingName) {
  if (!data) {
    setHtml('aiSearchResults', renderStatus('No analysis available. Please try again.'));
    return;
  }

  const eco = data.eco || '';
  const mainMoves = data.mainMoves || '';
  const mainIdea = data.mainIdea || '';
  const plans = data.plans || data.commonPlans || [];
  const typicalContinuation = data.typicalContinuation || '';
  const advantages = data.advantages || [];
  const disadvantages = data.disadvantages || [];
  const commonMistakes = data.commonMistakes || [];

  let html = `<div class="ai-search-analysis">`;

  html += `<div class="ai-search-header">
    <h3>♟ ${data.openingName || openingName}</h3>
    <span class="learning-detail-label">ECO: ${eco || 'N/A'}</span>
  </div>`;

  if (mainMoves) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Main Moves</span>
      <p style="font-family:'Courier New',monospace;font-size:13px;">${mainMoves}</p>
    </div>`;
  }

  if (mainIdea) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Main Idea</span>
      <p>${mainIdea}</p>
    </div>`;
  }

  if (plans.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Plans</span>
      <ul>${plans.map(p => `<li>${p}</li>`).join('')}</ul>
    </div>`;
  }

  if (typicalContinuation) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Typical Continuation</span>
      <p style="font-family:'Courier New',monospace;font-size:13px;">${typicalContinuation}</p>
    </div>`;
  }

  if (advantages.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label" style="color:#4ade80;">Advantages</span>
      <ul>${advantages.map(a => `<li>${a}</li>`).join('')}</ul>
    </div>`;
  }

  if (disadvantages.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label" style="color:#f87171;">Disadvantages</span>
      <ul>${disadvantages.map(d => `<li>${d}</li>`).join('')}</ul>
    </div>`;
  }

  if (commonMistakes.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Common Mistakes</span>
      <ul>${commonMistakes.map(m => `<li>${m}</li>`).join('')}</ul>
    </div>`;
  }

  html += `</div>`;
  setHtml('aiSearchResults', html);
}

// ──────────────────────────────────────────────
// Autocomplete Suggestions (from LLM)
// ──────────────────────────────────────────────

function showSuggestions(query) {
  const container = document.getElementById('aiSearchSuggestions');
  if (!container) return;

  if (suggestionTimeout) clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(async () => {
    try {
      const response = await apiFetch('/api/ai/search/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query })
      });

      const data = response?.data;
      if (!data || !data.openingName) {
        container.style.display = 'none';
        return;
      }

      container.innerHTML = `<div class="ai-search-suggestion-item" data-name="${data.openingName}">
        <span class="ai-search-suggestion-name">${highlightMatch(data.openingName, query)}</span>
        <span class="ai-search-suggestion-eco">${data.eco || ''}</span>
      </div>`;

      container.style.display = 'block';

      container.querySelector('.ai-search-suggestion-item')?.addEventListener('click', () => {
        const input = document.getElementById('aiSearchNameInput');
        if (input) {
          input.value = data.openingName;
          hideSuggestions();
          searchByName();
        }
      });
    } catch {
      container.style.display = 'none';
    }
  }, 300);
}

function hideSuggestions() {
  const container = document.getElementById('aiSearchSuggestions');
  if (container) {
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

function highlightMatch(text, query) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + '<strong>' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
}

// ──────────────────────────────────────────────
// Result Rendering (Moves Search)
// ──────────────────────────────────────────────

function renderMovesSearchResult(data, movesStr) {
  if (!data) {
    setHtml('aiSearchResults', renderStatus('Could not identify the opening. Please check the moves and try again.'));
    return;
  }

  const identifiedOpening = data.identifiedOpening || 'Unknown Opening';
  const eco = data.eco || '';
  const displayName = identifiedOpening + (eco ? ` (${eco})` : '');
  const mainIdea = data.mainIdea || '';
  const plans = data.commonPlans || data.plans || [];
  const advantages = data.advantages || [];
  const disadvantages = data.disadvantages || [];
  const commonMistakes = data.commonMistakes || [];

  let html = `<div class="ai-search-analysis">`;

  html += `<div class="ai-search-header">
    <h3>♟ ${displayName}</h3>
    <p class="ai-search-moves-display">Moves: ${movesStr}</p>
  </div>`;

  if (mainIdea) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Main Idea</span>
      <p>${mainIdea}</p>
    </div>`;
  }

  if (plans.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Plans</span>
      <ul>${plans.map(p => `<li>${p}</li>`).join('')}</ul>
    </div>`;
  }

  if (advantages.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label" style="color:#4ade80;">Advantages</span>
      <ul>${advantages.map(a => `<li>${a}</li>`).join('')}</ul>
    </div>`;
  }

  if (disadvantages.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label" style="color:#f87171;">Disadvantages</span>
      <ul>${disadvantages.map(d => `<li>${d}</li>`).join('')}</ul>
    </div>`;
  }

  if (commonMistakes.length > 0) {
    html += `<div class="ai-search-section">
      <span class="learning-detail-label">Common Mistakes</span>
      <ul>${commonMistakes.map(m => `<li>${m}</li>`).join('')}</ul>
    </div>`;
  }

  html += `</div>`;
  setHtml('aiSearchResults', html);
}
