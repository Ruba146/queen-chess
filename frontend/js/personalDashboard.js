/**
 * Queen Chess - Personalized Dashboard (Phase 1)
 *
 * Rebuilt as a premium AI SaaS landing page.
 * Preserves all data fetching, business logic, IDs, and animations.
 * Only the visual presentation / HTML structure was rebuilt.
 */

import { state } from './state.js';
import { apiFetch } from './utils.js';

// ──────────────────────────────────────────────
// OPENING EXPLORER DATA (static, for Section 3)
// ──────────────────────────────────────────────
const OPENINGS = [
  {
    name: 'Italian Game',
    eco: 'C50',
    difficulty: 'Beginner',
    popularity: 'Very High',
    winRate: '52%',
    moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4',
    desc: 'The Italian Game is one of the oldest and most instructive openings. It develops quickly, controls the center, and prepares castling — ideal for learning sound opening principles.'
  },
  {
    name: 'London System',
    eco: 'D02',
    difficulty: 'Beginner',
    popularity: 'High',
    winRate: '54%',
    moves: '1.d4 d5 2.Bf4 Nf6 3.e3',
    desc: 'A solid, system-based opening that is easy to learn and reliable. The London System avoids deep theory while still developing pieces toward a strong, coherent structure.'
  },
  {
    name: 'French Defense',
    eco: 'C00',
    difficulty: 'Intermediate',
    popularity: 'High',
    winRate: '51%',
    moves: '1.e4 e6 2.d4 d5',
    desc: 'The French Defense gives Black a solid pawn chain and a strong central counter-attack. It teaches patience, protected centers, and planned minority attacks.'
  },
  {
    name: 'Sicilian Defense',
    eco: 'B20',
    difficulty: 'Advanced',
    popularity: 'Very High',
    winRate: '53%',
    moves: '1.e4 c5',
    desc: 'The Sicilian is the most popular and combative response to 1.e4. It creates asymmetric play and rich middlegame battles — a favorite at the highest levels.'
  },
  {
    name: 'Ruy Lopez',
    eco: 'C60',
    difficulty: 'Advanced',
    popularity: 'Very High',
    winRate: '52%',
    moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5',
    desc: 'The Ruy Lopez (Spanish Game) is a classical opening of patience and precision. It pressures the black knight and prepares long-term positional campaigns.'
  },
  {
    name: "King's Indian",
    eco: 'E60',
    difficulty: 'Expert',
    popularity: 'Medium',
    winRate: '50%',
    moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7',
    desc: "The King's Indian Defense offers Black a dynamic, aggressive setup. It allows a kingside attack while White builds a large center — full of tactical and strategic tension."
  }
];

// ──────────────────────────────────────────────
// MAIN ENTRY
// ──────────────────────────────────────────────

export async function loadPersonalDashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('content').innerHTML = `<div class="analysis-card" style="margin:auto;"><h2>👑 Queen Chess</h2><p class="sub-text">Login to view your dashboard.</p><button onclick="goToLogin()">Login</button></div>`;
    return;
  }

  try {
    // Fetch dashboard data, daily missions, and basic stats in parallel
    const [dashboardData, missionsData, stats, profile] = await Promise.all([
      apiFetch('/api/dashboard').catch(() => null),
      apiFetch('/api/daily-mission').catch(() => null),
      apiFetch('/api/game/stats/rapid').catch(() => null),
      apiFetch('/api/auth/profile').catch(() => null)
    ]);

    state.cachedProfile = profile;
    const name = profile?.displayName || profile?.username || 'Player';
    const rating = stats?.rating || dashboardData?.rating || 1200;
    const tier = stats?.tier || dashboardData?.tier || 'Beginner';
    const gamesPlayed = stats?.gamesPlayed || dashboardData?.gamesPlayed || 0;
    const winRate = stats?.winRate || dashboardData?.winRate || '0%';

    // Build daily streak display
    const dailyStreak = dashboardData?.dailyStreak || 0;
    const xp = dashboardData?.xp || 0;
    const level = dashboardData?.level || 1;

    // Build today's mission display
    const missions = missionsData?.missions || [];
    const missionsCompleted = missions.filter(m => m.completed).length;
    const missionsTotal = missions.length;

    // Build recent game card
    const recentGame = dashboardData?.recentGame || null;

    // Build AI recommendation
    const aiRecommendation = dashboardData?.aiRecommendation || null;

    // Build today's training
    const todayTraining = dashboardData?.todayTraining || [];
    // Handle both string and object formats for todayOpening / todayPuzzle
    let todayOpening = dashboardData?.todayOpening || null;
    if (typeof todayOpening === 'string') {
      todayOpening = { name: todayOpening, description: 'Study and practice this opening today.' };
    }
    let todayPuzzle = dashboardData?.todayPuzzle || null;
    if (typeof todayPuzzle === 'string') {
      todayPuzzle = { title: todayPuzzle, description: 'Solve this tactical puzzle today.' };
    }
    const todayGoal = dashboardData?.todayGoal || null;
    const learningProgress = dashboardData?.learningProgress || 0;

    // Normalize win rate for numeric display
    const winRateNum = parseFloat(String(winRate).replace('%', '')) || 0;

    // ── Build the premium landing page HTML ──
    let html = `<div class="landing-page">`;

    // ============================================
    // SECTION 1 — HERO
    // ============================================
    html += `
      <section class="landing-hero">
        <div class="landing-hero-glow landing-hero-glow-1"></div>
        <div class="landing-hero-glow landing-hero-glow-2"></div>
        <div class="landing-hero-piece landing-hero-queen">♛</div>
        <div class="landing-hero-piece landing-hero-knight">♞</div>
        <div class="landing-hero-content">
          <span class="landing-hero-badge"><span class="landing-hero-badge-dot"></span> AI Powered Chess Platform</span>
          <h1>Master Chess with AI<br><span class="landing-hero-accent">in a New Way</span></h1>
          <p>Queen Chess combines AI coaching, deep game analysis, adaptive learning paths and premium training into one intelligent platform built to accelerate your growth.</p>
          <div class="landing-hero-actions">
            <button class="landing-hero-cta" onclick="loadPlay()">▶ Start Playing</button>
            <button class="landing-hero-cta-secondary" onclick="loadLearning()">Explore AI</button>
          </div>
          <div class="landing-hero-meta">
            <span class="landing-hero-chip"><span class="landing-hero-chip-icon">🏅</span> ${rating} rating</span>
            <span class="landing-hero-chip"><span class="landing-hero-chip-icon">🎮</span> ${gamesPlayed} games</span>
            <span class="landing-hero-chip"><span class="landing-hero-chip-icon">⭐</span> ${xp} XP</span>
          </div>
        </div>
        <div class="landing-hero-visual">
          <div class="ai-float-panel">
            <div class="ai-float-head">
              <div class="ai-float-title"><span class="ai-float-orb"></span> Live Analysis</div>
              <span class="ai-float-live">● Engine</span>
            </div>
            <div class="ai-float-graph">
              <div class="ai-graph-bar" style="height:30%"></div>
              <div class="ai-graph-bar" style="height:55%"></div>
              <div class="ai-graph-bar" style="height:40%"></div>
              <div class="ai-graph-bar" style="height:75%"></div>
              <div class="ai-graph-bar" style="height:60%"></div>
              <div class="ai-graph-bar" style="height:90%"></div>
              <div class="ai-graph-bar" style="height:70%"></div>
              <div class="ai-graph-bar" style="height:100%"></div>
              <div class="ai-graph-bar" style="height:80%"></div>
              <div class="ai-graph-bar" style="height:95%"></div>
            </div>
            <div class="ai-float-grid">
              <div class="ai-float-item"><span class="ai-float-label">Evaluation</span><span class="ai-float-value ai-float-value-accent">+1.3</span></div>
              <div class="ai-float-item"><span class="ai-float-label">Win Probability</span><span class="ai-float-value">72%</span></div>
              <div class="ai-float-item"><span class="ai-float-label">Best Move</span><span class="ai-float-value">Nf3</span></div>
              <div class="ai-float-item"><span class="ai-float-label">Depth</span><span class="ai-float-value">22</span></div>
              <div class="ai-float-item"><span class="ai-float-label">Confidence</span><span class="ai-float-value">96%</span></div>
            </div>
            <div class="ai-float-progress">
              <div class="ai-float-progress-label"><span>Analysis</span><span>92%</span></div>
              <div class="ai-float-progress-track"><div class="ai-float-progress-fill"></div></div>
            </div>
            <div class="ai-float-thinking"><span class="ai-float-spinner"></span> Analyzing position…</div>
          </div>
        </div>
      </section>
    `;

    // ============================================
    // SECTION 2 — FEATURES (offset, unequal cards)
    // ============================================
    html += `
      <div class="landing-section-head">
        <span class="landing-eyebrow">Why Queen Chess</span>
        <h2>Everything you need to <span class="landing-accent">improve</span></h2>
        <p>A complete, intelligent ecosystem built around your unique playing style.</p>
      </div>
      <section class="landing-features">
        <div class="landing-feature-card landing-feature-large">
          <span class="landing-feature-icon">🧠</span>
          <h3>AI Analysis</h3>
          <p>Deep engine evaluation of every move you make. Understand exactly what went right and what to fix next game.</p>
          <div class="landing-feature-stat"><span>+1.3</span> evaluation</div>
        </div>
        <div class="landing-feature-card landing-feature-medium">
          <span class="landing-feature-icon">📚</span>
          <h3>Learning</h3>
          <p>Adaptive lessons and training paths that grow with your level.</p>
        </div>
        <div class="landing-feature-card landing-feature-tall">
          <span class="landing-feature-icon">♟️</span>
          <h3>Openings</h3>
          <p>Explore the most popular openings with interactive boards and AI explanations.</p>
          <div class="landing-feature-tag">6 explored</div>
        </div>
      </section>
    `;

    // ============================================
    // SECTION 3 — OPENING EXPLORER
    // ============================================
    html += `
      <section class="landing-explorer">
        <div class="landing-section-head">
          <span class="landing-eyebrow">Interactive Explorer</span>
          <h2>Popular <span class="landing-accent">Chess Openings</span></h2>
          <p>Select an opening to see its details, difficulty and win rate.</p>
        </div>
        <div class="landing-explorer-body">
          <div class="landing-chips">
            ${OPENINGS.map((o, i) => `<button class="landing-chip ${i === 0 ? 'active' : ''}" data-opening="${i}">${o.name}</button>`).join('')}
          </div>
          <div class="landing-opening-info" id="landingOpeningInfo">
            <div class="landing-opening-head">
              <div>
                <h3>${OPENINGS[0].name}</h3>
                <span class="landing-eco">${OPENINGS[0].eco}</span>
              </div>
              <span class="landing-moves">${OPENINGS[0].moves}</span>
            </div>
            <div class="landing-opening-stats">
              <div><span class="landing-open-stat-label">Difficulty</span><span class="landing-open-stat-value">${OPENINGS[0].difficulty}</span></div>
              <div><span class="landing-open-stat-label">Popularity</span><span class="landing-open-stat-value">${OPENINGS[0].popularity}</span></div>
              <div><span class="landing-open-stat-label">Win Rate</span><span class="landing-open-stat-value">${OPENINGS[0].winRate}</span></div>
            </div>
            <p class="landing-opening-desc">${OPENINGS[0].desc}</p>
            <div class="landing-board-preview">
              <div class="landing-board-preview-cell light">♟</div>
              <div class="landing-board-preview-cell dark">♘</div>
              <div class="landing-board-preview-cell dark">♜</div>
              <div class="landing-board-preview-cell light">♚</div>
              <div class="landing-board-preview-cell light">♞</div>
              <div class="landing-board-preview-cell dark">♛</div>
              <div class="landing-board-preview-cell dark">♟</div>
              <div class="landing-board-preview-cell light">♘</div>
            </div>
          </div>
        </div>
      </section>
    `;

    // ============================================
    // SECTION 4 — AI ECOSYSTEM
    // ============================================
    html += `
      <section class="landing-ecosystem">
        <div class="landing-section-head landing-center">
          <span class="landing-eyebrow">The Ecosystem</span>
          <h2>One platform. <span class="landing-accent">Every tool.</span></h2>
          <p>Connected AI features that work together seamlessly.</p>
        </div>
        <div class="landing-network">
          <div class="landing-node landing-node-core">♛</div>
          <div class="landing-node landing-node-1">AI Coach</div>
          <div class="landing-node landing-node-2">Analysis</div>
          <div class="landing-node landing-node-3">Learning</div>
          <div class="landing-node landing-node-4">Openings</div>
          <div class="landing-node landing-node-5">Recommendations</div>
          <div class="landing-node landing-node-6">Training</div>
        </div>
      </section>
    `;

    // ============================================
    // SECTION 5 — STATISTICS
    // ============================================
    html += `
      <section class="landing-stats">
        <div class="landing-stat-hero">
          <span class="landing-stat-hero-value" data-target="10000" data-suffix="+">0</span>
          <span class="landing-stat-hero-label">Games analyzed by our AI</span>
        </div>
        <div class="landing-stat-side">
          <div class="landing-stat-small">
            <span class="landing-stat-small-value" data-target="${winRateNum}" data-suffix="%">0%</span>
            <span class="landing-stat-small-label">Win Rate</span>
          </div>
          <div class="landing-stat-small">
            <span class="landing-stat-small-value" data-target="${learningProgress}">0</span>
            <span class="landing-stat-small-label">Lessons</span>
          </div>
          <div class="landing-stat-small">
            <span class="landing-stat-small-value" data-target="${OPENINGS.length}">0</span>
            <span class="landing-stat-small-label">Openings</span>
          </div>
        </div>
      </section>
    `;

    // ============================================
    // SECTION 6 — CONTINUE PLAYING
    // ============================================
    html += `
      <section class="landing-continue premium-card">
        <div class="landing-continue-glow"></div>
        <div class="landing-continue-piece landing-continue-queen">♛</div>
        <div class="landing-continue-piece landing-continue-pawn">♟</div>
        <div class="landing-continue-content">
          <span class="landing-eyebrow landing-eyebrow-light">Your Journey Awaits</span>
          <h2>Continue Playing</h2>
          <p>Jump into a fresh AI match and put your training into practice.</p>
          <div class="landing-continue-actions">
            <button onclick="loadPlay()">▶ Resume Game</button>
            <button class="landing-continue-secondary" onclick="loadLearning()">Continue Learning</button>
          </div>
        </div>
      </section>
    `;

    // ============================================
    // SECTION 7 — RECENT GAMES (timeline)
    // ============================================
    if (recentGame) {
      html += `
        <section class="landing-recent">
          <div class="landing-section-head">
            <span class="landing-eyebrow">Your Progress</span>
            <h2>Recent <span class="landing-accent">Games</span></h2>
          </div>
          <div class="landing-timeline">
            <div class="landing-timeline-item">
              <div class="landing-timeline-marker ${(recentGame.result || '').toLowerCase().includes('win') ? 'win' : (recentGame.result || '').toLowerCase().includes('loss') ? 'loss' : ''}"></div>
              <div class="landing-timeline-card">
                <div class="landing-timeline-head">
                  <span class="landing-timeline-result">${recentGame.result || 'Unknown'}</span>
                  <span class="landing-timeline-date">${new Date(recentGame.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div class="landing-timeline-body">
                  <span>vs <strong>${recentGame.opponent || 'AI'}</strong></span>
                  <span>${recentGame.opening || ''}</span>
                  <span>🎯 ${recentGame.accuracy || 0}% accuracy</span>
                </div>
                <button class="landing-timeline-action" onclick="analyzeGame('${recentGame._id}')">🔍 Review Game</button>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    // ============================================
    // SECTION 8 — FOOTER
    // ============================================
    html += `
      <footer class="landing-footer">
        <div class="landing-footer-brand">
          <div class="landing-footer-logo">♛</div>
          <p>Queen Chess — the AI-powered chess platform for intelligent improvement.</p>
        </div>
        <div class="landing-footer-col">
          <h4>Product</h4>
          <a onclick="loadPlay()">Play</a>
          <a onclick="loadLearning()">Learning</a>
          <a onclick="loadMatches()">My Games</a>
        </div>
        <div class="landing-footer-col">
          <h4>Company</h4>
          <a>About</a>
          <a>Careers</a>
          <a>Contact</a>
        </div>
        <div class="landing-footer-newsletter">
          <h4>Stay in the loop</h4>
          <p>Get new features and training tips.</p>
          <div class="landing-newsletter-row">
            <input type="email" placeholder="you@email.com">
            <button>Subscribe</button>
          </div>
        </div>
      </footer>
    `;

    html += `</div>`;
    document.getElementById('content').innerHTML = html;

    // ── Bind opening explorer chips ──
    const openingInfo = document.getElementById('landingOpeningInfo');
    document.querySelectorAll('.landing-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.landing-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const o = OPENINGS[parseInt(chip.dataset.opening, 10)];
        if (!o || !openingInfo) return;
        openingInfo.innerHTML = `
          <div class="landing-opening-head">
            <div>
              <h3>${o.name}</h3>
              <span class="landing-eco">${o.eco}</span>
            </div>
            <span class="landing-moves">${o.moves}</span>
          </div>
          <div class="landing-opening-stats">
            <div><span class="landing-open-stat-label">Difficulty</span><span class="landing-open-stat-value">${o.difficulty}</span></div>
            <div><span class="landing-open-stat-label">Popularity</span><span class="landing-open-stat-value">${o.popularity}</span></div>
            <div><span class="landing-open-stat-label">Win Rate</span><span class="landing-open-stat-value">${o.winRate}</span></div>
          </div>
          <p class="landing-opening-desc">${o.desc}</p>
          <div class="landing-board-preview">
            <div class="landing-board-preview-cell light">♟</div>
            <div class="landing-board-preview-cell dark">♘</div>
            <div class="landing-board-preview-cell dark">♜</div>
            <div class="landing-board-preview-cell light">♚</div>
            <div class="landing-board-preview-cell light">♞</div>
            <div class="landing-board-preview-cell dark">♛</div>
            <div class="landing-board-preview-cell dark">♟</div>
            <div class="landing-board-preview-cell light">♘</div>
          </div>
        `;
      });
    });

    // ── Animate stat numbers counting up ──
    requestAnimationFrame(() => {
      document.querySelectorAll('.dash-stat-value, .landing-stat-hero-value, .landing-stat-small-value').forEach(el => {
        const target = parseFloat(el.getAttribute('data-target')) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
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
      // Animate progress bars
      document.querySelectorAll('.dash-progress-fill').forEach(el => {
        const width = el.getAttribute('data-width') || 0;
        requestAnimationFrame(() => {
          el.style.width = width + '%';
        });
      });
    });

  } catch (error) {
    // Fallback to basic home page
    document.getElementById('content').innerHTML = `<div class="analysis-card" style="margin:auto;"><h2>⚠ Failed To Load Dashboard</h2><p>Please try again later.</p></div>`;
  }
}
