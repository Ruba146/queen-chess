import { useState, useRef, useEffect } from 'react'
import learningApi from './learningApi'

const SUGGESTIONS = [
  'Explain the Sicilian Defense',
  'How do I improve my endgame?',
  'Teach me about forks',
  'Recommend an opening for aggressive players',
]

function formatMessageText(text) {
  if (!text) return ''
  let escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
  escaped = escaped.replace(/\n/g, '<br>')
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>')
  return escaped
}

function AIChessCoach() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const result = await learningApi.chat(history)
      const response = result?.response || 'AI explanation is temporarily unavailable.'
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'AI explanation is temporarily unavailable.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([])

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="ai-chat-welcome">
            <span className="ai-chat-welcome-icon">♟</span>
            <h3>AI Chess Coach</h3>
            <p>
              Ask me anything about chess! I can help with openings, tactics, endgames,
              strategy, game analysis, training plans, and more.
            </p>
            <div className="ai-chat-suggestions">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="ai-chat-suggestion"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat-message ai-chat-${msg.role}`}>
            <div className="ai-chat-avatar">{msg.role === 'user' ? '👤' : '♟'}</div>
            <div
              className="ai-chat-bubble"
              dangerouslySetInnerHTML={{ __html: formatMessageText(msg.content) }}
            />
          </div>
        ))}
        {loading && (
          <div className="ai-chat-message ai-chat-assistant">
            <div className="ai-chat-avatar">♟</div>
            <div className="ai-chat-bubble ai-chat-thinking">
              <span className="ai-chat-dot">.</span>
              <span className="ai-chat-dot">.</span>
              <span className="ai-chat-dot">.</span>
            </div>
          </div>
        )}
      </div>
      <div className="ai-chat-input-area">
        <textarea
          className="ai-chat-input"
          placeholder="Ask your chess coach..."
          rows="2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
        />
        <button
          type="button"
          className="ai-chat-send-btn"
          title="Send message"
          onClick={() => sendMessage()}
        >
          ➤
        </button>
        <button
          type="button"
          className="ai-chat-clear-btn"
          title="Clear conversation"
          onClick={clearChat}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default AIChessCoach
