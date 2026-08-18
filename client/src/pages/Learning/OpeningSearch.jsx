import { useState } from 'react'
import learningApi from './learningApi'

const NAME_EXAMPLES = ['Italian Game', 'London System', 'C50', 'Najdorf', 'Sicilian Defense']
const MOVES_EXAMPLES = [
  { moves: 'e4 e5 Nf3 Nc6 Bb5', label: 'Ruy Lopez' },
  { moves: 'e4 c5', label: 'Sicilian' },
  { moves: 'd4 Nf6 c4 g6 Bg7', label: 'KID' },
  { moves: 'e4 e6 d4 d5', label: 'French' },
  { moves: 'd4 d5 c4 e6', label: 'QGD' },
]

function OpeningSearch() {
  const [tab, setTab] = useState('name')
  const [name, setName] = useState('')
  const [moves, setMoves] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState(
    'Enter an opening name, ECO code, or moves above to get AI-powered analysis.',
  )
  const [result, setResult] = useState(null)

  const searchByName = async (value) => {
    const q = (value || name).trim()
    if (!q || loading) return
    setLoading(true)
    setStatusMsg(`Analyzing "${q}"...`)
    setResult(null)
    try {
      const data = await learningApi.searchOpening(q)
      setResult({ type: 'name', data, query: q })
    } catch (err) {
      setStatusMsg(`Error: ${err.message}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const searchByMoves = async (value) => {
    const q = (value || moves).trim()
    if (!q || loading) return
    setLoading(true)
    setStatusMsg(`Identifying opening from moves: ${q}...`)
    setResult(null)
    try {
      const data = await learningApi.identifyOpening(q)
      setResult({ type: 'moves', data, query: q })
    } catch (err) {
      setStatusMsg(`Error: ${err.message}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const renderNameResult = (data, query) => {
    if (!data) return <div className="learning-dynamic-status">No analysis available. Please try again.</div>
    const plans = data.plans || data.commonPlans || []
    return (
      <div className="ai-search-analysis">
        <div className="ai-search-header">
          <h3 className="text-sm font-semibold qc-text-primary">{data.openingName || query}</h3>
          <span className="learning-detail-label">ECO: {data.eco || 'N/A'}</span>
        </div>
        {data.mainMoves && (
          <div className="ai-search-section">
            <span className="learning-detail-label">Main Moves</span>
            <p className="text-xs font-mono qc-text-secondary">{data.mainMoves}</p>
          </div>
        )}
        {data.mainIdea && (
          <div className="ai-search-section">
            <span className="learning-detail-label">Main Idea</span>
            <p className="text-xs qc-text-secondary">{data.mainIdea}</p>
          </div>
        )}
        {plans.length > 0 && (
          <div className="ai-search-section">
            <span className="learning-detail-label">Plans</span>
            <ul className="space-y-1 pl-4">{plans.map((p, i) => <li key={i} className="text-xs qc-text-secondary">{p}</li>)}</ul>
          </div>
        )}
        {data.typicalContinuation && (
          <div className="ai-search-section">
            <span className="learning-detail-label">Typical Continuation</span>
            <p className="text-xs font-mono qc-text-secondary">{data.typicalContinuation}</p>
          </div>
        )}
        {renderList(data.advantages, 'Advantages', 'var(--qc-success)')}
        {renderList(data.disadvantages, 'Disadvantages', 'var(--qc-error)')}
        {renderList(data.commonMistakes, 'Common Mistakes')}
      </div>
    )
  }

  const renderMovesResult = (data, movesStr) => {
    if (!data) {
      return (
        <div className="learning-dynamic-status">
          Could not identify the opening. Please check the moves and try again.
        </div>
      )
    }
    const identified = data.identifiedOpening || 'Unknown Opening'
    const displayName = identified + (data.eco ? ` (${data.eco})` : '')
    const plans = data.commonPlans || data.plans || []
    return (
      <div className="ai-search-analysis">
        <div className="ai-search-header">
          <h3 className="text-sm font-semibold qc-text-primary">{displayName}</h3>
          <p className="text-[11px] qc-text-muted font-mono">Moves: {movesStr}</p>
        </div>
        {data.mainIdea && (
          <div className="ai-search-section">
            <span className="learning-detail-label">Main Idea</span>
            <p className="text-xs qc-text-secondary">{data.mainIdea}</p>
          </div>
        )}
        {plans.length > 0 && (
          <div className="ai-search-section">
            <span className="learning-detail-label">Plans</span>
            <ul className="space-y-1 pl-4">{plans.map((p, i) => <li key={i} className="text-xs qc-text-secondary">{p}</li>)}</ul>
          </div>
        )}
        {renderList(data.advantages, 'Advantages', 'var(--qc-success)')}
        {renderList(data.disadvantages, 'Disadvantages', 'var(--qc-error)')}
        {renderList(data.commonMistakes, 'Common Mistakes')}
      </div>
    )
  }

  const renderList = (items, label, color) => {
    if (!items || items.length === 0) return null
    return (
      <div className="ai-search-section">
        <span className="learning-detail-label" style={color ? { color } : undefined}>
          {label}
        </span>
        <ul className="space-y-1 pl-4">
          {items.map((item, i) => (
            <li key={i} className="text-xs qc-text-secondary">{item}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="learning-tool-shell">
      <div className="ai-search-tabs">
        <button
          type="button"
          className={`ai-search-tab ${tab === 'name' ? 'active' : ''}`}
          onClick={() => setTab('name')}
        >
          Search by Name
        </button>
        <button
          type="button"
          className={`ai-search-tab ${tab === 'moves' ? 'active' : ''}`}
          onClick={() => setTab('moves')}
        >
          Search by Moves
        </button>
      </div>

      {tab === 'name' && (
        <div className="ai-search-panel">
          <div className="ai-search-input-row">
            <input
              className="learning-control-input"
              type="text"
              placeholder="Search opening name, ECO code, variation..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByName()}
            />
            <button type="button" className="ai-search-btn" onClick={() => searchByName()}>
              Search
            </button>
          </div>
          <div className="ai-search-examples">
            <span className="text-[11px] qc-text-muted">Try:</span>
            {NAME_EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="ai-search-example" onClick={() => searchByName(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'moves' && (
        <div className="ai-search-panel">
          <div className="ai-search-input-row">
            <input
              className="learning-control-input"
              type="text"
              placeholder="e.g. e4 e5 Nf3 Nc6 Bb5  or  d4 Nf6 c4 g6"
              value={moves}
              onChange={(e) => setMoves(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByMoves()}
            />
            <button type="button" className="ai-search-btn" onClick={() => searchByMoves()}>
              Identify
            </button>
          </div>
          <div className="ai-search-examples">
            <span className="text-[11px] qc-text-muted">Try:</span>
            {MOVES_EXAMPLES.map((ex) => (
              <button
                key={ex.moves}
                type="button"
                className="ai-search-moves-example"
                onClick={() => searchByMoves(ex.moves)}
              >
                {ex.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] qc-text-muted mt-1">
            Enter move sequences to automatically detect the opening, variation, and ECO code.
          </p>
        </div>
      )}

      <div className="ai-search-results">
        {loading ? (
          <div className="learning-dynamic-status">{statusMsg}</div>
        ) : result ? (
          result.type === 'name' ? renderNameResult(result.data, result.query) : renderMovesResult(result.data, result.query)
        ) : (
          <div className="learning-dynamic-status">{statusMsg}</div>
        )}
      </div>
    </div>
  )
}

export default OpeningSearch
