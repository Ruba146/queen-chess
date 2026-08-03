/**
 * Escape HTML special characters for safe insertion into data-content attributes.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

export function renderSelect(id, options, selected) {
  return `
    <select id="${id}" class="learning-control-select">
      ${options.map((option) => `<option value="${option.value}" ${option.value === selected ? 'selected' : ''}>${option.label}</option>`).join('')}
    </select>
  `;
}

export function renderStatus(text) {
  return `<div class="learning-dynamic-status">${text}</div>`;
}

export function renderBoardPanel(id) {
  return `<div class="learning-board-panel"><div id="${id}" class="learning-live-board"></div></div>`;
}

export function renderMoveList(moves, activeIndex) {
  return `
    <div class="learning-move-strip">
      ${moves.map((move, index) => `<span class="learning-move-pill ${index === activeIndex ? 'active' : ''}">${index + 1}. ${move}</span>`).join('')}
    </div>
  `;
}

export function renderBadges(items) {
  return items.map((item) => `<span class="learning-data-badge">${item}</span>`).join('');
}

/**
 * Renders a structured AI explanation from the backend API response.
 * Supports 'opening', 'tactic', and 'endgame' types.
 * Each type has explanation, beginner, intermediate, advanced sections.
 * For endgames, also renders Position, Objective, Winning Method, Key Ideas.
 * Stores per-level content in data-content attributes for tab switching.
 */
export function renderAIExplanation(data, type = 'opening') {
  if (!data) return renderStatus('No analysis available.');

  const explanation = data.explanation || 'Analyzing position...';
  const beginner = data.beginnerExplanation || data.explanation || '';
  const intermediate = data.intermediateExplanation || '';
  const advanced = data.advancedExplanation || '';
  const mainIdea = data.mainIdea || '';
  const strategic = data.strategicConcepts || [];
  const tactical = data.tacticalThemes || [];
  const mistakes = data.commonMistakes || [];
  const advice = data.practicalAdvice || '';
  const training = data.trainingRecommendations || [];

  let html = `<div class="ai-explanation-panel">`;

  // Main explanation
  html += `<div class="ai-explanation-main">${explanation}</div>`;

  // Level tabs with content stored in data-content for dynamic switching
  html += `
    <div class="ai-level-tabs">
      <button class="ai-level-tab active" data-level="beginner" data-content="${escapeHtml(beginner)}">🌱 Beginner</button>
      <button class="ai-level-tab" data-level="intermediate" data-content="${escapeHtml(intermediate)}">📈 Intermediate</button>
      <button class="ai-level-tab" data-level="advanced" data-content="${escapeHtml(advanced)}">🎯 Advanced</button>
    </div>
    <div class="ai-level-content" id="aiLevelContent">
      <p>${beginner}</p>
    </div>
  `;

  // Endgame-specific fields
  if (type === 'endgame') {
    // Position
    if (data.position) {
      html += `<div class="ai-explanation-section"><span class="learning-detail-label">📋 Position</span><p>${data.position}</p></div>`;
    }
    // Objective
    if (data.objective) {
      html += `<div class="ai-explanation-section"><span class="learning-detail-label">🎯 Objective</span><p>${data.objective}</p></div>`;
    }
    // Winning Method
    if (data.winningMethod) {
      html += `<div class="ai-explanation-section"><span class="learning-detail-label">🏆 Winning Method</span><p>${data.winningMethod}</p></div>`;
    }
    // Key Ideas
    if (data.keyIdeas && data.keyIdeas.length > 0) {
      html += `<div class="ai-explanation-section"><span class="learning-detail-label">💡 Key Ideas</span><ul>${data.keyIdeas.map(k => `<li>${k}</li>`).join('')}</ul></div>`;
    }
  }

  // Main Idea
  if (mainIdea) {
    html += `<div class="ai-explanation-section"><span class="learning-detail-label">🎯 Main Idea</span><p>${mainIdea}</p></div>`;
  }

  // Strategic Concepts
  if (strategic.length > 0) {
    html += `<div class="ai-explanation-section"><span class="learning-detail-label">🧠 Strategic Concepts</span><ul>${strategic.map(s => `<li>${s}</li>`).join('')}</ul></div>`;
  }

  // Tactical Themes
  if (tactical.length > 0) {
    html += `<div class="ai-explanation-section"><span class="learning-detail-label">⚡ Tactical Themes</span><ul>${tactical.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
  }

  // Common Mistakes
  if (mistakes.length > 0) {
    html += `<div class="ai-explanation-section"><span class="learning-detail-label">⚠️ Common Mistakes</span><ul>${mistakes.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
  }

  // Practical Advice (tip box)
  if (advice) {
    html += `<div class="learning-tip-box" style="margin-top:12px;"><span class="learning-detail-label" style="color:#fbbf24;">💡 Practical Advice</span><p style="color:#ddd;font-style:italic;">${advice}</p></div>`;
  }

  // Training Recommendations
  if (training.length > 0) {
    html += `<div class="ai-explanation-section" style="margin-top:12px;"><span class="learning-detail-label">📚 Training Recommendations</span><ul>${training.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
  }

  html += `</div>`;

  return html;
}

export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// Initialize dynamic level tab switching after DOM update
// Handles level tabs rendered by renderAIExplanation() in opening/tactic/endgame panels.
// Uses the dataset attributes on each tab to find the right content; the main section
// stores the level text in the initially-rendered .ai-level-content p element.
document.addEventListener('click', function (event) {
  const tab = event.target.closest('.ai-level-tab');
  if (!tab) return;

  const parent = tab.closest('.ai-explanation-panel');
  if (!parent) return;

  parent.querySelectorAll('.ai-level-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  const level = tab.dataset.level;
  const content = parent.querySelector('#aiLevelContent');
  if (!content) return;

  // Find the stored explanation text from the panel's stored data
  // The renderAIExplanation() function in learningView.js embeds the per-level
  // explanations as data attributes on the level tab buttons during render.
  // If not found via data attributes, derive from the content structure.
  const levelTab = parent.querySelector(`.ai-level-tab[data-level="${level}"]`);
  if (levelTab && levelTab.dataset.content) {
    content.innerHTML = `<p>${levelTab.dataset.content}</p>`;
    return;
  }

  // Fallback: the content was rendered inline in the level tabs section
  // We need to find the content from the rendered DOM.
  // The renderAIExplanation stores beginner/intermediate/advanced text in the
  // hidden fields within the panel — we use the level content panels.
  const explanationSections = parent.querySelectorAll('.ai-explanation-section');
  let text = '';

  // The level content is not stored as hidden sections; it's rendered inline.
  // Since we can't easily re-extract, use a simple approach:
  // The initial active tab shows beginner content; for others check the original data.
  // Instead, we store content in data-content during render.
  // Since we didn't, we derive from what's visible.
  if (level === 'beginner') {
    // Keep the existing content (it's already the beginner text)
    return;
  }

  // For intermediate/advanced, the text should be available via the parent's
  // stored data. Since learningView.renderAIExplanation() renders inline,
  // we store the content in a data attribute on the tabs during future renders.
  // For now, let the opening/tactic/endgame modules handle it via their own
  // level tab bindings (bindLevelTabs in aiOpeningSearch.js, etc.)
  // Do nothing - the individual explorer modules have their own level tab logic.
});
