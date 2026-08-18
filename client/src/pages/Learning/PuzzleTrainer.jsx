import { useState } from 'react'
import { Chess } from 'chess.js'
import learningApi from './learningApi'
import LearningBoard from './LearningBoard'
import AIExplanation from './AIExplanation'

const CATEGORIES = [
  { value: 'All', label: 'All Categories' },
  { value: 'mate-in-1', label: 'Mate in 1' },
  { value: 'mate-in-2', label: 'Mate in 2' },
  { value: 'mate-in-3', label: 'Mate in 3' },
  { value: 'tactics', label: 'Tactics' },
  { value: 'endgames', label: 'Endgames' },
  { value: 'middlegame', label: 'Middlegame' },
]
const RATINGS = ['All', '600-800', '800-1000', '1000-1200', '1200-1500', '1500-1800', '1800+']

function PuzzleTrainer() {
  const [category, setCategory] = useState('All')
  const [rating, setRating] = useState('All')
  const [count, setCount] = useState(5)
  const [puzzles, setPuzzles] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Configure filters and generate a puzzle set to start.')
  const [attempt, setAttempt] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [score, setScore] = useState({ solved: 0, attempted: 0 })

  const puzzle = puzzles[current] || null

  const validateMove = (fen, moveSan) => {
    try {
      const chess = new Chess(fen)
      const move = chess.move(moveSan)
      if (!move) return { valid: false, error: 'Illegal move' }
      return { valid: true, move, newFen: chess.fen() }
    } catch {
      return { valid: false, error: 'Invalid move notation' }
    }
  }

  const generatePuzzles = async () => {
    setLoading(true)
    setStatus('Generating puzzles...')
    setPuzzles([])
    setCurrent(0)
    setScore({ solved: 0, attempted: 0 })
    setCheckResult(null)
    setExplanation(null)
    try {
      const data = await learningApi.recommendPuzzles({
        count,
        category: category === 'All' ? undefined : category,
        rating: rating === 'All' ? undefined : rating,
      })
      const list = Array.isArray(data) ? data : data?.puzzles || []
      setPuzzles(list)
      setStatus(list.length === 0 ? 'No puzzles found for these filters.' : '')
    } catch {
      setStatus('Could not generate puzzles. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const checkSolution = async () => {
    if (!puzzle || !attempt.trim()) return
    setCheckResult({ status: 'checking', message: 'Checking...' })
    try {
      const cleanSan = attempt.trim().replace(/[+#]/g, '').trim()
      const expected = puzzle.solution?.[0]
      const cleanExpected = expected ? expected.replace(/[+#]/g, '').trim() : null
      const validation = validateMove(puzzle.fen, attempt.trim())
      const moveUci = validation.valid ? validation.move.from + validation.move.to : ''
      const isCorrect = cleanExpected !== null ? (cleanSan === cleanExpected || moveUci === expected) : false

      if (isCorrect) {
        setCheckResult({ status: 'correct', message: 'Correct!' })
        setScore((s) => ({ solved: s.solved + 1, attempted: s.attempted + 1 }))
        try {
          const data = await learningApi.explainTactic({
            fen: puzzle.fen,
            solution: puzzle.solution,
            theme: puzzle.theme || category,
          })
          setExplanation(data)
        } catch {
          // explanation failed, but move was correct
        }
      } else {
        setCheckResult({ status: 'incorrect', message: validation.valid ? 'Not quite.' : validation.error })
        setScore((s) => ({ ...s, attempted: s.attempted + 1 }))
      }
    } catch {
      setCheckResult({ status: 'incorrect', message: 'Could not validate. Try again.' })
    }
  }

  const nextPuzzle = () => {
    if (current < puzzles.length - 1) {
      setCurrent(current + 1)
      setAttempt('')
      setCheckResult(null)
      setExplanation(null)
    }
  }

  return (
    <div className="learning-tool-shell">
      <div className="learning-tool-controls">
        <select className="learning-control-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select className="learning-control-select" value={rating} onChange={(e) => setRating(e.target.value)}>
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className="learning-control-select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {[3, 5, 10].map((n) => (
            <option key={n} value={n}>
              {n} puzzles
            </option>
          ))}
        </select>
        <button type="button" className="ai-search-btn" onClick={generatePuzzles} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Set'}
        </button>
      </div>

      <div className="puzzle-trainer-meta">
        <span className="learning-data-badge">Puzzle {current + 1} / {puzzles.length || 0}</span>
        <span className="learning-data-badge">Solved: {score.solved}</span>
        <span className="learning-data-badge">Attempted: {score.attempted}</span>
      </div>

      <div className="learning-explorer-layout">
        <div>
          {puzzle?.fen ? (
            <LearningBoard fen={puzzle.fen} interactive />
          ) : (
            <div className="learning-board-placeholder">Your puzzle set will appear here</div>
          )}
          {puzzle && (
            <div className="learning-puzzle-meta">
              <span className="learning-data-badge">{puzzle.theme || puzzle.name || category}</span>
              {puzzle.rating && <span className="learning-data-badge">Rating {puzzle.rating}</span>}
            </div>
          )}
        </div>
        <div className="learning-analysis-panel">
          <h4 className="text-sm font-semibold qc-text-primary">Puzzle Trainer</h4>
          {status && puzzles.length === 0 && <div className="learning-dynamic-status">{status}</div>}
          {puzzle && (
            <>
              <p className="learning-objective-text">Find the best move for {puzzle.sideToMove || 'White'}</p>
              <div className="ai-search-input-row">
                <input
                  className="learning-control-input"
                  type="text"
                  placeholder="Your move (e.g. Qh6)"
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
              {current < puzzles.length - 1 && (
                <button type="button" className="ai-search-btn" onClick={nextPuzzle} style={{ marginTop: 8 }}>
                  Next Puzzle
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PuzzleTrainer
