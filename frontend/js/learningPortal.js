/**
 * Queen Chess - Learning Portal
 * Tab-based router between Classic Learning (static cards, original design)
 * and AI Learning (modern interactive platform).
 *
 * Classic Learning preserves the exact card layout from the original:
 * - Opening cards with icon, title, badges, sections, tip boxes
 * - Tactics cards with icon, title, badges, description, details
 * - Endgame cards with mini board, title, description, principles
 * - Coach cards with icon, title, tips
 *
 * Only the content is static — no Stockfish, no interactive boards, no dynamic analysis.
 * AI Learning has all the interactive features.
 */

import { loadAILearning } from './aiLearning.js';

/**
 * Classic Learning uses intentionally static educational content
 * for Chess Basics (pieces, rules). For interactive AI-powered
 * opening, tactic, endgame, and coach tools, switch to the
 * AI Learning tab.
 */
const AI_LEARNING_REDIRECT_MSG = 'Switch to the <strong>🤖 AI Learning</strong> tab above for interactive, AI-powered opening analysis, tactic training, endgame practice, and personalized coaching.';

// ──────────────────────────────────────────────
// MAIN PORTAL ENTRY
// ──────────────────────────────────────────────

export function loadLearningPortal() {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div class="learning-page">
      <div class="learning-tab-bar">
        <button class="learning-tab active" data-tab="classic">📚 Classic Learning</button>
        <button class="learning-tab" data-tab="ai">🤖 AI Learning</button>
      </div>
      <div id="learningTabContent"></div>
    </div>
  `;

  document.querySelectorAll('.learning-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.learning-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'classic') {
        renderClassicLearning();
      } else {
        loadAILearning();
      }
    });
  });

  renderClassicLearning();
}

// ──────────────────────────────────────────────
// CLASSIC LEARNING — Original Card UI
// ──────────────────────────────────────────────

function renderClassicLearning() {
  const tabContent = document.getElementById('learningTabContent');
  if (!tabContent) return;

tabContent.innerHTML = `
    <div class="learning-hero">
      <div class="learning-hero-glow"></div>
      <div class="learning-hero-glow learning-hero-glow-2"></div>
      <div class="learning-hero-piece learning-hero-queen">♛</div>
      <div class="learning-hero-piece learning-hero-rook">♜</div>
      <div class="learning-hero-content">
        <span class="learning-hero-badge"><span class="learning-hero-badge-dot"></span> AI-Powered Chess Academy</span>
        <h1>Master Chess, <span class="learning-hero-accent">Intelligently.</span></h1>
        <p>Learn from the fundamentals to advanced strategies with a curated, AI-enhanced curriculum. Every lesson is explained clearly and built to help you improve, one move at a time.</p>
        <div class="learning-hero-actions">
          <button class="learning-hero-cta" onclick="document.getElementById('collapsible-basics')?.scrollIntoView({behavior:'smooth',block:'center'})">🚀 Continue Learning</button>
          <button class="learning-hero-cta-secondary" data-jump-ai>🤖 Try AI Learning</button>
        </div>
      </div>
      <div class="learning-hero-stats">
        <div class="learning-hero-stat">
          <span class="learning-hero-stat-value" data-count="5">0</span>
          <span class="learning-hero-stat-label">Sections</span>
        </div>
        <div class="learning-hero-stat">
          <span class="learning-hero-stat-value" data-count="20" data-suffix="+">0</span>
          <span class="learning-hero-stat-label">Topics</span>
        </div>
        <div class="learning-hero-stat">
          <span class="learning-hero-stat-value">AI</span>
          <span class="learning-hero-stat-label">Powered</span>
        </div>
      </div>
    </div>
    <div class="learning-category-block">
      <div class="learning-section-head">
        <span class="learning-eyebrow">Learning Paths</span>
        <h2>Choose your <span class="learning-accent">focus</span></h2>
        <p>Pick a discipline and dive into a structured, AI-guided curriculum.</p>
      </div>
      <div class="learning-category-grid">
        <div class="learning-category-card learning-cat-feature" data-cat="basics">
          <div class="learning-category-glow"></div>
          <div class="learning-category-icon">♟</div>
          <div class="learning-category-title">Chess Basics</div>
          <div class="learning-category-desc">Pieces, rules &amp; the fundamentals of the board.</div>
          <div class="learning-category-meta"><span class="learning-cat-tag">Beginner</span><span class="learning-cat-count">6 lessons</span></div>
          <span class="learning-category-link">Explore →</span>
        </div>
        <div class="learning-category-card" data-cat="openings">
          <div class="learning-category-icon">📖</div>
          <div class="learning-category-title">Openings</div>
          <div class="learning-category-desc">Start strong and seize the initiative early.</div>
          <div class="learning-category-meta"><span class="learning-cat-tag">All levels</span><span class="learning-cat-count">7 openings</span></div>
          <span class="learning-category-link">Explore →</span>
        </div>
        <div class="learning-category-card" data-cat="tactics">
          <div class="learning-category-icon">⚡</div>
          <div class="learning-category-title">Tactics</div>
          <div class="learning-category-desc">Sharpen calculation and spot winning patterns.</div>
          <div class="learning-category-meta"><span class="learning-cat-tag">Intermediate</span><span class="learning-cat-count">12 patterns</span></div>
          <span class="learning-category-link">Explore →</span>
        </div>
        <div class="learning-category-card" data-cat="endgames">
          <div class="learning-category-icon">🏁</div>
          <div class="learning-category-title">Endgames</div>
          <div class="learning-category-desc">Convert advantages and convert precision.</div>
          <div class="learning-category-meta"><span class="learning-cat-tag">Advanced</span><span class="learning-cat-count">8 techniques</span></div>
          <span class="learning-category-link">Explore →</span>
        </div>
        <div class="learning-category-card" data-cat="coach">
          <div class="learning-category-icon">🤖</div>
          <div class="learning-category-title">Coach Tips</div>
          <div class="learning-category-desc">Personalized guidance from your AI assistant.</div>
          <div class="learning-category-meta"><span class="learning-cat-tag">AI</span><span class="learning-cat-count">Always on</span></div>
          <span class="learning-category-link">Explore →</span>
        </div>
      </div>
    </div>
    <div class="learning-sections-container" id="learningSections">
      ${renderCollapsible('basics', 'Chess Basics', '♟', renderChessBasics(), true)}
      ${renderCollapsible('openings', 'Openings', '📖', renderOpeningsStatic(), false)}
      ${renderCollapsible('tactics', 'Tactics', '⚡', renderTacticsStatic(), false)}
      ${renderCollapsible('endgames', 'Endgames', '🏁', renderEndgamesStatic(), false)}
      ${renderCollapsible('coach', 'Coach Tips', '🤖', renderCoachStatic(), false)}
    </div>
  `;

  document.querySelectorAll('.learning-collapsible-header').forEach((header) => {
    const wrapper = header.closest('.learning-collapsible');
    if (wrapper) {
      const id = wrapper.id?.replace('collapsible-', '');
      if (id) header.onclick = () => toggleClassicSection(id);
    }
  });

  // Category cards scroll to the matching section
  document.querySelectorAll('.learning-category-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.cat;
      document.querySelectorAll('.learning-category-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const wrapper = document.getElementById(`collapsible-${id}`);
      if (wrapper) {
        if (!wrapper.classList.contains('open')) {
          const header = wrapper.querySelector('.learning-collapsible-header');
          if (header) header.onclick();
        }
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // Jump to AI Learning tab
  document.querySelectorAll('[data-jump-ai]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const aiTab = document.querySelector('.learning-tab[data-tab="ai"]');
      if (aiTab) aiTab.click();
    });
  });

  animateCountUp();
}

// Count-up animation for hero statistics
function animateCountUp() {
  const els = document.querySelectorAll('.learning-hero-stat-value[data-count]');
  els.forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 900;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ──────────────────────────────────────────────
// CHESS BASICS (same as original)
// ──────────────────────────────────────────────

function renderChessBasics() {
  const pieces = [
    { icon: '♔', name: 'King', move: 'Moves one square in any direction. The most important piece — if your king is checkmated, you lose.' },
    { icon: '♕', name: 'Queen', move: 'Moves any number of squares in any direction. The most powerful piece on the board.' },
    { icon: '♖', name: 'Rook', move: 'Moves any number of squares horizontally or vertically. Powerful on open files and ranks.' },
    { icon: '♗', name: 'Bishop', move: 'Moves any number of squares diagonally. Each bishop stays on its starting color forever.' },
    { icon: '♘', name: 'Knight', move: 'Moves in an L-shape: two squares in one direction, then one square perpendicular. Can jump over other pieces.' },
    { icon: '♙', name: 'Pawn', move: 'Moves one square forward (or two on its first move). Captures diagonally forward. Can promote upon reaching the last rank.' }
  ];

  const piecesHtml = pieces.map(p => `
    <div class="learning-piece-card learning-hover-scale">
      <div class="learning-piece-icon">${p.icon}</div>
      <div class="learning-piece-info">
        <h4>${p.name}</h4>
        <p>${p.move}</p>
      </div>
    </div>
  `).join('');

  const rules = [
    { icon: '🎯', title: 'Check', desc: 'When your king is under attack by an opponent\'s piece. You must respond immediately.' },
    { icon: '💀', title: 'Checkmate', desc: 'When your king is in check and there is no legal move to escape. The game ends.' },
    { icon: '🤝', title: 'Stalemate', desc: 'When the player to move has no legal moves but their king is NOT in check. The game ends in a draw.' },
    { icon: '🏰', title: 'Castling', desc: 'A special move involving the king and a rook. The king moves two squares toward the rook, and the rook jumps over.' },
    { icon: '🔄', title: 'En Passant', desc: 'A special pawn capture. When an opponent\'s pawn moves two squares and lands beside your pawn, you may capture it.' },
    { icon: '⬆', title: 'Pawn Promotion', desc: 'When a pawn reaches the opposite side of the board, it must be promoted to a queen, rook, bishop, or knight.' }
  ];

  const rulesHtml = rules.map(r => `<div class="learning-topic-card learning-hover-scale"><div class="learning-topic-icon">${r.icon}</div><div class="learning-topic-content"><h4 class="learning-topic-title">${r.title}</h4><p class="learning-topic-desc">${r.desc}</p></div></div>`).join('');

  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>Chess is played on an 8×8 board with 64 squares. The board is oriented so a <strong>light square</strong> is on each player's right-hand corner. Files (columns) are labeled <strong>a–h</strong>, ranks (rows) are labeled <strong>1–8</strong>.</p>
      </div>
      <h4 class="learning-subsection-title">♟ Piece Movements</h4>
      <div class="learning-pieces-grid">${piecesHtml}</div>
      <h4 class="learning-subsection-title" style="margin-top:24px;">📖 Essential Rules</h4>
      <div class="learning-rules-grid">${rulesHtml}</div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// OPENINGS — Redirect to AI Learning
// ──────────────────────────────────────────────

function renderOpeningsStatic() {
  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>${AI_LEARNING_REDIRECT_MSG}</p>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// TACTICS — Redirect to AI Learning
// ──────────────────────────────────────────────

function renderTacticsStatic() {
  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>${AI_LEARNING_REDIRECT_MSG}</p>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// ENDGAMES — Redirect to AI Learning
// ──────────────────────────────────────────────

function renderEndgamesStatic() {
  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>${AI_LEARNING_REDIRECT_MSG}</p>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// COACH — Redirect to AI Learning
// ──────────────────────────────────────────────

function renderCoachStatic() {
  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>${AI_LEARNING_REDIRECT_MSG}</p>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// Render Helpers
// ──────────────────────────────────────────────

function renderCollapsible(id, title, icon, contentHtml, openByDefault = false) {
  const isOpen = openByDefault ? 'open' : '';
  const bodyStyle = openByDefault ? 'max-height:20000px;' : '';
  return `
    <div class="learning-collapsible ${isOpen}" id="collapsible-${id}">
      <div class="learning-collapsible-header">
        <span class="learning-collapsible-icon">${icon}</span>
        <span class="learning-collapsible-title">${title}</span>
        <span class="learning-collapsible-arrow">▾</span>
      </div>
      <div class="learning-collapsible-body" id="collapseBody-${id}" style="${bodyStyle}">
        <div class="learning-collapsible-inner">${contentHtml}</div>
      </div>
    </div>
  `;
}

function toggleClassicSection(id) {
  const wrapper = document.getElementById(`collapsible-${id}`);
  const body = document.getElementById(`collapseBody-${id}`);
  if (!wrapper || !body) return;

  const isOpen = wrapper.classList.contains('open');

  if (isOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
    wrapper.classList.remove('open');
  } else {
    wrapper.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    body.addEventListener('transitionend', function handler() {
      body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', handler);
    }, { once: true });
  }
}
