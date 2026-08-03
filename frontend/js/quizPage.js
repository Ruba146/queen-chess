/**
 * Quiz Page — Standalone Interactive Chess Quiz Platform
 *
 * 12 categories of chess puzzles with interactive board, Stockfish validation,
 * AI explanations, and progress tracking.
 *
 * Categories:
 *   Daily Challenge, Opening Quiz, Middlegame Quiz, Endgame Quiz,
 *   Tactical Quiz, Best Move, Defensive Move, Mate in 1/2/3,
 *   Master Games Quiz, Survival Mode
 *
 * Dependencies:
 *   - quizEngine.js for engine lifecycle
 *   - quizPuzzles.js for puzzle data
 *   - learningService.js for Stockfish eval + AI explanations
 *   - learningView.js for render helpers
 *   - apiFetch for backend quiz generation
 */

import { apiFetch } from './utils.js';
import {
  quizState,
  initQuizSession,
  nextPuzzle,
  resetPuzzle,
  giveHint,
  showSolution,
  generateExplanation,
  getSessionResult,
  getQualityLabel,
  getQualityColor
} from './quizEngine.js';
import { renderAIExplanation, renderBadges } from './learningView.js';

// ──────────────────────────────────────────────
// CATEGORY DEFINITIONS
// ──────────────────────────────────────────────

const QUIZ_CATEGORIES = [
  { id: 'daily-challenge', icon: '🌟', label: 'Daily Challenge', desc: 'One featured puzzle refreshed daily.', color: '#fbbf24' },
  { id: 'opening-quiz', icon: '♟', label: 'Opening Quiz', desc: 'Test your opening knowledge with critical early positions.', color: '#60a5fa' },
  { id: 'middlegame-quiz', icon: '⚔️', label: 'Middlegame Quiz', desc: 'Navigate complex middlegame positions.', color: '#a855f7' },
  { id: 'endgame-quiz', icon: '🏁', label: 'Endgame Quiz', desc: 'Master endgame technique and conversion.', color: '#4ade80' },
  { id: 'tactical-quiz', icon: '⚡', label: 'Tactical Quiz', desc: 'Spot tactical patterns and calculate forcing sequences.', color: '#f472b6' },
  { id: 'best-move', icon: '🎯', label: 'Best Move', desc: 'Find the single best move in any position.', color: '#38bdf8' },
  { id: 'defensive-move', icon: '🛡️', label: 'Defensive Move', desc: 'Find the only saving move in critical positions.', color: '#fb923c' },
  { id: 'mate-in-1', icon: '♛', label: 'Mate in 1', desc: 'Deliver checkmate in a single move.', color: '#ef4444' },
  { id: 'mate-in-2', icon: '♛', label: 'Mate in 2', desc: 'Find the two-move checkmate sequence.', color: '#dc2626' },
  { id: 'mate-in-3', icon: '♛', label: 'Mate in 3', desc: 'Calculate the three-move checkmate combination.', color: '#b91c1c' },
  { id: 'master-games', icon: '🏆', label: 'Master Games', desc: 'Find winning moves from real master games.', color: '#c084fc' },
  { id: 'survival-mode', icon: '🔥', label: 'Survival Mode', desc: 'Keep solving puzzles without making a mistake!', color: '#f97316' }
];

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────

let pageState = {
  view: 'categories', // 'categories' | 'setup' | 'playing' | 'result'
  selectedCategory: 'daily-challenge',
  puzzleCount: 5
};

// ──────────────────────────────────────────────
// MAIN ENTRY — Load Quiz Page
// ──────────────────────────────────────────────

export function loadQuiz() {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = renderQuizPage();
  showCategoriesView();
  bindGlobalEvents();
}

// ──────────────────────────────────────────────
// RENDER: Full Quiz Page Shell
// ──────────────────────────────────────────────

function renderQuizPage() {
  return `
    <div class="quiz-page-container">
      <div id="quizViewContainer"></div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// VIEW 1: Categories Grid
// ──────────────────────────────────────────────

function showCategoriesView() {
  pageState.view = 'categories';
  const container = document.getElementById('quizViewContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-hero">
      <div class="quiz-hero-glow"></div>
      <div class="quiz-hero-content">
        <span class="quiz-hero-badge"><span class="quiz-hero-badge-dot"></span> 12 Puzzle Collections</span>
        <h2>Chess <span class="quiz-hero-accent">Quiz Arena</span></h2>
        <p>Test your chess skills with interactive puzzles. Make moves on the board and get instant Stockfish-verified feedback.</p>
      </div>
    </div>
    <div class="quiz-categories-grid">
      ${QUIZ_CATEGORIES.map(cat => `
        <div class="quiz-category-card" data-category="${cat.id}">
          <div class="quiz-category-icon" style="background:${cat.color}18;border-color:${cat.color}44;">
            <span style="font-size:28px;">${cat.icon}</span>
          </div>
          <div class="quiz-category-body">
            <h4>${cat.label}</h4>
            <p>${cat.desc}</p>
            <span class="quiz-category-badge">Start</span>
          </div>
          <div class="quiz-category-arrow">→</div>
        </div>
      `).join('')}
    </div>
  `;

  // Bind category card clicks
  container.querySelectorAll('.quiz-category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.category;
      pageState.selectedCategory = category;
      showSetupView(category);
    });
  });
}

// ──────────────────────────────────────────────
// VIEW 2: Setup (Puzzle Count Selector)
// ──────────────────────────────────────────────

function showSetupView(category) {
  pageState.view = 'setup';
  const catInfo = QUIZ_CATEGORIES.find(c => c.id === category);
  const container = document.getElementById('quizViewContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-back-bar">
      <button class="quiz-back-btn" id="quizBackToCategories">← Back</button>
      <span class="quiz-breadcrumb">Quiz / ${catInfo?.label || category}</span>
    </div>

    <div class="quiz-setup-card quiz-card-elevate">
      <div class="quiz-setup-orb" style="background:${catInfo?.color || '#a855f7'}18;border-color:${catInfo?.color || '#a855f7'}44;">${catInfo?.icon || '🧩'}</div>
      <h2>${catInfo?.label || category}</h2>
      <p class="quiz-setup-desc">${catInfo?.desc || ''}</p>

      <div class="quiz-setup-control">
        <label class="quiz-setup-label">Number of Puzzles</label>
        <div class="quiz-count-options">
          ${[3, 5, 10].map(n => `
            <button class="quiz-count-btn ${n === pageState.puzzleCount ? 'active' : ''}" data-count="${n}">${n}</button>
          `).join('')}
        </div>
      </div>

      <button class="quiz-start-btn" id="quizStartBtn">
        🎯 Start ${catInfo?.label || ''}
      </button>
    </div>
  `;

  // Bind count selector
  container.querySelectorAll('.quiz-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.quiz-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pageState.puzzleCount = parseInt(btn.dataset.count);
    });
  });

  // Back button
  document.getElementById('quizBackToCategories')?.addEventListener('click', showCategoriesView);

  // Start button
  document.getElementById('quizStartBtn')?.addEventListener('click', () => startQuiz(category));
}

// ──────────────────────────────────────────────
// VIEW 3: Playing
// ──────────────────────────────────────────────

async function startQuiz(category) {
  pageState.view = 'playing';

  const catInfo = QUIZ_CATEGORIES.find(c => c.id === category);
  const container = document.getElementById('quizViewContainer');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="quiz-loading">
      <div class="quiz-loading-spinner">♞</div>
      <p>Generating ${catInfo?.label || 'quiz'} puzzles...</p>
      <div class="quiz-loading-bar"><div class="quiz-loading-bar-fill"></div></div>
    </div>
  `;

  try {
    // Fetch puzzles from backend
    const response = await apiFetch('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        count: pageState.puzzleCount
      })
    });

    const puzzles = response.data?.questions || [];
    if (puzzles.length === 0) {
      container.innerHTML = `
        <div class="quiz-loading">
          <p style="color:#dc2626;">No puzzles available for this category. Please try another.</p>
          <button class="quiz-back-btn" onclick="showCategoriesView()" style="margin-top:12px;">← Back</button>
        </div>`;
      return;
    }

    // Render playing UI
    renderPlayingView(container, catInfo, puzzles);

    // Initialize engine
    initQuizSession(puzzles, {
      survivalMode: category === 'survival-mode',
      onCorrect: onMoveCorrect,
      onIncorrect: onMoveIncorrect,
      onFinish: onQuizFinish
    });

  } catch (error) {
    console.error('Start quiz error:', error);
    container.innerHTML = `
      <div class="quiz-loading">
        <p style="color:#dc2626;">Failed to generate quiz. Please try again.</p>
        <button class="quiz-back-btn" onclick="showCategoriesView()" style="margin-top:12px;">← Back</button>
      </div>`;
  }
}

function renderPlayingView(container, catInfo, puzzles) {
  container.innerHTML = `
    <div class="quiz-back-bar">
      <button class="quiz-back-btn" id="quizQuitBtn">← Quit</button>
      <span class="quiz-breadcrumb">Quiz / ${catInfo?.label}</span>
      <span class="quiz-score-display" id="quizScoreBar">0/${puzzles.length}</span>
    </div>

    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" id="quizProgressFill"></div>
    </div>

    <div class="quiz-playing-layout">
      <!-- Left: Board -->
      <div class="quiz-board-section quiz-card-elevate">
        <div class="quiz-board-wrapper">
          <div id="quizBoard" class="quiz-board-inner"></div>
        </div>
        <div class="quiz-board-controls">
          <button class="quiz-control-btn" id="quizHintBtn">💡 Hint</button>
          <button class="quiz-control-btn" id="quizResetBtn">↺ Reset</button>
          <button class="quiz-control-btn" id="quizSolnBtn">👁️ Solution</button>
        </div>
      </div>

      <!-- Right: Info Panel -->
      <div class="quiz-panel-section">
        <!-- Puzzle Header -->
        <div id="quizPuzzleHeader" class="quiz-puzzle-header quiz-question-anim">
          <div class="quiz-badge-row" id="quizBadgeRow"></div>
          <h3 id="quizPuzzleTitle">Puzzle 1/${puzzles.length}</h3>
          <p id="quizPuzzleGoal" class="quiz-puzzle-goal">${puzzles[0]?.goal || 'Find the best move.'}</p>
        </div>

        <!-- Move Strip -->
        <div class="quiz-move-strip" id="quizMoveHistory"></div>

        <!-- Feedback Area -->
        <div id="quizFeedback" class="quiz-feedback-area" style="display:none;"></div>

        <!-- Explanation / Action -->
        <div id="quizExplanationArea" style="display:none;" class="quiz-explanation-area">
          <div class="quiz-section-title">🧠 AI Analysis</div>
          <div id="quizExplanation" class="quiz-explanation-content"></div>
          <button class="quiz-next-btn" id="quizNextBtn">Next Puzzle →</button>
        </div>

        <!-- Survival streak display -->
        <div id="quizSurvivalDisplay" style="display:none;" class="quiz-survival-display">
          🔥 Streak: <span id="quizSurvivalStreak">0</span>
        </div>
      </div>
    </div>
  `;

  // Bind controls
  document.getElementById('quizQuitBtn')?.addEventListener('click', showCategoriesView);
  document.getElementById('quizHintBtn')?.addEventListener('click', onHintClick);
  document.getElementById('quizResetBtn')?.addEventListener('click', onResetClick);
  document.getElementById('quizSolnBtn')?.addEventListener('click', onSolutionClick);
  document.getElementById('quizNextBtn')?.addEventListener('click', onNextClick);

  // Update initial badges
  updatePuzzleHeader(puzzles[0]);

  // Show survival streak if applicable
  if (pageState.selectedCategory === 'survival-mode') {
    document.getElementById('quizSurvivalDisplay').style.display = 'block';
  }
}

// ──────────────────────────────────────────────
// CALLBACKS
// ──────────────────────────────────────────────

function onMoveCorrect(data) {
  const feedback = document.getElementById('quizFeedback');
  if (!feedback) return;

  feedback.style.display = 'block';
  feedback.classList.remove('anim-out');
  feedback.innerHTML = `
    <div class="quiz-feedback-correct">
      <div class="quiz-feedback-icon">✅</div>
      <div class="quiz-feedback-text">
        <strong>Correct Move!</strong>
        ${data.gameOver ? '<span>🎉 Puzzle solved!</span>' : `<span>${data.move}</span>`}
      </div>
    </div>
  `;

  // Update score
  document.getElementById('quizScoreBar').textContent =
    `${quizState.score}/${quizState.puzzles.length}`;

  updateQuizProgress();

  // Survival mode streak
  if (quizState.survivalMode) {
    quizState.survivalStreak++;
    document.getElementById('quizSurvivalStreak').textContent = quizState.survivalStreak;
  }

  if (data.gameOver) {
    // Puzzle complete — show explanation
    showPuzzleComplete();
    // Auto-advance after ~1 second — no manual click needed
    setTimeout(() => {
      onNextClick();
    }, 1000);
  }
}

function onMoveIncorrect(data) {
  const feedback = document.getElementById('quizFeedback');
  if (!feedback) return;

  feedback.style.display = 'block';
  feedback.classList.remove('anim-out');
  feedback.innerHTML = `
    <div class="quiz-feedback-incorrect">
      <div class="quiz-feedback-icon">❌</div>
      <div class="quiz-feedback-text">
        <strong>Incorrect Move!</strong>
        <span>Expected: ${data.expectedMove}</span>
        <span style="font-size:12px;color:#a1a1aa;display:block;margin-top:4px;">Your move: ${data.move}</span>
      </div>
    </div>
  `;

  // Show explanation of why
  setTimeout(async () => {
    const explanationEl = document.getElementById('quizExplanationArea');
    const explanationContent = document.getElementById('quizExplanation');
    if (explanationEl && explanationContent) {
      explanationEl.style.display = 'block';
      explanationContent.innerHTML = await generateExplanation();
      document.getElementById('quizNextBtn').textContent = 'Next Puzzle →';
    }
  }, 500);
}

function onQuizFinish(result) {
  const container = document.getElementById('quizViewContainer');
  if (!container) return;

  const catInfo = QUIZ_CATEGORIES.find(c => c.id === pageState.selectedCategory);
  const passed = result.percentage >= 70;

  // Build AI recommendation copy based on performance
  let recommendation = '';
  let nextLesson = '';
  if (result.survivalMode) {
    recommendation = result.survivalStreak >= 10
      ? 'Outstanding streak! Your tactical vision is sharp under pressure.'
      : result.survivalStreak >= 5
        ? 'Solid run! Keep practicing to extend your survival streak.'
        : 'Great effort! Slow down and verify each move before committing.';
    nextLesson = 'Tactical Quiz';
  } else if (result.percentage >= 90) {
    recommendation = 'Exceptional accuracy — you are ready for harder puzzles and faster time controls.';
    nextLesson = 'Best Move · Advanced';
  } else if (result.percentage >= 70) {
    recommendation = 'Strong performance! Focus on the patterns you missed to push past 90%.';
    nextLesson = 'Tactical Quiz';
  } else if (result.percentage >= 40) {
    recommendation = 'Good foundation — review the explanations for your misses and retry this category.';
    nextLesson = `${catInfo?.label || 'Endgame'} · Beginner`;
  } else {
    recommendation = 'Keep going! Start with the fundamentals and practice one theme at a time.';
    nextLesson = 'Chess Basics · Openings';
  }

  container.innerHTML = `
    <div class="quiz-result-page">
      <div class="quiz-result-header quiz-card-elevate">
        <div class="quiz-result-glow"></div>
        <div class="quiz-result-icon">${passed ? '🏆' : '📚'}</div>
        <h2>${passed ? 'Quiz Complete!' : 'Keep Practicing!'}</h2>
        <p class="quiz-result-sub">
          ${result.survivalMode
            ? `Survival Streak: ${result.survivalStreak} puzzles`
            : `${result.score}/${result.total} correct (${result.percentage}%)`
          }
        </p>
        <div class="quiz-accuracy-bar">
          <div class="quiz-accuracy-fill" style="width:${result.percentage}%"></div>
        </div>
        <span class="quiz-accuracy-caption">${result.percentage}% Accuracy</span>
      </div>

      <div class="quiz-result-stats">
        <div class="quiz-result-stat">
          <span class="quiz-result-stat-value">${result.score}</span>
          <span class="quiz-result-stat-label">Correct</span>
        </div>
        <div class="quiz-result-stat">
          <span class="quiz-result-stat-value">${result.total}</span>
          <span class="quiz-result-stat-label">Total</span>
        </div>
        <div class="quiz-result-stat">
          <span class="quiz-result-stat-value">${result.percentage}%</span>
          <span class="quiz-result-stat-label">Score</span>
        </div>
        ${result.survivalMode ? `
        <div class="quiz-result-stat">
          <span class="quiz-result-stat-value">${result.survivalStreak}</span>
          <span class="quiz-result-stat-label">Streak</span>
        </div>` : ''}
      </div>

      <div class="quiz-result-recommendation">
        <div class="quiz-reco-icon">🤖</div>
        <div class="quiz-reco-content">
          <div class="quiz-reco-label">AI Recommendation</div>
          <p class="quiz-reco-text">${recommendation}</p>
          <span class="quiz-reco-next">Next suggested lesson: <strong>${nextLesson}</strong></span>
        </div>
      </div>

      <div class="quiz-result-actions">
        <button class="quiz-start-btn" id="quizPlayAgainBtn">🔄 Play Again</button>
        <button class="quiz-start-btn quiz-secondary-btn" id="quizChangeCategoryBtn">← Change Category</button>
      </div>
    </div>
  `;

  document.getElementById('quizPlayAgainBtn')?.addEventListener('click', () => {
    startQuiz(pageState.selectedCategory);
  });
  document.getElementById('quizChangeCategoryBtn')?.addEventListener('click', showCategoriesView);
}

// ──────────────────────────────────────────────
// PUZZLE COMPLETE
// ──────────────────────────────────────────────

async function showPuzzleComplete() {
  const explanationArea = document.getElementById('quizExplanationArea');
  const explanationContent = document.getElementById('quizExplanation');
  if (!explanationArea || !explanationContent) return;

  explanationArea.style.display = 'block';
  explanationContent.innerHTML = '<p style="color:#a1a1aa;">Generating AI analysis...</p>';
  explanationContent.innerHTML = await generateExplanation();

  const nextBtn = document.getElementById('quizNextBtn');
  if (nextBtn) {
    const isLast = quizState.currentPuzzleIndex >= quizState.puzzles.length - 1;
    nextBtn.textContent = isLast ? '🏆 See Results' : 'Next Puzzle →';
  }
}

// ──────────────────────────────────────────────
// BUTTON HANDLERS
// ──────────────────────────────────────────────

async function onHintClick() {
  const hintsRemaining = 3 - quizState.hintsUsed;
  const result = giveHint();
  const feedback = document.getElementById('quizFeedback');
  if (!feedback) return;

  if (result) {
    feedback.style.display = 'block';
    let msg = '';
    if (result.from && result.to) {
      msg = `💡 Try moving a piece from <strong>${result.from}</strong> to <strong>${result.to}</strong>`;
    } else if (result.from) {
      msg = `💡 Try a move involving square <strong>${result.from}</strong>`;
    } else {
      msg = '💡 ' + result;
    }
    feedback.innerHTML = `
      <div class="quiz-feedback-hint">
        ${msg}
        <span style="display:block;font-size:12px;color:#a1a1aa;margin-top:4px;">Hints remaining: ${hintsRemaining}</span>
      </div>`;
    setTimeout(() => { feedback.classList.add('anim-out'); setTimeout(() => { feedback.style.display = 'none'; }, 250); }, 4000);
  } else if (hintsRemaining <= 0) {
    feedback.style.display = 'block';
    feedback.innerHTML = `
      <div class="quiz-feedback-hint">
        <strong>No hints remaining.</strong>
      </div>`;
    setTimeout(() => { feedback.classList.add('anim-out'); setTimeout(() => { feedback.style.display = 'none'; }, 250); }, 3000);
  }
}

function onResetClick() {
  resetPuzzle();
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('quizFeedback').classList.remove('anim-out');
  document.getElementById('quizExplanationArea').style.display = 'none';
  document.getElementById('quizMoveHistory').innerHTML = '';

  // Re-enable board
  if (quizState.board) quizState.board.draggable = true;
}

async function onSolutionClick() {
  const result = await showSolution();
  if (result) {
    const feedback = document.getElementById('quizFeedback');
    if (feedback) {
      feedback.style.display = 'block';
      feedback.classList.remove('anim-out');
      feedback.innerHTML = `
        <div class="quiz-feedback-correct">
          <div class="quiz-feedback-icon">👁️</div>
          <div class="quiz-feedback-text">
            <strong>Solution:</strong> ${result.move}
          </div>
        </div>`;
    }

    // Show explanation
    showPuzzleComplete();
  }
}

function onNextClick() {
  const hasNext = nextPuzzle();
  if (!hasNext) return;

  // Reset UI for next puzzle
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('quizFeedback').classList.remove('anim-out');
  document.getElementById('quizExplanationArea').style.display = 'none';
  document.getElementById('quizMoveHistory').innerHTML = '';

  // Update header
  updatePuzzleHeader(quizState.currentPuzzle);

  // Enable board
  if (quizState.board) quizState.board.draggable = true;
}

// ──────────────────────────────────────────────
// UI HELPERS
// ──────────────────────────────────────────────

function updatePuzzleHeader(puzzle) {
  if (!puzzle) return;

  const badgeRow = document.getElementById('quizBadgeRow');
  const title = document.getElementById('quizPuzzleTitle');
  const goal = document.getElementById('quizPuzzleGoal');
  const scoreBar = document.getElementById('quizScoreBar');
  const header = document.getElementById('quizPuzzleHeader');

  if (badgeRow) {
    badgeRow.innerHTML = renderBadges([
      puzzle.difficulty || 'intermediate',
      `Rating ${puzzle.rating || '?'}`,
      puzzle.category || 'quiz'
    ]);
  }
  if (title) {
    title.textContent = `Puzzle ${quizState.currentPuzzleIndex + 1}/${quizState.puzzles.length}`;
  }
  if (goal) {
    goal.textContent = puzzle.goal || 'Find the best move.';
  }
  if (scoreBar) {
    scoreBar.textContent = `${quizState.score}/${quizState.puzzles.length}`;
  }

  updateQuizProgress();

  // Re-trigger question entrance animation
  if (header) {
    header.classList.remove('quiz-question-anim');
    void header.offsetWidth;
    header.classList.add('quiz-question-anim');
  }
}

function updateQuizProgress() {
  const fill = document.getElementById('quizProgressFill');
  if (!fill) return;
  const total = quizState.puzzles.length;
  if (total <= 0) return;
  const solvedNow = quizState.puzzleScored ? 1 : 0;
  const pct = Math.min(100, Math.round(((quizState.currentPuzzleIndex + solvedNow) / total) * 100));
  fill.style.width = pct + '%';
}

function bindGlobalEvents() {
  // Expose showCategoriesView for inline handlers
  window.showCategoriesView = showCategoriesView;
}

// ──────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────

export { QUIZ_CATEGORIES };

