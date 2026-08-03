/**
 * AI Chess Coach — Floating Widget
 *
 * Phase 1 AI Ecosystem
 *
 * A floating circular button at the bottom-right that opens a chat panel.
 * Available on every page. Page-context aware. Integrates with AI memory.
 *
 * Uses existing API infrastructure:
 *   POST /api/ai/coach/context — Get context-aware welcome
 *   POST /api/ai/coach/chat — Chat with context + memory
 *   GET /api/chat — List conversations
 *   POST /api/chat — Create new conversation
 *   GET /api/chat/:id/messages — Load conversation
 *   POST /api/chat/:id/messages — Send message
 *   PUT /api/chat/:id — Rename conversation
 *   DELETE /api/chat/:id — Delete conversation
 *   GET /api/chat/search?q= — Search conversations
 */

import { apiFetch, getToken } from './utils.js';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────

const WIDGET_STATE = {
  isOpen: false,
  isMinimized: false,
  currentChatId: null,
  chats: [],
  messages: [],
  loading: false,
  currentPage: detectCurrentPage(),
  unreadCount: 0
};

// ──────────────────────────────────────────────
// Render: Full Widget HTML
// ──────────────────────────────────────────────

export function renderAICoachWidget() {
  return `
    <div class="ai-coach-widget-container" id="aiCoachWidget">
      <!-- Floating Button -->
      <button class="ai-coach-float-button" id="aiCoachToggle" title="AI Chess Coach">
        <span class="ai-coach-float-icon">♟</span>
        <span class="ai-coach-badge" id="aiCoachBadge" style="display:none;">0</span>
      </button>

      <!-- Suggested Prompts (appear when widget is open) -->
      <div class="ai-coach-suggestions" id="aiCoachSuggestions">
        <button class="ai-coach-suggestion-chip" data-prompt="Give me a chess tip for my level">💡 Tip</button>
        <button class="ai-coach-suggestion-chip" data-prompt="Recommend an opening for me">♟ Opening</button>
        <button class="ai-coach-suggestion-chip" data-prompt="How can I stop blundering?">🧠 Strategy</button>
      </div>

      <!-- Chat Panel (hidden by default) -->
      <div class="ai-coach-chat-panel" id="aiCoachPanel" style="display:none;">
        <!-- Header -->
        <div class="ai-coach-chat-header">
          <div class="ai-coach-chat-avatar"><span class="ai-coach-avatar-crown">♛</span></div>
          <div class="ai-coach-chat-info">
            <div class="ai-coach-chat-title">AI Chess Coach</div>
            <div class="ai-coach-chat-status"><span class="ai-coach-status-dot"></span> Online</div>
          </div>
          <div class="ai-coach-chat-actions">
            <button class="ai-coach-header-btn" id="aiCoachHomeBtn" title="Chats">☰</button>
            <button class="ai-coach-header-btn" id="aiCoachMinimize" title="Minimize">─</button>
            <button class="ai-coach-header-btn close-btn" id="aiCoachClose" title="Close">✕</button>
          </div>
        </div>

        <!-- Chat Selector (top bar with New Chat + Search) -->
        <div class="ai-coach-chat-selector" id="aiCoachChatSelector" style="display:none;">
          <button class="ai-coach-chat-btn new" id="aiCoachNewChat">+ New Chat</button>
          <input id="aiCoachSearchInput" class="ai-coach-input" style="flex:1;min-height:32px;padding:6px 10px;font-size:12px;" placeholder="Search chats..." />
        </div>

        <!-- Chat List (rendered between selector and context banner when viewing list) -->
        <div class="ai-coach-chat-list" id="aiCoachChatList" style="display:none;"></div>

        <!-- Context Banner -->
        <div class="ai-coach-context-banner" id="aiCoachContextBanner"></div>

        <!-- Messages -->
        <div class="ai-coach-messages" id="aiCoachMessages">
          <div class="ai-coach-placeholder" id="aiCoachPlaceholder">
            <div class="ai-coach-placeholder-icon">♟</div>
            <h3>AI Chess Coach</h3>
            <p>Ask me anything about chess! I can help with openings, tactics, endgames, and strategy.</p>
            <div class="ai-coach-placeholder-chips">
              <button class="ai-coach-suggestion-chip" data-prompt="Give me a chess tip for my level">💡 Quick tip</button>
              <button class="ai-coach-suggestion-chip" data-prompt="Recommend an opening for me">♟ Recommend opening</button>
              <button class="ai-coach-suggestion-chip" data-prompt="How can I stop blundering?">🧠 Stop blunders</button>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="ai-coach-input-area">
          <textarea
            class="ai-coach-input"
            id="aiCoachInput"
            placeholder="Ask your chess coach..."
            rows="1"
          ></textarea>
          <button class="ai-coach-send-btn" id="aiCoachSend">➤</button>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// Initialize
// ──────────────────────────────────────────────

export function initAICoachWidget() {
  bindControls();

  // Set initial context
  updateContextBanner();

  // Check for unread notifications
  checkNotifications();

  // Re-detect page on navigation changes
  const originalPushState = history.pushState;
  history.pushState = function () {
    originalPushState.apply(this, arguments);
    WIDGET_STATE.currentPage = detectCurrentPage();
    updateContextBanner();
  };

  window.addEventListener('popstate', () => {
    WIDGET_STATE.currentPage = detectCurrentPage();
    updateContextBanner();
  });
}

// ──────────────────────────────────────────────
// Event Binding
// ──────────────────────────────────────────────

function bindControls() {
  // Toggle button
  document.getElementById('aiCoachToggle')?.addEventListener('click', toggleWidget);

  // Close button
  document.getElementById('aiCoachClose')?.addEventListener('click', closeWidget);

  // Minimize button
  document.getElementById('aiCoachMinimize')?.addEventListener('click', minimizeWidget);

  // Home/Back button (show chat list)
  document.getElementById('aiCoachHomeBtn')?.addEventListener('click', showChatList);

  // New Chat button
  document.getElementById('aiCoachNewChat')?.addEventListener('click', startNewChat);

  // Send button
  document.getElementById('aiCoachSend')?.addEventListener('click', sendMessage);

  // Enter to send
  document.getElementById('aiCoachInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Search input with debounce
  let searchTimeout;
  document.getElementById('aiCoachSearchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchChats(e.target.value), 300);
  });

// Delegate clicks within the chat list
  document.getElementById('aiCoachChatList')?.addEventListener('click', (e) => {
    const chatItem = e.target.closest('.ai-coach-chat-item');
    if (chatItem && !e.target.closest('.ai-coach-rename-btn') && !e.target.closest('.ai-coach-delete-btn')) {
      const chatId = chatItem.dataset.chatId;
      if (chatId) loadChat(chatId);
      return;
    }
    const renameBtn = e.target.closest('.ai-coach-rename-btn');
    if (renameBtn) {
      e.stopPropagation();
      const chatId = renameBtn.dataset.chatId;
      if (chatId) promptRenameChat(chatId);
      return;
    }
    const deleteBtn = e.target.closest('.ai-coach-delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const chatId = deleteBtn.dataset.chatId;
      if (chatId) promptDeleteChat(chatId);
      return;
    }
  });

  // Delegate clicks on suggestion chips (both floating and in-placeholder)
  document.getElementById('aiCoachWidget')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.ai-coach-suggestion-chip');
    if (chip) {
      const prompt = chip.dataset.prompt;
      if (prompt) handleSuggestionClick(prompt);
    }
  });
}

/**
 * Handle a suggestion chip click: open the widget, ensure a chat exists,
 * and send the prompt as a message.
 */
function handleSuggestionClick(prompt) {
  const token = getToken();
  if (!token) {
    openWidget();
    return;
  }

  // Open the widget if not already open
  if (!WIDGET_STATE.isOpen) {
    openWidget();
  }

  // Hide the floating suggestions once a chip is used
  const suggestions = document.getElementById('aiCoachSuggestions');
  if (suggestions) suggestions.style.display = 'none';

  // Set the input value and send it
  const input = document.getElementById('aiCoachInput');
  if (input) {
    input.value = prompt;
    sendMessage();
  }
}

// ──────────────────────────────────────────────
// Widget Visibility
// ──────────────────────────────────────────────

function toggleWidget() {
  if (WIDGET_STATE.isOpen) {
    closeWidget();
  } else {
    openWidget();
  }
}

function openWidget() {
  const panel = document.getElementById('aiCoachPanel');
  const container = document.getElementById('aiCoachWidget');
  if (!panel || !container) return;

  // Check authentication first
  const token = getToken();
  if (!token) {
    // Show login prompt instead of panel
    panel.style.display = 'flex';
    WIDGET_STATE.isOpen = true;
    container.classList.remove('minimized');
    showLoginPrompt();
    return;
  }

  panel.style.display = 'flex';
  WIDGET_STATE.isOpen = true;
  container.classList.remove('minimized');

  // Focus input after animation
  setTimeout(() => {
    const input = document.getElementById('aiCoachInput');
    if (input) input.focus();
  }, 400);

  // Load chats if not loaded
  if (WIDGET_STATE.chats.length === 0) {
    loadChats();
  }

  // Clear badge
  WIDGET_STATE.unreadCount = 0;
  const badge = document.getElementById('aiCoachBadge');
  if (badge) badge.style.display = 'none';
}

/**
 * Show a login prompt in the messages area when user is not authenticated.
 */
function showLoginPrompt() {
  const messages = document.getElementById('aiCoachMessages');
  if (!messages) return;

  // Hide chat selector and list when showing login prompt
  const selector = document.getElementById('aiCoachChatSelector');
  if (selector) selector.style.display = 'none';
  const chatList = document.getElementById('aiCoachChatList');
  if (chatList) chatList.style.display = 'none';

  // Hide context banner
  const banner = document.getElementById('aiCoachContextBanner');
  if (banner) {
    banner.textContent = '';
    banner.style.display = 'none';
  }

  // Disable input
  const inputArea = document.querySelector('.ai-coach-input-area');
  if (inputArea) inputArea.style.display = 'none';

  messages.innerHTML = `
    <div class="ai-coach-placeholder" style="height:100%;">
      <div class="ai-coach-placeholder-icon">🔑</div>
      <h3>Login Required</h3>
      <p style="margin-bottom:16px;">Please log in to use the AI Chess Coach.</p>
      <button onclick="goToLogin()" style="width:auto;padding:10px 28px;display:inline-block;">Login</button>
    </div>
  `;

  // Re-enable input area if authenticated later
  setTimeout(() => {
    const token = getToken();
    if (token && inputArea) inputArea.style.display = 'flex';
  }, 1000);
}

function closeWidget() {
  const panel = document.getElementById('aiCoachPanel');
  const container = document.getElementById('aiCoachWidget');
  if (!panel || !container) return;

  panel.classList.add('closing');
  setTimeout(() => {
    panel.style.display = 'none';
    panel.classList.remove('closing');
    WIDGET_STATE.isOpen = false;

    // Re-enable input area for next open
    const inputArea = document.querySelector('.ai-coach-input-area');
    if (inputArea) inputArea.style.display = 'flex';
  }, 250);
}

function minimizeWidget() {
  const container = document.getElementById('aiCoachWidget');
  if (!container) return;

  container.classList.toggle('minimized');
  WIDGET_STATE.isMinimized = container.classList.contains('minimized');

  const panel = document.getElementById('aiCoachPanel');
  if (panel) {
    panel.style.display = WIDGET_STATE.isMinimized ? 'none' : 'flex';
  }

  if (WIDGET_STATE.isMinimized) {
    WIDGET_STATE.isOpen = false;
  } else {
    WIDGET_STATE.isOpen = true;
  }
}

// ──────────────────────────────────────────────
// Page Context Detection
// ──────────────────────────────────────────────

function detectCurrentPage() {
  const title = document.title.toLowerCase();

  if (title.includes('login') || title.includes('register')) return null;
  if (window.location.pathname.includes('login') || window.location.pathname.includes('register')) return null;

  const content = document.getElementById('content');
  if (!content) return 'default';

  const html = content.innerHTML.toLowerCase();

  if (html.includes('start-screen') || html.includes('start-match') || html.includes('#board') || html.includes('difficultyselect')) return 'play';
  if (html.includes('my games') || html.includes('game-card') || html.includes('games-container')) return 'my-games';
  if (html.includes('learning-page') || html.includes('learn chess') || html.includes('learning-tab')) return 'learning';
  if (html.includes('quiz') && (html.includes('question') || html.includes('category') || html.includes('difficulty'))) return 'quiz';
  if (html.includes('profile-page') || html.includes('profile-stat') || html.includes('account settings')) return 'profile';
  if (html.includes('premium') || html.includes('💎')) return 'premium';
  if (html.includes('home-page') || html.includes('stats-grid') || html.includes('dashboard')) return 'home';

  if (html.includes('analysis-tab') || html.includes('ai-report') || html.includes('performance report') || html.includes('evalgraph') || html.includes('move-review-box') || html.includes('analysis-board')) return 'analysis';

  if (html.includes('opening-explorer') || html.includes('opening-search') || html.includes('ai-search-results') || html.includes('learning-explorer') || html.includes('opening-results')) return 'opening-explorer';

  return 'default';
}

async function updateContextBanner() {
  const banner = document.getElementById('aiCoachContextBanner');
  if (!banner) return;

  const page = WIDGET_STATE.currentPage;
  if (!page) {
    banner.textContent = '';
    banner.style.display = 'none';
    return;
  }

  try {
    const response = await apiFetch('/api/ai/coach/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page })
    });

    if (response?.success && response?.data?.welcome) {
      banner.textContent = response.data.welcome;
      banner.style.display = 'block';
    }
  } catch {
    // Fallback static context
    const contexts = {
      home: "I'm your AI Chess Coach. Ask me about your stats or recommendations!",
      play: "Starting a game? I can give you opening tips!",
      'my-games': "Reviewing your games? I can help analyze positions!",
      learning: "Studying chess? Ask me about openings, tactics or endgames!",
      quiz: "Taking a quiz? I can help explain chess concepts!",
      profile: "Looking at your profile? I can suggest improvements!",
      premium: "Checking premium features? I can tell you more!",
      analysis: "Analyzing a game? I can explain every move and help you understand critical positions!",
      'opening-explorer': "Exploring openings? I can explain plans, traps, and common mistakes in any opening!",
      default: "Your AI Chess Coach is here to help!"
    };
    banner.textContent = contexts[page] || contexts.default;
    banner.style.display = 'block';
  }
}

// ──────────────────────────────────────────────
// Chat Management
// ──────────────────────────────────────────────

async function loadChats() {
  try {
    const response = await apiFetch('/api/chat');
    if (response?.success && Array.isArray(response.data)) {
      WIDGET_STATE.chats = response.data;
    }
  } catch {
    // Non-critical
  }
}

/**
 * Render the full chat list with clickable items, rename and delete buttons.
 */
function renderChatList() {
  const chatList = document.getElementById('aiCoachChatList');
  if (!chatList) return;

  const selector = document.getElementById('aiCoachChatSelector');
  if (selector) selector.style.display = 'flex';

  if (WIDGET_STATE.chats.length === 0) {
    chatList.innerHTML = `
      <div class="ai-coach-chat-list-empty">
        <p>No conversations yet. Start a new chat!</p>
      </div>
    `;
    chatList.style.display = 'block';
    return;
  }

  chatList.innerHTML = WIDGET_STATE.chats.map((chat) => {
    const isActive = chat._id === WIDGET_STATE.currentChatId;
    const date = chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : '';
    return `
      <div class="ai-coach-chat-item ${isActive ? 'active' : ''}" data-chat-id="${chat._id}">
        <div class="ai-coach-chat-item-content">
          <div class="ai-coach-chat-item-title">${escapeHtml(chat.title || 'New Chat')}</div>
          <div class="ai-coach-chat-item-date">${date}</div>
        </div>
        <div class="ai-coach-chat-item-actions">
          <button class="ai-coach-rename-btn" data-chat-id="${chat._id}" title="Rename">✎</button>
          <button class="ai-coach-delete-btn" data-chat-id="${chat._id}" title="Delete">✕</button>
        </div>
      </div>
    `;
  }).join('');

  chatList.style.display = 'block';
}

/**
 * Show the chat list view.
 * Clears the messages area and displays all chats as clickable items.
 */
function showChatList() {
  const messages = document.getElementById('aiCoachMessages');
  if (messages) {
    messages.innerHTML = `
      <div class="ai-coach-placeholder">
        <div class="ai-coach-placeholder-icon">💬</div>
        <h3>Your Chats</h3>
        <p>Select a chat or start a new one.</p>
      </div>
    `;
  }

  WIDGET_STATE.currentChatId = null;
  WIDGET_STATE.messages = [];

  // Show chat selector and render chat list
  const selector = document.getElementById('aiCoachChatSelector');
  if (selector) selector.style.display = 'flex';

  renderChatList();

  updateContextBanner();
}

async function startNewChat() {
  try {
    const response = await apiFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' })
    });

    if (response?.success && response?.data) {
      WIDGET_STATE.currentChatId = response.data._id;
      WIDGET_STATE.messages = [];
      WIDGET_STATE.chats.unshift(response.data);

      // Clear messages area to show placeholder
      const messages = document.getElementById('aiCoachMessages');
      if (messages) {
        messages.innerHTML = `
          <div class="ai-coach-placeholder">
            <div class="ai-coach-placeholder-icon">♟</div>
            <h3>New Chat</h3>
            <p>Ask me anything about chess!</p>
          </div>
        `;
      }

      // Focus input
      setTimeout(() => {
        const input = document.getElementById('aiCoachInput');
        if (input) input.focus();
      }, 200);

      // Hide chat selector and list
      const selector = document.getElementById('aiCoachChatSelector');
      if (selector) selector.style.display = 'none';
      const chatList = document.getElementById('aiCoachChatList');
      if (chatList) chatList.style.display = 'none';

      updateContextBanner();
    }
  } catch {
    // Non-critical
  }
}

async function searchChats(query) {
  if (!query.trim()) {
    loadChats().then(() => renderChatList());
    return;
  }

  try {
    const response = await apiFetch(`/api/chat/search?q=${encodeURIComponent(query)}`);
    if (response?.success && Array.isArray(response.data)) {
      WIDGET_STATE.chats = response.data;
      renderChatList();
    }
  } catch {
    // Non-critical
  }
}

// ──────────────────────────────────────────────
// Messaging
// ──────────────────────────────────────────────

async function sendMessage() {
  const input = document.getElementById('aiCoachInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  // If no active chat, create one
  if (!WIDGET_STATE.currentChatId) {
    await startNewChat();
    // Send after a short delay to ensure chat is created
    setTimeout(() => doSendMessage(text), 300);
    input.value = '';
    return;
  }

  input.value = '';
  await doSendMessage(text);
}

async function doSendMessage(text) {
  if (!WIDGET_STATE.currentChatId) return;
  if (WIDGET_STATE.loading) return;

  WIDGET_STATE.loading = true;

  // Add user message to UI immediately
  appendMessage('user', text);

  // Show thinking indicator
  showThinking();

  try {
    const response = await apiFetch(`/api/chat/${WIDGET_STATE.currentChatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });

    // Remove thinking indicator
    removeThinking();

    if (response?.success && response?.data?.assistant) {
      appendMessage('coach', response.data.assistant.content);
      WIDGET_STATE.messages.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response.data.assistant.content }
      );
    } else {
      appendMessage('coach', 'AI explanation is temporarily unavailable.');
    }
  } catch {
    removeThinking();
    appendMessage('coach', 'AI explanation is temporarily unavailable.');
  }

  WIDGET_STATE.loading = false;
}

function appendMessage(role, content) {
  const messages = document.getElementById('aiCoachMessages');
  if (!messages) return;

  // Remove placeholder if present
  const placeholder = messages.querySelector('.ai-coach-placeholder');
  if (placeholder) placeholder.remove();

  const formatted = formatMessageText(content);
  const msgEl = document.createElement('div');
  msgEl.className = `ai-coach-msg ${role}`;
  msgEl.innerHTML = `
    <div class="ai-coach-msg-avatar">${role === 'user' ? '👤' : '♟'}</div>
    <div class="ai-coach-msg-bubble">${formatted}</div>
  `;
  messages.appendChild(msgEl);
  scrollToBottom();
}

function showThinking() {
  const messages = document.getElementById('aiCoachMessages');
  if (!messages) return;

  const thinkingEl = document.createElement('div');
  thinkingEl.className = 'ai-coach-msg coach';
  thinkingEl.id = 'aiCoachThinking';
  thinkingEl.innerHTML = `
    <div class="ai-coach-msg-avatar">♟</div>
    <div class="ai-coach-msg-bubble ai-coach-thinking">
      <span class="ai-coach-dot"></span>
      <span class="ai-coach-dot"></span>
      <span class="ai-coach-dot"></span>
    </div>
  `;
  messages.appendChild(thinkingEl);
  scrollToBottom();
}

function removeThinking() {
  const thinking = document.getElementById('aiCoachThinking');
  if (thinking) thinking.remove();
}

function scrollToBottom() {
  const messages = document.getElementById('aiCoachMessages');
  if (messages) {
    setTimeout(() => {
      messages.scrollTop = messages.scrollHeight;
    }, 50);
  }
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

/**
 * Check for unread notifications by comparing chat activity
 * against the user's last visit timestamp stored in localStorage.
 */
async function checkNotifications() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await apiFetch('/api/chat');
    if (response?.success && Array.isArray(response.data)) {
      WIDGET_STATE.chats = response.data;

      // Get last viewed timestamp
      const lastViewed = parseInt(localStorage.getItem('ai_coach_last_viewed') || '0', 10);
      const now = Date.now();

      // Count chats that have been updated since last view
      const unread = response.data.filter((chat) => {
        if (!chat.updatedAt) return false;
        const chatDate = new Date(chat.updatedAt).getTime();
        return chatDate > lastViewed;
      }).length;

      if (unread > 0) {
        WIDGET_STATE.unreadCount = unread;
        const badge = document.getElementById('aiCoachBadge');
        if (badge) {
          badge.textContent = unread > 99 ? '99+' : unread;
          badge.style.display = 'flex';
        }
      } else {
        // Fallback: show total chats count if no unread
        if (response.data.length > 0 && !lastViewed) {
          WIDGET_STATE.unreadCount = response.data.length;
          const badge = document.getElementById('aiCoachBadge');
          if (badge) {
            badge.textContent = response.data.length;
            badge.style.display = 'flex';
          }
        }
      }
    }
  } catch {
    // Non-critical — silent failure
  }
}

// ──────────────────────────────────────────────
// Load a specific chat (continue conversation)
// ──────────────────────────────────────────────

async function loadChat(chatId) {
  WIDGET_STATE.currentChatId = chatId;
  WIDGET_STATE.messages = [];

  const messages = document.getElementById('aiCoachMessages');
  if (messages) {
    messages.innerHTML = `
      <div class="ai-coach-placeholder">
        <div class="ai-coach-placeholder-icon">♟</div>
        <h3>Loading chat...</h3>
      </div>
    `;
  }

  try {
    const response = await apiFetch(`/api/chat/${chatId}/messages`);
    if (response?.success && Array.isArray(response.data)) {
      WIDGET_STATE.messages = response.data;
      renderMessages();
    }
  } catch {
    appendMessage('coach', 'Failed to load messages.');
  }

  // Hide chat selector and list
  const selector = document.getElementById('aiCoachChatSelector');
  if (selector) selector.style.display = 'none';
  const chatList = document.getElementById('aiCoachChatList');
  if (chatList) chatList.style.display = 'none';

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('aiCoachInput');
    if (input) input.focus();
  }, 300);

  // Mark as viewed
  localStorage.setItem('ai_coach_last_viewed', String(Date.now()));

  updateContextBanner();
}

// ──────────────────────────────────────────────
// Render stored messages into the messages container
// ──────────────────────────────────────────────

function renderMessages() {
  const container = document.getElementById('aiCoachMessages');
  if (!container) return;

  // Remove placeholder
  const placeholder = container.querySelector('.ai-coach-placeholder');
  if (placeholder) placeholder.remove();

  container.innerHTML = '';
  WIDGET_STATE.messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'coach';
    appendMessage(role, msg.content);
  });

  scrollToBottom();
}

// ──────────────────────────────────────────────
// Rename Chat — prompt user for new name
// ──────────────────────────────────────────────

async function promptRenameChat(chatId) {
  const chat = WIDGET_STATE.chats.find((c) => c._id === chatId);
  if (!chat) return;

  const newTitle = prompt('Rename chat:', chat.title);
  if (!newTitle || newTitle.trim() === '' || newTitle === chat.title) return;

  try {
    const response = await apiFetch(`/api/chat/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    if (response?.success) {
      chat.title = newTitle.trim();
      renderChatList();
    }
  } catch {
    appendMessage('coach', 'Failed to rename chat.');
  }
}

// ──────────────────────────────────────────────
// Delete Chat — confirm and delete
// ──────────────────────────────────────────────

async function promptDeleteChat(chatId) {
  if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) return;

  try {
    const response = await apiFetch(`/api/chat/${chatId}`, {
      method: 'DELETE'
    });

    if (response?.success) {
      WIDGET_STATE.chats = WIDGET_STATE.chats.filter((c) => c._id !== chatId);
      renderChatList();

      // If currently viewing this chat, go back to chat list
      if (WIDGET_STATE.currentChatId === chatId) {
        showChatList();
      }
    }
  } catch {
    appendMessage('coach', 'Failed to delete chat.');
  }
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

function formatMessageText(text) {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>');
  escaped = escaped.replace(/\n/g, '<br>');
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return escaped;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

