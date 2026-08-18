import { useState, useEffect, useRef, useCallback } from 'react'
import learningApi from './learningApi'
import LearningBoard, { safeChess } from './LearningBoard'
import AIExplanation from './AIExplanation'

function EndgameLab() {
  const [endgames, setEndgames] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('Loading endgames...')
  const [explanation, setExplanation] = useState(null)
  const [hint, setHint] = useState('')
  const [success, setSuccess] = useState(false)

  const chessRef = useRef(safeChess())
  const [fen, setFen] = useState(safeChess().fen())

  const selected = endgames.find((e) => e.id === selectedId) || null

  const loadEndgames = useCallback(async () => {
    setLoading(true)
    try {
      const data = await learningApi.exploreEndgames()
      const list = Array.isArray(data) ? data : []
      setEndgames(list)
      if (list.length > 0) {
        setSelectedId(list[0].id)
      } else {
        setStatus('No endgame studies available yet. Try again later.')
      }
    } catch {
      setStatus('Could not load endgame studies from AI. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEndgames()
  }, [loadEndgames])

  const loadEndgame = useCallback(async (eg) => {
    if (!eg) return
    const startFen = eg.startFen || eg.fen || null
    const chess = safeChess(startFen)
    chessRef.current = chess
    setFen(chess.fen())
    setHint('')
    setSuccess(false)
    setExplanation(null)
    setStatus('Generating AI explanation...')
    try {
      const exp = await learningApi.explainEndgame({
        name: eg.name,
        fen: startFen,
        objective: eg.objective,
        difficulty: eg.difficulty,
      })
      setExplanation(exp)
      setStatus('')
    } catch {
      setStatus('AI explanation is temporarily unavailable.')
    }
  }, [])

  useEffect(() => {
    if (selectedId) {
      const eg = endgames.find((e) => e.id === selectedId)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (eg) loadEndgame(eg)
    }
  }, [selectedId, endgames, loadEndgame])

  const onSquareClick = () => {
    const chess = chessRef.current
    if (!chess || success) return
  }

  const getHint = async () => {
    if (!selected) return
    setHint('Thinking...')
    const chess = chessRef.current
    try {
      const exp = await learningApi.explainEndgame({
        name: selected.name,
        fen: chess.fen(),
        objective: selected.objective,
        difficulty: selected.difficulty,
        askHint: true,
      })
      setHint(exp?.hint || exp?.nextMove || 'Step carefully — consider your most active piece.')
    } catch {
      setHint('Hint unavailable right now.')
    }
  }

  const resetPosition = () => {
    if (selected) loadEndgame(selected)
  }

  return (
    <div className="learning-tool-shell">
      <div className="learning-tool-controls">
        <select
          className="learning-control-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {endgames.length === 0 && <option value="">Loading endgames...</option>}
          {endgames.map((eg) => (
            <option key={eg.id} value={eg.id}>
              {eg.name}
            </option>
          ))}
        </select>
        <button type="button" className="ai-search-btn" onClick={getHint}>Hint</button>
        <button type="button" className="ai-search-btn secondary" onClick={resetPosition}>Reset</button>
      </div>

      <div className="learning-explorer-layout">
        <div>
          <LearningBoard
            fen={fen}
            interactive
            onSquareClick={onSquareClick}
            highlight={hint === 'Solution' ? selected?.startFen : undefined}
          />
          {hint && <div className="learning-hint-text">{hint}</div>}
          {success && (
            <div className="learning-success-banner">Well done! You solved the endgame!</div>
          )}
        </div>
        <div className="learning-analysis-panel">
          <h4>{selected ? `${selected.name}` : 'Endgame Lab'}</h4>
          {selected && <p className="learning-objective-text">{selected.objective}</p>}
          {loading && <div className="learning-dynamic-status">Loading endgames...</div>}
          {!loading && !selected && (
            <div className="learning-dynamic-status">No endgame studies available. Please try again later.</div>
          )}
          {status && !loading && <div className="learning-dynamic-status">{status}</div>}
          {explanation && <AIExplanation explanation={explanation} type="endgame" />}
        </div>
      </div>
    </div>
  )
}

export default EndgameLab
