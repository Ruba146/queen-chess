/**
 * AI Chess Coach Chat
 *
 * Feature 1 from Phase 1: An interactive chat interface where users can ask
 * natural language chess questions and get expert coaching responses.
 *
 * Reuses existing OpenRouter infrastructure via POST /api/ai/chat.
 * Maintains conversation history during the session.
 * Designed so future modules (Game Review, Daily Training, Quiz Generator)
 * can reuse the same chat infrastructure by sending pre-formatted messages.
 */

import { apiFetch } from './utils.js';
import { setHtml } from './learningView.js';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────

const CHAT_HISTORY_KEY = 'ai_chess_chat_history';
let chatHistory = [];

// Load persisted chat history (survives page switches within session)
function loadHistory() {
  try {
    const saved = sessionStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) chatHistory = JSON.parse(saved);
  } catch {
    chatHistory = [];
  }
}

function saveHistory() {
  try {
    sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  } catch {
    // Non-critical
  }
}

// ──────────────────────────────────────────────
// Render
// ──────────────────────────────────────────────

export function renderAIChat() {
  loadHistory();

  const messagesHtml = chatHistory.length === 0
    ? `<div class="ai-chat-welcome">
        <span class="ai-chat-welcome-icon">♟</span>
        <h3>AI Chess Coach</h3>
        <p>Ask me anything about chess! I can help with openings, tactics, endgames, strategy, game analysis, training plans, and more.</p>
        <div class="ai-chat-suggestions">
          <button class="ai-chat-suggestion" data-question="Explain the Sicilian Defense">Explain the Sicilian Defense</button>
          <button class="ai-chat-suggestion" data-question="How do I improve my endgame?">How do I improve my endgame?</button>
          <button class="ai-chat-suggestion" data-question="Teach me about forks">Teach me about forks</button>
          <button class="ai-chat-suggestion" data-question="Recommend an opening for aggressive players">Recommend an opening for aggressive players</button>
        </div>
      </div>`
    : chatHistory.map(msg => `
      <div class="ai-chat-message ai-chat-${msg.role}">
        <div class="ai-chat-avatar">${msg.role === 'user' ? '👤' : '♟'}</div>
        <div class="ai-chat-bubble">${formatMessageText(msg.content)}</div>
      </div>
    `).join('');

  return `
    <div class="ai-chat-container">
      <div class="ai-chat-messages" id="aiChatMessages">
        ${messagesHtml}
      </div>
      <div class="ai-chat-input-area">
        <textarea
          id="aiChatInput"
          class="ai-chat-input"
          placeholder="Ask your chess coach..."
          rows="2"
          ${chatHistory.length > 0 ? 'autofocus' : ''}
        ></textarea>
        <button id="aiChatSend" class="ai-chat-send-btn" title="Send message">➤</button>
        <button id="aiChatClear" class="ai-chat-clear-btn" title="Clear conversation">✕</button>
      </div>
    </div>
  `;
}

export function initAIChat() {
  const input = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSend');
  const clearBtn = document.getElementById('aiChatClear');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearChat);
  }

  // Bind suggestion buttons
  document.querySelectorAll('.ai-chat-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const question = btn.dataset.question;
      if (question && input) {
        input.value = question;
        sendMessage();
      }
    });
  });

  // Scroll to bottom on init
  scrollToBottom();
}

// ──────────────────────────────────────────────
// Chat Logic
// ──────────────────────────────────────────────

async function sendMessage() {
  const input = document.getElementById('aiChatInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  // Add user message to history
  chatHistory.push({ role: 'user', content: text });
  saveHistory();
  input.value = '';

  // Render immediately with user message + loading indicator
  renderMessages();
  showLoading();
  scrollToBottom();

  try {
    const response = await apiFetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    const coachResponse = response?.data?.response || 'AI explanation is temporarily unavailable.';

    // Add assistant response to history
    chatHistory.push({ role: 'assistant', content: coachResponse });
    saveHistory();
  } catch {
    chatHistory.push({ role: 'assistant', content: 'AI explanation is temporarily unavailable.' });
    saveHistory();
  }

  renderMessages();
  scrollToBottom();
}

function clearChat() {
  chatHistory = [];
  saveHistory();
  const container = document.getElementById('aiChatMessages');
  if (container) {
    // Re-render the full view
    const parent = container.closest('.ai-chat-container');
    if (parent) {
      // Simple: just reload the AI learning section
      // We need to re-trigger the switch
      const chatSection = document.querySelector('[data-section="chat"]');
      if (chatSection) chatSection.click();
    }
  }
}

function renderMessages() {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;

  container.innerHTML = chatHistory.map(msg => `
    <div class="ai-chat-message ai-chat-${msg.role}">
      <div class="ai-chat-avatar">${msg.role === 'user' ? '👤' : '♟'}</div>
      <div class="ai-chat-bubble">${formatMessageText(msg.content)}</div>
    </div>
  `).join('');

  // Remove welcome placeholder if present
  const welcome = container.querySelector('.ai-chat-welcome');
  if (welcome) welcome.remove();
}

function showLoading() {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;

  const loadingEl = document.createElement('div');
  loadingEl.className = 'ai-chat-message ai-chat-assistant';
  loadingEl.id = 'aiChatLoading';
  loadingEl.innerHTML = `
    <div class="ai-chat-avatar">♟</div>
    <div class="ai-chat-bubble ai-chat-thinking">
      <span class="ai-chat-dot">.</span><span class="ai-chat-dot">.</span><span class="ai-chat-dot">.</span>
    </div>
  `;
  container.appendChild(loadingEl);
}

function scrollToBottom() {
  const container = document.getElementById('aiChatMessages');
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

/**
 * Format message text: preserve line breaks, detect basic markdown-like patterns.
 */
function formatMessageText(text) {
  if (!text) return '';
  // Escape HTML
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>');
  // Convert newlines to <br>
  escaped = escaped.replace(/\n/g, '<br>');
  // Convert bold **text**
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Convert italic *text*
  escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return escaped;
}

