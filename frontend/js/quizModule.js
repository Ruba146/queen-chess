/**
 * Quiz Module — Dynamic Chess Quiz System
 *
 * Quiz categories:
 *   - Openings, Tactics, Endgames, Chess Rules, Mixed
 *
 * Question types:
 *   - Best move, Identify the opening, Tactical motif
 *   - Checkmate sequence, Engine evaluation, Explain the position
 *
 * Reuses:
 *   - apiFetch for backend calls
 *   - learningView for render helpers
 *   - aiCoachService for player profile
 */

import { apiFetch } from './utils.js';
import { renderBadges } from './learningView.js';

const state = {
  quiz: null,
  currentQuestion: 0,
  answers: [],
  score: 0,
  timer: null,
  timeRemaining: 0,
  quizActive: false
};

const QUIZ_CATEGORIES = [
  { value: 'mixed', label: '🎲 Mixed' },
  { value: 'openings', label: '♟ Openings' },
  { value: 'tactics', label: '⚡ Tactics' },
  { value: 'endgames', label: '🏁 Endgames' },
  { value: 'rules', label: '📖 Chess Rules' }
];

const QUIZ_DIFFICULTIES = [
  { value: 'beginner', label: '🌱 Beginner' },
  { value: 'intermediate', label: '📈 Intermediate' },
  { value: 'advanced', label: '🎯 Advanced' }
];

export function renderQuizModule() {
  return `
    <div class="quiz-page">
      <div id="quizSetup" class="quiz-setup">
        <div class="quiz-setup-header">
          <h2>📝 Chess Quiz</h2>
          <p style="color:#aaa;font-size:14px;">Test your chess knowledge with dynamic quizzes.</p>
        </div>

        <div class="quiz-setup-controls">
          <div class="quiz-control-group">
            <label class="quiz-label">Category</label>
            <div class="quiz-category-grid" id="quizCategoryGrid">
              ${QUIZ_CATEGORIES.map(c =>
                `<button class="quiz-category-btn ${c.value === 'mixed' ? 'active' : ''}" data-category="${c.value}">${c.label}</button>`
              ).join('')}
            </div>
          </div>

          <div class="quiz-control-group">
            <label class="quiz-label">Difficulty</label>
            <div class="quiz-difficulty-grid" id="quizDifficultyGrid">
              ${QUIZ_DIFFICULTIES.map(d =>
                `<button class="quiz-difficulty-btn ${d.value === 'intermediate' ? 'active' : ''}" data-difficulty="${d.value}">${d.label}</button>`
              ).join('')}
            </div>
          </div>

          <div class="quiz-control-group">
            <label class="quiz-label">Questions</label>
            <select id="quizCountSelect" class="learning-control-select" style="max-width:120px;">
              <option value="5">5</option>
              <option value="10" selected>10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>

        <button class="learning-cta-btn" id="quizStartBtn" style="width:100%;">🎯 Start Quiz</button>
      </div>

      <div id="quizActive" class="quiz-active" style="display:none;">
        <div class="quiz-header">
          <div class="quiz-progress" id="quizProgress"></div>
          <div class="quiz-timer" id="quizTimer"></div>
          <div class="quiz-score-display" id="quizScoreDisplay">Score: 0</div>
        </div>

        <div id="quizQuestion" class="quiz-question"></div>
        <div id="quizOptions" class="quiz-options"></div>
        <div id="quizFeedback" class="quiz-feedback" style="display:none;"></div>

        <div class="quiz-nav" id="quizNav">
          <button class="learning-cta-btn" id="quizNextBtn" style="display:none;">Next →</button>
        </div>
      </div>

      <div id="quizResults" class="quiz-results" style="display:none;">
        <div class="quiz-results-header">
          <div style="font-size:48px;margin-bottom:12px;" id="quizResultIcon">🏆</div>
          <h2 id="quizResultTitle">Quiz Complete!</h2>
          <p id="quizResultScore" style="color:#aaa;font-size:16px;"></p>
        </div>
        <div id="quizResultDetails" class="quiz-result-details"></div>
        <button class="learning-cta-btn" id="quizRetryBtn" style="width:100%;margin-top:16px;">🔄 Try Again</button>
      </div>
    </div>
  `;
}

export function initQuizModule() {
  bindSetupControls();
  state.quizActive = false;
}

function bindSetupControls() {
  // Category selection
  document.querySelectorAll('.quiz-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quiz-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Difficulty selection
  document.querySelectorAll('.quiz-difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quiz-difficulty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('quizStartBtn')?.addEventListener('click', startQuiz);
  document.getElementById('quizNextBtn')?.addEventListener('click', nextQuestion);
  document.getElementById('quizRetryBtn')?.addEventListener('click', resetToSetup);
}

async function startQuiz() {
  const category = document.querySelector('.quiz-category-btn.active')?.dataset.category || 'mixed';
  const difficulty = document.querySelector('.quiz-difficulty-btn.active')?.dataset.difficulty || 'intermediate';
  const count = parseInt(document.getElementById('quizCountSelect')?.value || '10');

  document.getElementById('quizSetup').style.display = 'none';
  document.getElementById('quizResults').style.display = 'none';

  const loadingEl = document.getElementById('quizActive');
  loadingEl.style.display = 'block';
  loadingEl.innerHTML = `
    <div style="text-align:center;padding:40px;">
      <div style="font-size:32px;margin-bottom:12px;">🔄</div>
      <p style="color:#888;">Generating quiz...</p>
    </div>
  `;

  try {
    const response = await apiFetch('/api/ai/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: [category],
        difficulty,
        count
      })
    });

    state.quiz = response.data;
    state.currentQuestion = 0;
    state.answers = [];
    state.score = 0;

    renderQuiz();
  } catch (error) {
    console.error('Quiz Error:', error);
    loadingEl.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
        <p style="color:#f87171;">Failed to generate quiz. Please try again.</p>
        <button class="learning-cta-btn" onclick="resetToQuizSetup()" style="margin-top:12px;">Back to Setup</button>
      </div>
    `;
  }
}

function renderQuiz() {
  if (!state.quiz || !state.quiz.questions || state.quiz.questions.length === 0) {
    document.getElementById('quizActive').innerHTML = `
      <div style="text-align:center;padding:40px;">
        <p style="color:#f87171;">No questions available for this category. Try a different category.</p>
        <button class="learning-cta-btn" onclick="resetToQuizSetup()" style="margin-top:12px;">Back to Setup</button>
      </div>
    `;
    return;
  }

  state.quizActive = true;

  // Render quiz layout
  document.getElementById('quizActive').innerHTML = `
    <div class="quiz-header">
      <div class="quiz-progress" id="quizProgress"></div>
      <div class="quiz-timer" id="quizTimer"></div>
      <div class="quiz-score-display" id="quizScoreDisplay">Score: 0</div>
    </div>
    <div id="quizQuestion" class="quiz-question"></div>
    <div id="quizOptions" class="quiz-options"></div>
    <div id="quizFeedback" class="quiz-feedback" style="display:none;"></div>
    <div class="quiz-nav" id="quizNav">
      <button class="learning-cta-btn" id="quizNextBtn" style="display:none;">Next →</button>
    </div>
  `;

  // Start timer
  const timeLimit = (state.quiz.timeLimitMinutes || 10) * 60;
  state.timeRemaining = Math.min(timeLimit, state.quiz.questions.length * 45);
  startTimer();

  // Bind next button
  document.getElementById('quizNextBtn')?.addEventListener('click', nextQuestion);

  showQuestion(0);
}

function showQuestion(index) {
  if (!state.quiz || !state.quiz.questions || index >= state.quiz.questions.length) {
    finishQuiz();
    return;
  }

  state.currentQuestion = index;
  const question = state.quiz.questions[index];

  // Update progress
  const progress = document.getElementById('quizProgress');
  if (progress) {
    const pct = ((index) / state.quiz.questions.length) * 100;
    progress.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#aaa;font-size:13px;">Question ${index + 1} of ${state.quiz.questions.length}</span>
        <span style="color:#c084fc;font-size:13px;font-weight:600;">${question.points || 10} pts</span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:3px;transition:width 0.3s;"></div>
      </div>
    `;
  }

  // Question text
  const questionEl = document.getElementById('quizQuestion');
  if (questionEl) {
    const categoryIcons = {
      openings: '♟', tactics: '⚡', endgames: '🏁', rules: '📖'
    };
    questionEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="learning-data-badge">${categoryIcons[question.category] || '📝'} ${question.type?.replace(/-/g, ' ') || 'question'}</span>
        <span class="learning-data-badge" style="background:rgba(251,191,36,0.1);color:#fbbf24;border-color:rgba(251,191,36,0.2);">${question.difficulty}</span>
      </div>
      <p style="font-size:16px;line-height:1.6;color:#f0f0f0;">${question.question}</p>
    `;
  }

  // Options
  const optionsEl = document.getElementById('quizOptions');
  if (optionsEl && question.options) {
    optionsEl.innerHTML = question.options.map((opt, i) =>
      `<button class="quiz-option-btn" data-index="${i}" data-correct="${i === question.correctIndex}">
        <span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span>
        <span class="quiz-option-text">${opt}</span>
      </button>`
    ).join('');

    // Bind option clicks
    optionsEl.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => selectAnswer(btn, question));
    });
  }

  // Hide feedback and next button
  document.getElementById('quizFeedback').style.display = 'none';
  document.getElementById('quizNextBtn').style.display = 'none';
}

function selectAnswer(btn, question) {
  // Disable all buttons
  document.querySelectorAll('.quiz-option-btn').forEach(b => b.disabled = true);

  const index = parseInt(btn.dataset.index);
  const isCorrect = index === question.correctIndex;

  // Visual feedback
  document.querySelectorAll('.quiz-option-btn').forEach(b => {
    const bIndex = parseInt(b.dataset.index);
    if (bIndex === question.correctIndex) {
      b.style.borderColor = 'rgba(74,222,128,0.5)';
      b.style.background = 'rgba(74,222,128,0.1)';
    }
    if (bIndex === index && !isCorrect) {
      b.style.borderColor = 'rgba(248,113,113,0.5)';
      b.style.background = 'rgba(248,113,113,0.1)';
    }
  });

  if (isCorrect) {
    btn.style.borderColor = 'rgba(74,222,128,0.6)';
    btn.style.background = 'rgba(74,222,128,0.15)';
    state.score += question.points || 10;
  }

  state.answers.push({
    questionIndex: state.currentQuestion,
    selectedIndex: index,
    correct: isCorrect
  });

  // Update score display
  const scoreEl = document.getElementById('quizScoreDisplay');
  if (scoreEl) scoreEl.textContent = `Score: ${state.score}`;

  // Show feedback
  const feedbackEl = document.getElementById('quizFeedback');
  feedbackEl.style.display = 'block';
  feedbackEl.innerHTML = `
    <div style="padding:12px;border-radius:12px;background:${isCorrect ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)'};border:1px solid ${isCorrect ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'};">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">
        ${isCorrect ? '✅ Correct!' : '❌ Incorrect'}
      </div>
      <div style="color:#bbb;font-size:13px;line-height:1.6;">
        ${question.explanation || (isCorrect ? 'Good job!' : `The correct answer was: ${question.options[question.correctIndex]}`)}
      </div>
    </div>
  `;

  // Show next button
  const nextBtn = document.getElementById('quizNextBtn');
  nextBtn.style.display = 'block';
  nextBtn.textContent = state.currentQuestion >= state.quiz.questions.length - 1
    ? '🏆 See Results'
    : 'Next →';
}

function nextQuestion() {
  if (state.currentQuestion >= state.quiz.questions.length - 1) {
    finishQuiz();
  } else {
    showQuestion(state.currentQuestion + 1);
  }
}

function finishQuiz() {
  state.quizActive = false;
  stopTimer();

  document.getElementById('quizActive').style.display = 'none';
  document.getElementById('quizResults').style.display = 'block';

  const totalPossible = state.quiz.questions.reduce((sum, q) => sum + (q.points || 10), 0);
  const pct = totalPossible > 0 ? Math.round((state.score / totalPossible) * 100) : 0;
  const passed = pct >= (state.quiz.passingScore || 70);

  document.getElementById('quizResultIcon').textContent = passed ? '🏆' : '📚';
  document.getElementById('quizResultTitle').textContent = passed
    ? '🎉 Quiz Passed!'
    : 'Keep Practicing!';
  document.getElementById('quizResultScore').textContent =
    `Score: ${state.score}/${totalPossible} (${pct}%) — ${passed ? 'Passed ✓' : 'Needs improvement'}`;

  // Show details
  const detailsEl = document.getElementById('quizResultDetails');
  detailsEl.innerHTML = state.quiz.questions.map((q, i) => {
    const answer = state.answers[i];
    const isCorrect = answer?.correct;
    return `
      <div style="padding:10px 14px;border-radius:10px;background:${isCorrect ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)'};border:1px solid ${isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#ddd;">${i + 1}. ${q.question.slice(0, 60)}${q.question.length > 60 ? '...' : ''}</span>
          <span style="font-size:14px;">${isCorrect ? '✅' : '❌'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function startTimer() {
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.timeRemaining--;
    updateTimerDisplay();
    if (state.timeRemaining <= 0) {
      finishQuiz();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('quizTimer');
  if (!timerEl) return;

  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const isLow = state.timeRemaining < 60;

  timerEl.innerHTML = `
    <span style="color:${isLow ? '#f87171' : '#888'};font-size:14px;font-weight:600;">
      ⏱ ${minutes}:${seconds.toString().padStart(2, '0')}
    </span>
  `;
}

function resetToSetup() {
  state.quiz = null;
  state.currentQuestion = 0;
  state.answers = [];
  state.score = 0;
  state.quizActive = false;
  stopTimer();

  document.getElementById('quizResults').style.display = 'none';
  document.getElementById('quizActive').style.display = 'none';
  document.getElementById('quizSetup').style.display = 'block';
}

// Exposed for inline onclick handlers
window.resetToQuizSetup = resetToSetup;

