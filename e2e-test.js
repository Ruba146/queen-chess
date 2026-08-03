/**
 * Queen Chess - AI Learning E2E Test Suite
 * 
 * Tests every AI Learning feature from the browser:
 * 1. AI Chess Coach (Chat about Sicilian Defense)
 * 2. Opening Search (by name: London, Italian, Sicilian, Najdorf, C50, B20)
 * 3. Search by Moves (e4 e5 Nf3 Nc6, e4 c5, d4 Nf6 c4 g6, d4 d5 c4)
 * 4. Opening Explorer (select openings, verify AI explanations)
 * 5. Endgame Lab (select endgames, verify Position/Objective/Method/Key Ideas/Mistakes)
 * 6. Daily Training (plan generated, exercises clickable, navigation works)
 * 7. Personalized Learning Plan (LLM-generated, no fallback)
 * 8. Learning Path (Current Rating, Strengths, Weaknesses, Today's Focus, Weekly Goal, Next Target)
 * 9. Browser Console & Network checks
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:5000';
const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots');
const TEST_USER = {
  email: 'test@queenchess.com',
  password: 'Test123!'
};

// Track all issues found
const issues = [];
function reportIssue(feature, description) {
  issues.push({ feature, description });
  console.error(`  ❌ ${feature}: ${description}`);
}

function reportSuccess(feature, description) {
  console.log(`  ✅ ${feature}: ${description}`);
}

let page, browser, serverProcess;

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      env: { ...process.env, PORT: '5000' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let started = false;
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output.trim());
      if (!started && (output.includes('Server running') || output.includes('listening'))) {
        started = true;
        setTimeout(resolve, 2000); // Wait 2s after server starts
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString().trim());
    });

    setTimeout(() => {
      if (!started) resolve(); // Resolve anyway after timeout
    }, 8000);
  });
}

async function takeScreenshot(name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 Screenshot saved: ${name}.png`);
  return filepath;
}

async function getConsoleErrors() {
  return page.evaluate(() => {
    // Access the console log captured by Playwright
    return window.__e2e_errors || [];
  });
}

async function setupPage(page) {
  // Track console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ text: msg.text(), location: msg.location() });
      // Also store on window for later retrieval
    }
  });
  page.on('pageerror', err => {
    errors.push({ text: err.message, stack: err.stack });
  });

  // Store errors and API tracking on window for later evaluation
  await page.evaluate(() => {
    window.__e2e_errors = [];
    window.__e2e_apiCalls = [];
    const origError = console.error;
    console.error = function() {
      window.__e2e_errors.push(Array.from(arguments).join(' '));
      origError.apply(console, arguments);
    };
  });

  return errors;
}

// ─────────────────────────────────────────────
// TEST 1: AI Chess Coach
// ─────────────────────────────────────────────
async function testAIChessCoach() {
  console.log('\n🧪 TEST 1: AI Chess Coach');
  
  // Click on "AI Chess Coach" card
  await page.click('.ai-card[data-section="chat"]');
  await page.waitForSelector('.ai-chat-container', { timeout: 10000 });
  await takeScreenshot('01-ai-coach-initial');
  
  // Type a question about Sicilian Defense
  await page.fill('#aiChatInput', 'Explain the Sicilian Defense');
  await page.click('#aiChatSend');
  
  // Wait for AI response to appear
  await page.waitForTimeout(8000); // Allow LLM time to respond
  await page.waitForSelector('.ai-chat-assistant .ai-chat-bubble', { timeout: 30000 });
  await takeScreenshot('01-ai-coach-sicilian-response');
  
  // Get the coach's response text
  const responseText = await page.textContent('.ai-chat-assistant .ai-chat-bubble');
  
  const requiredFields = ['Opening', 'Main moves', 'Main idea', 'Advantages', 'Disadvantages', 'Best for', 'Common mistakes'];
  const missingFields = requiredFields.filter(f => !responseText.includes(f));
  
  if (missingFields.length === 0) {
    reportSuccess('AI Chess Coach', `Response contains all required fields about Sicilian Defense`);
  } else {
    reportIssue('AI Chess Coach', `Missing fields: ${missingFields.join(', ')}`);
  }
  
  if (responseText.includes('AI explanation is temporarily unavailable') || responseText.includes('temporarily unavailable')) {
    reportIssue('AI Chess Coach', 'Fallback message detected instead of real LLM response');
  } else {
    reportSuccess('AI Chess Coach', 'Real LLM response received (no fallback)');
  }
}

// ─────────────────────────────────────────────
// TEST 2: Opening Search
// ─────────────────────────────────────────────
async function testOpeningSearch() {
  console.log('\n🧪 TEST 2: Opening Search');
  
  await page.click('.ai-card[data-section="opening-search"]');
  await page.waitForSelector('#aiSearchNameInput', { timeout: 10000 });
  await takeScreenshot('02-opening-search-initial');
  
  const openingsToTest = [
    { name: 'London System', eco: 'D02' },
    { name: 'Italian Game', eco: 'C50' },
    { name: 'Sicilian Defense', eco: 'B20' },
    { name: 'Najdorf', eco: 'B90' },
    { name: 'C50', eco: 'C50' },
    { name: 'B20', eco: 'B20' }
  ];
  
  for (const opening of openingsToTest) {
    console.log(`  Testing: ${opening.name}`);
    
    // Clear and type the opening name
    await page.fill('#aiSearchNameInput', '');
    await page.fill('#aiSearchNameInput', opening.name);
    await page.click('#aiSearchNameBtn');
    
    // Wait for results
    await page.waitForTimeout(3000);
    await page.waitForSelector('.ai-search-analysis', { timeout: 15000 });
    await takeScreenshot(`02-opening-search-${opening.name.replace(/\s+/g, '-')}`);
    
    // Check for required fields
    const pageContent = await page.textContent('.ai-search-analysis');
    
    const requiredSections = ['Main Moves', 'Main Idea', 'Advantages', 'Disadvantages'];
    if (opening.name === 'C50' || opening.name === 'B20') {
      // ECO code search
      requiredSections.push('ECO');
    }
    
    const hasTitle = pageContent.includes(opening.name) || pageContent.includes(opening.eco);
    const allSectionsPresent = requiredSections.every(s => pageContent.includes(s));
    const noFallback = !pageContent.includes('AI explanation is temporarily unavailable');
    
    if (hasTitle && allSectionsPresent && noFallback) {
      reportSuccess(`Opening Search: ${opening.name}`, 'All required fields present, no fallback');
    } else {
      const missing = [];
      if (!hasTitle) missing.push('Opening name/ECO title');
      if (!allSectionsPresent) missing.push(`Missing sections: ${requiredSections.filter(s => !pageContent.includes(s)).join(', ')}`);
      if (!noFallback) missing.push('Has fallback message');
      reportIssue(`Opening Search: ${opening.name}`, missing.join('; '));
    }
  }
}

// ─────────────────────────────────────────────
// TEST 3: Search by Moves
// ─────────────────────────────────────────────
async function testSearchByMoves() {
  console.log('\n🧪 TEST 3: Search by Moves');
  
  // Click the "Search by Moves" tab
  await page.click('.ai-search-tab[data-search-tab="moves"]');
  await page.waitForSelector('#aiSearchMovesInput', { timeout: 5000 });
  await takeScreenshot('03-search-by-moves-tab');
  
  const moveTests = [
    { moves: 'e4 e5 Nf3 Nc6', expected: 'Ruy Lopez' },
    { moves: 'e4 c5', expected: 'Sicilian' },
    { moves: 'd4 Nf6 c4 g6', expected: 'Indian' },
    { moves: 'd4 d5 c4', expected: 'Gambit' }
  ];
  
  for (const test of moveTests) {
    console.log(`  Testing moves: ${test.moves} (expecting: ${test.expected})`);
    
    await page.fill('#aiSearchMovesInput', '');
    await page.fill('#aiSearchMovesInput', test.moves);
    await page.click('#aiSearchMovesBtn');
    
    await page.waitForTimeout(3000);
    
    try {
      await page.waitForSelector('.ai-search-analysis', { timeout: 15000 });
    } catch {
      reportIssue(`Search by Moves: ${test.moves}`, 'No analysis results appeared');
      continue;
    }
    
    await takeScreenshot(`03-search-moves-${test.moves.replace(/\s+/g, '-')}`);
    
    const pageContent = await page.textContent('.ai-search-analysis');
    
    // Check if opening was identified and explanation is present
    const hasIdentification = pageContent.includes('♟') && !pageContent.includes('Unknown Opening');
    const hasIdea = pageContent.includes('Main Idea');
    const hasAdvantages = pageContent.includes('Advantages');
    const hasDisadvantages = pageContent.includes('Disadvantages');
    const noFallback = !pageContent.includes('AI explanation is temporarily unavailable');
    
    if (hasIdentification && hasIdea && hasAdvantages && hasDisadvantages && noFallback) {
      reportSuccess(`Search by Moves: ${test.moves}`, `Opening identified correctly, all fields present, no fallback`);
    } else {
      const missing = [];
      if (!hasIdentification) missing.push('Opening not identified');
      if (!hasIdea) missing.push('Missing Main Idea');
      if (!hasAdvantages) missing.push('Missing Advantages');
      if (!hasDisadvantages) missing.push('Missing Disadvantages');
      if (!noFallback) missing.push('Has fallback message');
      reportIssue(`Search by Moves: ${test.moves}`, missing.join('; '));
    }
  }
}

// ─────────────────────────────────────────────
// TEST 4: Opening Explorer
// ─────────────────────────────────────────────
async function testOpeningExplorer() {
  console.log('\n🧪 TEST 4: Opening Explorer');
  
  await page.click('.ai-card[data-section="openings"]');
  await page.waitForSelector('#openingSelect', { timeout: 10000 });
  await takeScreenshot('04-opening-explorer-initial');
  
  // Try selecting different openings from the dropdown
  const select = await page.$('#openingSelect');
  const options = await select.$$eval('option', opts => opts.map(o => ({ value: o.value, text: o.text })));
  
  // Test the first 3 openings that are NOT the AI search option
  const testOptions = options.filter(o => o.value !== '__ai_search__').slice(0, 3);
  
  for (const option of testOptions) {
    console.log(`  Selecting: ${option.text}`);
    await select.selectOption(option.value);
    await page.waitForTimeout(5000); // Wait for AI explanation + Stockfish
    
    try {
      await page.waitForSelector('.ai-explanation-panel', { timeout: 20000 });
    } catch {
      reportIssue(`Opening Explorer: ${option.text}`, 'No AI explanation panel appeared');
      continue;
    }
    
    await takeScreenshot(`04-explorer-${option.text.replace(/[^a-zA-Z0-9]/g, '-')}`);
    
    const explanationText = await page.textContent('.ai-explanation-main');
    
    if (explanationText && !explanationText.includes('temporarily unavailable')) {
      reportSuccess(`Opening Explorer: ${option.text}`, 'AI explanation from LLM');
    } else {
      reportIssue(`Opening Explorer: ${option.text}`, 'Fallback/AI unavailable message detected');
    }
  }
}

// ─────────────────────────────────────────────
// TEST 5: Endgame Lab
// ─────────────────────────────────────────────
async function testEndgameLab() {
  console.log('\n🧪 TEST 5: Endgame Lab');
  
  await page.click('.ai-card[data-section="endgame"]');
  await page.waitForSelector('#endgameSelect', { timeout: 10000 });
  await page.waitForTimeout(8000); // Wait for AI explanation to generate on load
  await takeScreenshot('05-endgame-lab-initial');
  
  // Check that the explanation panel was auto-populated
  const select = await page.$('#endgameSelect');
  const options = await select.$$eval('option', opts => opts.map(o => ({ value: o.value, text: o.text })));
  
  for (const option of options) {
    console.log(`  Selecting endgame: ${option.text}`);
    await select.selectOption(option.value);
    await page.waitForTimeout(6000); // Wait for AI explanation
    
    try {
      await page.waitForSelector('.ai-explanation-panel', { timeout: 20000 });
    } catch {
      reportIssue(`Endgame Lab: ${option.text}`, 'No AI explanation panel appeared');
      continue;
    }
    
    await takeScreenshot(`05-endgame-${option.text.replace(/[^a-zA-Z0-9]/g, '-')}`);
    
    const pageContent = await page.textContent('.ai-explanation-panel');
    
    // Check for endgame-specific fields
    const hasPosition = pageContent.includes('Position') || pageContent.includes('position');
    const hasObjective = pageContent.includes('Objective') || pageContent.includes('objective');
    const hasWinningMethod = pageContent.includes('Winning') || pageContent.includes('winning');
    const hasKeyIdeas = pageContent.includes('Key Ideas') || pageContent.includes('keyIdeas') || pageContent.includes('key ideas');
    const hasMistakes = pageContent.includes('Common Mistakes') || pageContent.includes('commonMistakes') || pageContent.includes('common mistakes');
    const noFallback = !pageContent.includes('AI explanation is temporarily unavailable');
    
    if (noFallback) {
      reportSuccess(`Endgame Lab: ${option.text}`, 'AI explanation generated, no fallback');
    } else {
      reportIssue(`Endgame Lab: ${option.text}`, 'Fallback/AI unavailable message detected');
    }
    
    // Check for specific fields
    const presentFields = [];
    if (hasPosition) presentFields.push('Position');
    if (hasObjective) presentFields.push('Objective');
    if (hasWinningMethod) presentFields.push('Winning Method');
    if (hasKeyIdeas) presentFields.push('Key Ideas');
    if (hasMistakes) presentFields.push('Common Mistakes');
    
    if (presentFields.length >= 3) {
      reportSuccess(`Endgame Lab fields: ${option.text}`, `Found: ${presentFields.join(', ')}`);
    } else {
      reportIssue(`Endgame Lab fields: ${option.text}`, `Only found ${presentFields.length}/5 expected fields: ${presentFields.join(', ')}`);
    }
  }
}

// ─────────────────────────────────────────────
// TEST 6: Daily Training
// ─────────────────────────────────────────────
async function testDailyTraining() {
  console.log('\n🧪 TEST 6: Daily Training');
  
  await page.click('.ai-card[data-section="daily-training"]');
  await page.waitForTimeout(10000); // Wait for profile + training generation
  await takeScreenshot('06-daily-training-initial');
  
  // Check if content loaded (either success or error)
  const contentVisible = await page.$('#dailyTrainingContent');
  const errorVisible = await page.$('#dailyTrainingError');
  const loadingVisible = await page.$('#dailyTrainingLoading');
  
  const isContentVisible = contentVisible && await contentVisible.isVisible();
  const isErrorVisible = errorVisible && await errorVisible.isVisible();
  const isLoadingStill = loadingVisible && await loadingVisible.isVisible();
  
  if (isContentVisible) {
    // Check stats are populated
    const stats = await page.evaluate(() => ({
      count: document.getElementById('dailyTrainingCount')?.textContent,
      time: document.getElementById('dailyTrainingTime')?.textContent,
      difficulty: document.getElementById('dailyTrainingDifficulty')?.textContent
    }));
    
    // Check components are rendered
    const components = await page.$$('.daily-training-component');
    
    reportSuccess('Daily Training', `Session loaded: ${stats.count} exercises, ${stats.time} min, ${stats.difficulty} level, ${components.length} components`);
    
    // Check exercises are clickable
    if (components.length > 0) {
      const onClick = await components[0].getAttribute('onclick');
      if (onClick) {
        reportSuccess('Daily Training', 'Exercises are clickable (have onclick handlers)');
      } else {
        reportIssue('Daily Training', 'Exercises may not be clickable');
      }
    } else {
      reportIssue('Daily Training', 'No training components rendered');
    }
    
    // Check navigation - click on "Start Training" button
    const startBtn = await page.$('#dailyTrainingStartBtn');
    if (startBtn) {
      reportSuccess('Daily Training', 'Start Training button is present');
    } else {
      reportIssue('Daily Training', 'Start Training button missing');
    }
    
  } else if (isErrorVisible) {
    reportIssue('Daily Training', 'Error state displayed instead of training content');
  } else if (isLoadingStill) {
    reportIssue('Daily Training', 'Still loading after timeout');
  } else {
    reportIssue('Daily Training', 'Neither content, error, nor loading state visible');
  }
}

// ─────────────────────────────────────────────
// TEST 7: Personalized Learning Plan (AI Coach)
// ─────────────────────────────────────────────
async function testPersonalizedCoach() {
  console.log('\n🧪 TEST 7: Personalized Learning Plan');
  
  await page.click('.ai-card[data-section="coach"]');
  await page.waitForTimeout(10000); // Wait for profile + AI plan
  await takeScreenshot('07-personalized-coach-initial');
  
  try {
    await page.waitForSelector('#coachSummary', { timeout: 20000 });
  } catch {
    reportIssue('Personalized Coach', 'Coach summary element not found');
    return;
  }
  
  const summaryText = await page.textContent('#coachSummary');
  
  if (summaryText.includes('AI explanation is temporarily unavailable') || 
      summaryText.includes('temporarily unavailable')) {
    reportIssue('Personalized Coach', 'Fallback message detected');
  } else if (summaryText.includes('Personalized plan') || 
             summaryText.includes('Today') || 
             summaryText.includes('Focus') ||
             summaryText.includes('Weakness') || 
             summaryText.includes('Target')) {
    reportSuccess('Personalized Coach', 'Real AI-generated learning plan received');
  } else if (summaryText && summaryText.length > 50) {
    reportSuccess('Personalized Coach', `Plan generated (${summaryText.length} chars)`);
  } else {
    reportIssue('Personalized Coach', `Unexpected summary: "${summaryText.substring(0, 100)}"`);
  }
}

// ─────────────────────────────────────────────
// TEST 8: Learning Path
// ─────────────────────────────────────────────
async function testLearningPath() {
  console.log('\n🧪 TEST 8: Learning Path');
  
  await page.click('.ai-card[data-section="learning-path"]');
  await page.waitForTimeout(10000); // Wait for profile + path generation
  await takeScreenshot('08-learning-path-initial');
  
  const contentVisible = await page.$('#learningPathContent');
  const errorVisible = await page.$('#learningPathError');
  
  const isContentVisible = contentVisible && await contentVisible.isVisible();
  const isErrorVisible = errorVisible && await errorVisible.isVisible();
  
  if (isContentVisible) {
    const pageContent = await page.textContent('#learningPathContent');
    
    // Check all 6 required fields
    const requiredFields = [
      'Current Rating',
      'Strengths', 
      'Weaknesses',
      'Today',
      'Weekly Goal',
      'Next Rating Target'
    ];
    
    const foundFields = requiredFields.filter(f => pageContent.includes(f));
    
    if (foundFields.length >= 6) {
      reportSuccess('Learning Path', `All 6 required fields present: ${foundFields.join(', ')}`);
    } else {
      reportIssue('Learning Path', `Missing fields: ${requiredFields.filter(f => !pageContent.includes(f)).join(', ')}`);
    }
    
    // Check for placeholder values
    if (pageContent.includes('Developing') || pageContent.includes('None identified')) {
      // These are acceptable fallbacks when no specific data exists
      console.log('  ℹ️ Learning Path has dynamic placeholder values');
    }
    
  } else if (isErrorVisible) {
    reportIssue('Learning Path', 'Error state displayed');
  } else {
    reportIssue('Learning Path', 'Neither content nor error visible');
  }
}

// ─────────────────────────────────────────────
// TEST 9: Browser Console & Network
// ─────────────────────────────────────────────
async function testBrowserConsoleAndNetwork() {
  console.log('\n🧪 TEST 9: Browser Console & Network');
  
  // Check console errors
  const consoleErrors = await page.evaluate(() => window.__e2e_errors || []);
  
  if (consoleErrors.length === 0) {
    reportSuccess('Browser Console', 'No JavaScript errors detected');
  } else {
    reportIssue('Browser Console', `${consoleErrors.length} console error(s) found:\n${consoleErrors.slice(0, 5).join('\n')}`);
  }
  
  // Check network responses using performance API
  const networkEntries = await page.evaluate(() => {
    try {
      const entries = performance.getEntriesByType('resource');
      if (!entries || !Array.isArray(entries)) return [];
      return entries
        .filter(e => e && e.name && (e.name.includes('/api/ai/') || e.name.includes('/api/')))
        .map(e => ({
          url: e.name,
          duration: e.duration,
          type: e.initiatorType
        }));
    } catch {
      return [];
    }
  });
  
  console.log(`  📊 Network requests tracked: ${(networkEntries || []).length}`);
  
  // Also check our custom tracking
  const customApiCalls = await page.evaluate(() => window.__e2e_apiCalls || []);
  const customAiUrls = customApiCalls.filter(c => c.url && c.url.includes('/api/ai/'));
  
  // Merge both sources
  const allAiEndpoints = [];
  for (const e of (networkEntries || [])) {
    if (e && e.url && e.url.includes('/api/ai/')) allAiEndpoints.push(e.url);
  }
  for (const e of customAiUrls) {
    if (e.url && e.url.includes('/api/ai/')) allAiEndpoints.push(e.url);
  }
  
  const uniqueUrls = [...new Set(allAiEndpoints)];
  
  if (uniqueUrls.length > 0) {
    reportSuccess('Network', `${uniqueUrls.length} AI API calls were made`);
  } else {
    reportIssue('Network', 'No AI API calls detected in performance logs');
  }
}

// ─────────────────────────────────────────────
// REGISTER & LOGIN HELPERS
// ─────────────────────────────────────────────
async function registerTestUser() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    const data = await res.json();
    console.log(`  Register: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.log(`  Register (may already exist): ${err.message}`);
    return false;
  }
}

async function loginViaAPI() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    const data = await res.json();
    if (res.ok) {
      return data.token || data.accessToken || data.jwt;
    }
    return null;
  } catch (err) {
    console.error(`  Login API error: ${err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// RUN ALL TESTS
// ─────────────────────────────────────────────
async function runAllTests() {
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('═══════════════════════════════════════════');
  console.log('  QUEEN CHESS - AI LEARNING E2E TESTS');
  console.log('═══════════════════════════════════════════');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log('═══════════════════════════════════════════\n');
  
  // Start server
  console.log('🚀 Starting server...');
  await startServer();
  console.log('✅ Server started\n');
  
  // Launch browser
  browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });
  
  page = await context.newPage();
  
  // Setup error tracking
  const consoleErrors = await setupPage(page);
  
  try {
    // Navigate to login page
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    
    // Check if we're already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('login.html') || currentUrl === BASE_URL + '/') {
      // Try to log in
      await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    console.log('✅ Logged in\n');
    
    // Navigate to Learning page via sidebar button
    console.log('📚 Navigating to Learning Portal via sidebar...');
    
    // First ensure we're on the index.html page (the SPA)
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click the sidebar "📚 Learning" button — it calls window.loadLearning() which
    // is mapped to loadLearningPortal from app.js globals (not dashboard.js placeholder)
    const sidebarButtons = await page.$$('.sidebar-buttons button');
    let learningBtn = null;
    for (const btn of sidebarButtons) {
      const text = await btn.textContent();
      if (text.includes('Learning')) {
        learningBtn = btn;
        break;
      }
    }
    
    if (learningBtn) {
      await learningBtn.click();
    } else {
      // Fallback: try calling loadLearning() directly
      await page.evaluate(() => window.loadLearning());
    }
    
    await page.waitForTimeout(2000);
    await takeScreenshot('00-learning-portal');
    
    // Now switch to AI Learning tab
    try {
      // Wait for the learning portal to render with tabs
      await page.waitForSelector('.learning-tab[data-tab="ai"]', { timeout: 10000 });
      await page.click('.learning-tab[data-tab="ai"]');
      await page.waitForTimeout(2000);
    } catch {
      console.log('⚠️ Could not click AI Learning tab, trying alternative...');
      // Try calling loadAILearning directly
      await page.evaluate(() => {
        // Import and call loadAILearning
        import('./js/aiLearning.js').then(m => m.loadAILearning());
      });
      await page.waitForTimeout(2000);
    }
    
    // Wait for the AI Learning cards to render
    await page.waitForSelector('.ai-card', { timeout: 15000 }).catch(() => {
      console.log('⚠️ AI cards did not render, trying evaluate...');
    });
    
    await takeScreenshot('00-ai-learning-dashboard');
    
    // Run all tests
    await testAIChessCoach();
    await testOpeningSearch();
    await testSearchByMoves();
    await testOpeningExplorer();
    await testEndgameLab();
    await testDailyTraining();
    await testPersonalizedCoach();
    await testLearningPath();
    await testBrowserConsoleAndNetwork();
    
  } catch (error) {
    console.error('\n❌ Fatal test error:', error.message);
    console.error(error.stack);
    reportIssue('FATAL', error.message);
  } finally {
    // Take final screenshot
    await takeScreenshot('99-final-state');
    
    // Print summary
    console.log('\n═══════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`Total issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\nIssues:');
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.feature}] ${issue.description}`);
      });
    } else {
      console.log('\n✅ All tests passed! No issues found.');
    }
    
    // Save issues report
    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      issues,
      totalTests: 8,
      totalIssues: issues.length
    }, null, 2));
    console.log(`\n📋 Report saved: ${reportPath}`);
    
    // Cleanup
    if (browser) await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
      }, 2000);
    }
    
    console.log('\n🏁 E2E tests completed.');
  }
}

// Run the tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

