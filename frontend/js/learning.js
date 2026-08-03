/**
 * Queen Chess - Learning Page Module
 * Comprehensive chess education covering basics, openings, tactics, endgames, and AI coach tips.
 */

import { renderAICoach, initAICoach } from './aiCoach.js';
import { renderEndgameExplorer, initEndgameExplorer } from './endgameExplorer.js';
import { renderOpeningExplorer, initOpeningExplorer } from './openingExplorer.js';
import { renderTacticsExplorer, initTacticsExplorer } from './tacticsExplorer.js';

// ──────────────────────────────────────────────
// RENDER HELPERS
// ──────────────────────────────────────────────

/**
 * Renders a mini chess board grid using the project's piece images.
 * @param {string} boardId - Unique ID for the board container
 * @param {Array<Array<string|null>>} position - 8x8 grid of piece codes (e.g., 'wP', 'bK') or null
 * @param {string} [size='180px'] - CSS size for the board
 * @param {string} [flipped='false'] - Whether board is flipped (black at bottom)
 * @returns {string} HTML string
 */
function renderMiniBoard(boardId, position, size = '180px', flipped = 'false') {
  const rankLabels = flipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  let rows = '';
  rankLabels.forEach((rank, ri) => {
    const rowIndex = flipped ? 7 - ri : ri;
    let cells = '';
    for (let fi = 0; fi < 8; fi++) {
      const isLight = (ri + fi) % 2 === 0;
      const piece = position[rowIndex] ? position[rowIndex][fi] : null;
      const pieceHtml = piece
        ? `<img src="img/chesspieces/wikipedia/${piece}.png" alt="${piece}" style="width:100%;height:100%;object-fit:contain;" draggable="false">`
        : '';
      cells += `<div class="learning-board-cell ${isLight ? 'light' : 'dark'}">${pieceHtml}</div>`;
    }
    rows += `<div class="learning-board-row">${cells}</div>`;
  });

  return `
    <div class="learning-mini-board-wrapper" style="width:${size};height:${size};">
      <div class="learning-mini-board" id="${boardId}">${rows}</div>
    </div>
  `;
}

/**
 * Creates a collapsible accordion section with smooth animation.
 * @param {string} id - Unique section ID
 * @param {string} title - Section title
 * @param {string} contentHtml - Inner HTML content
 * @param {string} [icon='📚'] - Emoji/icon for the header
 * @param {boolean} [openByDefault=false] - Whether section starts expanded
 * @returns {string} HTML string
 */
function renderCollapsible(id , title, contentHtml, icon = '📚', openByDefault = false) {
  const isOpen = openByDefault ? 'open' : '';
  const bodyStyle = openByDefault ? 'max-height:20000px;' : '';
  return `
    <div class="learning-collapsible ${isOpen}" id="collapsible-${id}">
      <div class="learning-collapsible-header" onclick="toggleLearningSection('${id}')">
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

/**
 * Renders a topic card used across basics, tactics, endgames.
 */
function renderTopicCard(icon, title, description, extra = '') {
  return `
    <div class="learning-topic-card learning-hover-scale">
      <div class="learning-topic-icon">${icon}</div>
      <div class="learning-topic-content">
        <h4 class="learning-topic-title">${title}</h4>
        <p class="learning-topic-desc">${description}</p>
        ${extra}
      </div>
    </div>
  `;
}

/**
 * Renders a difficulty badge.
 */
function renderDifficultyBadge(level) {
  const colors = { Beginner: '#9ca3af', Intermediate: '#4ade80', Advanced: '#60a5fa', Expert: '#c084fc' };
  const color = colors[level] || '#9ca3af';
  return `<span class="learning-difficulty-badge" style="background:${color}15;color:${color};border-color:${color}30;">${level}</span>`;
}

// ──────────────────────────────────────────────
// CHESS BASICS
// ──────────────────────────────────────────────

function renderChessBasics() {
  const pieces = [
    { icon: '♔', name: 'King', move: 'Moves one square in any direction (horizontally, vertically, or diagonally). The most important piece — if your king is checkmated, you lose.' },
    { icon: '♕', name: 'Queen', move: 'Moves any number of squares in any direction (horizontally, vertically, or diagonally). The most powerful piece on the board.' },
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
    { icon: '🎯', title: 'Check', desc: 'When your king is under attack by an opponent\'s piece. You must respond immediately by moving the king, blocking the attack, or capturing the attacking piece.' },
    { icon: '💀', title: 'Checkmate', desc: 'When your king is in check and there is no legal move to escape. This ends the game — the player delivering checkmate wins.' },
    { icon: '🤝', title: 'Stalemate', desc: 'When the player to move has no legal moves but their king is NOT in check. The game ends in a draw. A common lifesaver for losing positions.' },
    { icon: '🏰', title: 'Castling', desc: 'A special move involving the king and a rook. The king moves two squares toward the rook, and the rook jumps over to the square next to the king. Can only be done if neither piece has moved, no pieces between them, and the king is not in check.' },
    { icon: '🔄', title: 'En Passant', desc: 'A special pawn capture. When an opponent\'s pawn moves two squares from its starting position and lands beside your pawn, you may capture it as if it had moved only one square. This must be done immediately on the next move.' },
    { icon: '⬆', title: 'Pawn Promotion', desc: 'When a pawn reaches the opposite side of the board (the 8th rank for white, 1st for black), it must be promoted to a queen, rook, bishop, or knight. Promoting to a queen (queening) is most common.' }
  ];

  const rulesHtml = rules.map(r => renderTopicCard(r.icon, r.title, r.desc)).join('');

  // Board coordinates visual using existing piece images
  const emptyBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  // Place a few pieces for visual interest on the coordinates board
  emptyBoard[0][0] = 'bR'; emptyBoard[0][4] = 'bK'; emptyBoard[0][7] = 'bR';
  emptyBoard[7][0] = 'wR'; emptyBoard[7][4] = 'wK'; emptyBoard[7][7] = 'wR';
  emptyBoard[0][3] = 'bQ'; emptyBoard[7][3] = 'wQ';

  return `
    <div class="learning-section-content">
      <div class="learning-intro-text">
        <p>Chess is played on an 8×8 board with 64 squares. The board is oriented so a <strong>light square</strong> is on each player's right-hand corner. Files (columns) are labeled <strong>a–h</strong>, ranks (rows) are labeled <strong>1–8</strong>. White starts on ranks 1–2, Black on ranks 7–8.</p>
      </div>

      <h4 class="learning-subsection-title">♟ Piece Movements</h4>
      <div class="learning-pieces-grid">
        ${piecesHtml}
      </div>

      <h4 class="learning-subsection-title" style="margin-top:24px;">📖 Essential Rules</h4>
      <div class="learning-rules-grid">
        ${rulesHtml}
      </div>

      <div class="learning-coordinates-demo">
        <h4>♜ Board Coordinates</h4>
        <p style="color:#aaa;font-size:13px;margin-bottom:12px;">Files (a–h) go left to right from White's perspective. Ranks (1–8) go from White's side to Black's side. Every square has a unique coordinate, e.g., <strong>e4</strong>, <strong>d5</strong>, <strong>g1</strong>.</p>
        ${renderMiniBoard('boardCoords', emptyBoard, '240px')}
        <p style="color:#888;font-size:12px;margin-top:8px;">Highlighted squares: White pieces on rank 1–2, Black pieces on rank 7–8</p>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// MAIN LEARNING PAGE
// ──────────────────────────────────────────────

const LEARNING_SECTIONS = [
  { id: 'basics', title: 'Chess Basics', icon: '♟', renderFn: renderChessBasics, openByDefault: true },
  { id: 'openings', title: 'Opening Explorer', icon: '📖', renderFn: renderOpeningExplorer, initFn: initOpeningExplorer, openByDefault: false },
  { id: 'tactics', title: 'Tactics Trainer', icon: '⚡', renderFn: renderTacticsExplorer, initFn: initTacticsExplorer, openByDefault: false },
  { id: 'endgame', title: 'Endgame Lab', icon: '🏁', renderFn: renderEndgameExplorer, initFn: initEndgameExplorer, openByDefault: false },
  { id: 'coach', title: 'Personal AI Coach', icon: '🤖', renderFn: renderAICoach, initFn: initAICoach, openByDefault: false }
];

/**
 * Main entry point — renders the complete Learning page.
 */
export function loadLearning() {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  const sectionsHtml = LEARNING_SECTIONS.map(sec =>
    renderCollapsible(sec.id, sec.title, sec.renderFn(), sec.icon, sec.openByDefault)
  ).join('');

  contentEl.innerHTML = `
    <div class="learning-page">
      <div class="learning-hero">
        <div class="learning-hero-content">
          <h1>📚 Learn Chess</h1>
          <p>Master chess from the fundamentals to advanced strategies with Queen Chess. Everything you need to improve your game — curated and explained clearly.</p>
        </div>
        <div class="learning-hero-stats">
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value">5</span>
            <span class="learning-hero-stat-label">Sections</span>
          </div>
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value">20+</span>
            <span class="learning-hero-stat-label">Topics</span>
          </div>
          <div class="learning-hero-stat">
            <span class="learning-hero-stat-value">AI</span>
            <span class="learning-hero-stat-label">Powered</span>
          </div>
        </div>
      </div>
      <div class="learning-sections-container">
        ${sectionsHtml}
      </div>
    </div>
  `;

  LEARNING_SECTIONS.forEach((section) => {
    if (section.openByDefault) initLearningSection(section.id);
  });
}

function initLearningSection(id) {
  const section = LEARNING_SECTIONS.find((item) => item.id === id);
  if (!section || !section.initFn || section.initialized) return;
  section.initFn();
  section.initialized = true;
}

// ──────────────────────────────────────────────
// GLOBAL TOGGLE (called from onclick)
// ──────────────────────────────────────────────

/**
 * Toggles a collapsible section open/closed with smooth animation.
 * Exposed globally for inline onclick handlers.
 */
window.toggleLearningSection = function (id) {
  const wrapper = document.getElementById(`collapsible-${id}`);
  const body = document.getElementById(`collapseBody-${id}`);
  if (!wrapper || !body) return;

  const isOpen = wrapper.classList.contains('open');

  if (isOpen) {
    // Close
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => {
      body.style.maxHeight = '0px';
    });
    wrapper.classList.remove('open');
  } else {
    // Open
    body.style.maxHeight = body.scrollHeight + 'px';
    wrapper.classList.add('open');
    initLearningSection(id);
    body.style.maxHeight = body.scrollHeight + 'px';
    // After transition, set to auto so content can grow if needed
    body.addEventListener('transitionend', function handler() {
      body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', handler);
    }, { once: true });
  }
};

