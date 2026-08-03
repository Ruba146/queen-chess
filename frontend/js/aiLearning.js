/**
 * Queen Chess - AI Learning Page
 * New interactive learning experience with dashboard-style navigation cards
 * and a single dynamic content area for one module at a time.
 *
 * PHASE 3: Extended with Daily Training, Puzzle Trainer, Quiz, Game Review, Learning Path.
 */

import { renderOpeningExplorer, initOpeningExplorer } from './openingExplorer.js';
import { renderEndgameExplorer, initEndgameExplorer } from './endgameExplorer.js';
import { renderAICoach, initAICoach } from './aiCoach.js';
import { renderAIChat, initAIChat } from './aiChat.js';
import { renderOpeningSearch, initOpeningSearch } from './aiOpeningSearch.js';

// ── PHASE 3 IMPORTS (Learning-focused only) ──
import { renderDailyTraining, initDailyTraining } from './dailyTraining.js';
import { renderGameReview, initGameReview } from './gameReview.js';
import { renderLearningPath, initLearningPath } from './learningPath.js';

const SECTIONS = [
  // ── PHASE 1 — EXISTING MODULES ──
  {
    id: 'chat',
    icon: '💬',
    title: 'AI Chess Coach',
    desc: 'Ask natural language chess questions and get expert coaching.',
    renderFn: renderAIChat,
    initFn: initAIChat
  },
  {
    id: 'opening-search',
    icon: '🔍',
    title: 'Opening Search',
    desc: 'Search any opening by name or moves for a complete AI analysis.',
    renderFn: renderOpeningSearch,
    initFn: initOpeningSearch
  },
  {
    id: 'openings',
    icon: '♟',
    title: 'Opening Explorer',
    desc: 'Study chess openings with engine analysis and master-level explanations.',
    renderFn: renderOpeningExplorer,
    initFn: initOpeningExplorer
  },
  {
    id: 'endgame',
    icon: '🏁',
    title: 'Endgame Lab',
    desc: 'Master endgame techniques with interactive practice positions.',
    renderFn: renderEndgameExplorer,
    initFn: initEndgameExplorer
  },
  {
    id: 'coach',
    icon: '🤖',
    title: 'Personal AI Coach',
    desc: 'Get personalized learning recommendations based on your play.',
    renderFn: renderAICoach,
    initFn: initAICoach
  },

  // ── PHASE 3 — NEW MODULES ──
  {
    id: 'daily-training',
    icon: '📅',
    title: 'Daily Training',
    desc: 'Personalized daily training based on your performance and weaknesses.',
    renderFn: renderDailyTraining,
    initFn: initDailyTraining
  },
  {
    id: 'learning-path',
    icon: '🎯',
    title: 'Learning Path',
    desc: 'Adaptive learning path with daily, weekly, and monthly goals.',
    renderFn: renderLearningPath,
    initFn: initLearningPath
  }
];

let activeSection = null;
let initialized = {};

/**
 * Renders the full AI Learning page into #content.
 * Called by the learning router when the AI Learning tab is active.
 */
export function loadAILearning() {
  const tabContent = document.getElementById('learningTabContent');
  if (!tabContent) return;

  const cardsHtml = SECTIONS.map((s, i) => `
    <div class="ai-card ${activeSection === s.id ? 'active' : ''}" data-section="${s.id}" style="animation-delay:${i * 70}ms">
      <div class="ai-card-icon">${s.icon}</div>
      <div class="ai-card-body">
        <div class="ai-card-title">${s.title}</div>
        <div class="ai-card-desc">${s.desc}</div>
      </div>
    </div>
  `).join('');

  const placeholder = !activeSection
    ? '<div class="ai-placeholder"><span class="ai-placeholder-icon">🎯</span><p>Select a module above to begin learning.</p></div>'
    : '';

  const dynamicHtml = activeSection
    ? SECTIONS.find((s) => s.id === activeSection)?.renderFn() || ''
    : '';

  tabContent.innerHTML = `
    <div class="ai-learning-page">
      <div class="ai-hero">
        <div class="ai-hero-glow"></div>
        <div class="ai-hero-content">
          <span class="ai-hero-badge"><span class="ai-hero-badge-dot"></span> Adaptive AI Studio</span>
          <h1>Your Personal <span class="ai-hero-accent">Chess Academy</span></h1>
          <p>Pick a module and let the AI coach guide you through openings, tactics, endgames and personalized training — all in one place.</p>
        </div>
      </div>
      <div class="ai-cards-grid">
        ${cardsHtml}
      </div>
      <div class="ai-dynamic-content" id="aiDynamicContent">
        ${placeholder}
        ${dynamicHtml}
      </div>
    </div>
  `;

  // Bind card click handlers
  document.querySelectorAll('.ai-card').forEach((card) => {
    card.addEventListener('click', () => {
      const sectionId = card.dataset.section;
      switchSection(sectionId);
    });
  });

  // Init the currently active section (if any)
  if (activeSection) {
    const section = SECTIONS.find((s) => s.id === activeSection);
    if (section && section.initFn && !initialized[section.id]) {
      section.initFn();
      initialized[section.id] = true;
    }
  }
}

/**
 * Switches the dynamic content area to show the selected section.
 * Uses a smooth fade transition.
 */
function switchSection(sectionId) {
  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return;

  // Update card active states
  document.querySelectorAll('.ai-card').forEach((c) => c.classList.remove('active'));
  document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

  activeSection = sectionId;

  const dynamicContent = document.getElementById('aiDynamicContent');
  if (!dynamicContent) return;

  // Fade out animation
  dynamicContent.classList.add('ai-fade-out');

  setTimeout(() => {
    // Replace content
    dynamicContent.innerHTML = section.renderFn();
    dynamicContent.classList.remove('ai-fade-out');
    dynamicContent.classList.add('ai-fade-in');

    // Initialize if not already done
    if (section.initFn && !initialized[section.id]) {
      section.initFn();
      initialized[section.id] = true;
    }

    // Remove animation class after transition
    setTimeout(() => {
      dynamicContent.classList.remove('ai-fade-in');
    }, 350);
  }, 200);
}
