import { useState } from 'react'
import learningApi from './learningApi'
import LearningBoard from './LearningBoard'
import AIExplanation from './AIExplanation'

const CATEGORIES = ['All', 'Forks', 'Pins', 'Skewers', 'Discovered Attack', 'Back Rank', 'Double Check']
const CATEGORY_THEME_MAP = {
  All: { category: undefined, themes: [] },
  Forks: { category: 'tactics', themes: ['fork'] },
  Pins: { category: 'tactics', themes: ['pin'] },
  Skewers: { category: 'tactics', themes: ['skewer'] },
  'Discovered Attack': { category: 'tactics', themes: ['discovered-attack'] },
  'Back Rank': { category: 'tactics', themes: ['back-rank-mate'] },
  'Double Check': { category: 'tactics', themes: ['double-attack'] },
}

function TacticsTrainer() {
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Select a category and generate puzzles to begin.')
  const [puzzle, setPuzzle] = useState(null)
  const [attempt, setAttempt] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [explanation, setExplanation] = useState(null)

  const generatePuzzle = async () => {
    setLoading(true)
    setStatus('Generating a tactical puzzle...')
    setPuzzle(null)
    setCheckResult(null)
    setExplanation(null)
    setAttempt('')
    try {
      const mapping = CATEGORY_THEME_MAP[category]
      const data = await learningApi.recommendPuzzles({ count: 1, category: mapping.category, themes: mapping.themes })
      const p = Array.isArray(data) ? data[0] : data?.puzzles?.[0] || data
      setPuzzle(p)
      setStatus('')
    } catch {
      setPuzzle(null)
      setStatus('Tactics are temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const checkSolution = async () => {
    if (!puzzle || !attempt.trim()) return
    setCheckResult({ status: 'checking', message: 'Checking your move...' })
    try {
      const data = await learningApi.explainTactic({
        fen: puzzle.fen,
        solution: puzzle.solution,
        attempt: attempt.trim(),
        name: puzzle.name,
        theme: puzzle.theme || category,
      })
      setCheckResult({
        status: data.correct ? 'correct' : 'incorrect',
        message: data.correct ? 'Correct! Well done!' : data.explanation || 'Not quite. Review the solution below.',
      })
      setExplanation(data)
    } catch {
      setCheckResult({
        status: 'incorrect',
        message: 'Could not validate your move. Please try again.',
      })
    }
  }

  return (
    <div className="learning-tool-shell">
      <div className="learning-tool-controls">
        <select className="learning-control-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" className="ai-search-btn" onClick={generatePuzzle} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Puzzle'}
        </button>
      </div>

      <div className="learning-explorer-layout">
        <div>
          {puzzle?.fen ? (
            <LearningBoard fen={puzzle.fen} interactive />
          ) : (
            <div className="learning-board-placeholder">Your tactical puzzle will appear here</div>
          )}
          {puzzle && (
            <div className="learning-puzzle-meta">
              <span className="learning-data-badge">{puzzle.theme || puzzle.name || category}</span>
              {puzzle.rating && <span className="learning-data-badge">Rating {puzzle.rating}</span>}
            </div>
          )}
        </div>
        <div className="learning-analysis-panel">
          <h4 className="text-sm font-semibold qc-text-primary">Tactics Trainer</h4>
          {status && !puzzle && <div className="learning-dynamic-status">{status}</div>}
          {puzzle && (
            <>
              <p className="learning-objective-text">Find the best move for {puzzle.sideToMove || 'White'}</p>
              <div className="ai-search-input-row">
                <input
                  className="learning-control-input"
                  type="text"
                  placeholder="Your move (e.g. Nf3)"
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkSolution()}
                />
                <button type="button" className="ai-search-btn" onClick={checkSolution}>
                  Check
                </button>
              </div>
              {checkResult && (
                <div className={`learning-check-result ${checkResult.status}`}>{checkResult.message}</div>
              )}
              {puzzle.solution && (
                <div className="ai-coach-card">
                  <h4 className="ai-coach-card-title">Solution</h4>
                  <p className="text-xs font-mono qc-text-secondary">{puzzle.solution.join(' ')}</p>
                </div>
              )}
              {explanation?.explanation && (
                <AIExplanation
                  explanation={{
                    beginnerExplanation: explanation.explanation,
                    intermediateExplanation: explanation.explanation,
                    advancedExplanation: explanation.explanation,
                    tacticalThemes: explanation.themes || explanation.tacticalThemes,
                    mainIdea: explanation.mainIdea,
                  }}
                  type="tactic"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TacticsTrainer
