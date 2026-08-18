import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import learningApi from './learningApi'
import LearningBoard, { safeChess } from './LearningBoard'
import LearningBadges from './LearningBadges'
import AIExplanation from './AIExplanation'

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function chessFromMoves(moves) {
  const chess = new Chess()
  for (let i = 0; i < moves.length; i += 1) {
    try {
      chess.move(moves[i])
    } catch {
      // skip invalid moves
    }
  }
  return chess
}

function OpeningExplorer() {
  const [openings, setOpenings] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('Loading openings...')
  const [explanation, setExplanation] = useState(null)

  const chessRef = useRef(safeChess())
  const [fen, setFen] = useState(DEFAULT_FEN)
  const [movesList, setMovesList] = useState([])
  const [ply, setPly] = useState(0)

  const selected = openings.find((o) => o.id === selectedId) || null

  const loadOpening = useCallback(async (opening) => {
    if (!opening) return
    const moves = opening.moves || []
    const chess = chessFromMoves(moves)
    chessRef.current = chess
    setFen(chess.fen())
    setMovesList(moves)
    setPly(0)
    setExplanation(null)
    setStatus('Generating AI explanation...')

    try {
      const exp = await learningApi.explainOpening({
        name: opening.name,
        eco: opening.eco,
        category: opening.category,
        difficulty: opening.difficulty,
        moves,
        fen: opening.fen || chess.fen(),
      })
      setExplanation(exp)
      setStatus('')
    } catch {
      setExplanation(null)
      setStatus('AI explanation is temporarily unavailable.')
    }
  }, [])

  const loadOpenings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await learningApi.exploreOpenings()
      const list = Array.isArray(data) ? data : []
      setOpenings(list)
      if (list.length > 0) {
        setSelectedId(list[0].id)
      } else {
        setStatus('No openings available yet. Try again later.')
      }
    } catch {
      setStatus('Could not load openings from AI. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOpenings()
  }, [loadOpenings])

  useEffect(() => {
    if (selectedId) {
      const op = openings.find((o) => o.id === selectedId)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (op) loadOpening(op)
    }
  }, [selectedId, openings, loadOpening])

  const movePrefix = movesList.slice(0, ply)

  const applyPly = (targetPly) => {
    const chess = chessFromMoves(movesList.slice(0, targetPly))
    chessRef.current = chess
    setFen(chess.fen())
    setPly(targetPly)
  }

  const nextMove = () => {
    if (ply >= movesList.length) return
    applyPly(ply + 1)
  }
  const prevMove = () => {
    if (ply <= 0) return
    applyPly(ply - 1)
  }
  const reset = () => applyPly(0)

  const filtered = openings.filter((o) => {
    if (category !== 'All' && o.category !== category) return false
    if (difficulty !== 'All' && o.difficulty !== difficulty) return false
    if (search && !`${o.name} ${o.eco} ${o.category}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categories = ['All', ...new Set(openings.map((o) => o.category).filter(Boolean))]
  const difficulties = ['All', ...new Set(openings.map((o) => o.difficulty).filter(Boolean))]

  return (
    <div className="learning-tool-shell">
      <div className="learning-tool-controls">
        <select
          className="learning-control-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {openings.length === 0 && <option value="">Loading openings...</option>}
          {filtered.map((o) => (
            <option key={o.id} value={o.id}>
              {o.eco || 'AI'} - {o.name}
            </option>
          ))}
        </select>
        <input
          className="learning-control-input"
          type="search"
          placeholder="Search openings, ECO, category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="learning-control-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className="learning-control-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="learning-explorer-layout">
        <div>
          <LearningBoard fen={fen} />
          <div className="learning-board-actions">
            <button type="button" onClick={prevMove}>Previous</button>
            <button type="button" onClick={nextMove}>Next</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
          <div className="learning-move-strip">
            {movePrefix.map((m, i) => (
              <span key={i} className={`learning-move-pill ${i % 2 === 0 ? 'active' : ''}`}>
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="learning-analysis-panel">
          <h4>{selected ? `${selected.name}` : 'Opening Explorer'}</h4>
          {selected && (
            <LearningBadges
              badges={[selected.category, selected.difficulty, `${selected.moves?.length || 0} plies`]}
            />
          )}
          {loading && <div className="learning-dynamic-status">Loading openings...</div>}
          {!loading && !selected && (
            <div className="learning-dynamic-status">No openings available. Please try again later.</div>
          )}
          {status && !loading && <div className="learning-dynamic-status">{status}</div>}
          {explanation && <AIExplanation explanation={explanation} type="opening" />}
        </div>
      </div>
    </div>
  )
}

export default OpeningExplorer
