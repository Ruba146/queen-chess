import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { getBestMove } from '../services/stockfish'
import { analyzePlayerMove, analyzeCurrentPosition } from '../services/liveAnalysisService'
import { detectTactics, detectOpponentThreats } from '../services/tacticalAnalysisService'
import { buildCoachMessage } from '../services/coachService'

const AI_SKILL = { beginner: 0, intermediate: 5, advanced: 10, master: 20 }
const AI_DEPTH = { beginner: 1, intermediate: 3, advanced: 6, master: 14 }

const RANK_NAMES = ['8', '7', '6', '5', '4', '3', '2', '1']
const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function collectCaptured(chess) {
  const capturedByWhite = []
  const capturedByBlack = []
  const history = chess.history({ verbose: true })
  for (const move of history) {
    if (!move.captured) continue
    if (move.color === 'w') capturedByWhite.push({ type: move.captured, color: 'b' })
    else capturedByBlack.push({ type: move.captured, color: 'w' })
  }
  return { capturedByWhite, capturedByBlack }
}

function buildBoard(chess) {
  const board = []
  for (let row = 0; row < 8; row += 1) {
    const rankRow = []
    for (let col = 0; col < 8; col += 1) {
      const square = FILE_NAMES[col] + RANK_NAMES[row]
      const piece = chess.get(square)
      rankRow.push({ square, piece, light: (row + col) % 2 === 0 })
    }
    board.push(rankRow)
  }
  return board
}

function getGameStatus(chess, resignationWinner = null) {
  if (resignationWinner) {
    return {
      label: `${resignationWinner} wins by resignation`,
      winner: resignationWinner,
      over: true,
      outcome: 'resignation',
    }
  }
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'Black' : 'White'
    return { label: `Checkmate — ${winner} wins`, winner, over: true, outcome: 'checkmate' }
  }
  if (chess.isStalemate()) {
    return { label: 'Draw by stalemate', winner: 'draw', over: true, outcome: 'stalemate' }
  }
  if (chess.isThreefoldRepetition()) {
    return { label: 'Draw by repetition', winner: 'draw', over: true, outcome: 'threefold' }
  }
  if (chess.isInsufficientMaterial()) {
    return { label: 'Draw by insufficient material', winner: 'draw', over: true, outcome: 'insufficient' }
  }
  if (chess.isDraw()) {
    return { label: 'Draw', winner: 'draw', over: true, outcome: 'draw' }
  }
  if (chess.isCheck()) {
    return {
      label: `${chess.turn() === 'w' ? 'White' : 'Black'} is in check`,
      winner: null,
      over: false,
      outcome: null,
    }
  }
  return {
    label: `${chess.turn() === 'w' ? 'White' : 'Black'} to move`,
    winner: null,
    over: false,
    outcome: null,
  }
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useChessGame({ playerColor = 'white', difficulty = 'intermediate', initialFen = null }) {
  const chessRef = useRef(null)
  const [board, setBoard] = useState([])
  const [fen, setFen] = useState('')
  const [pgn, setPgn] = useState('')
  const [moves, setMoves] = useState([])
  const [captured, setCaptured] = useState({ capturedByWhite: [], capturedByBlack: [] })
  const [status, setStatus] = useState({ label: 'White to move', winner: null, over: false, outcome: null })
  const [playerClock, setPlayerClock] = useState(0)
  const [aiClock, setAiClock] = useState(0)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [startedAt, setStartedAt] = useState(null)
  const [saveResult, setSaveResult] = useState(null)
  const [error, setError] = useState(null)
  const [hint, setHint] = useState(null)
  const [hintBusy, setHintBusy] = useState(false)

  const [moveAnalysis, setMoveAnalysis] = useState([])
  const [evalHistory, setEvalHistory] = useState([])
  const [lastMoveQuality, setLastMoveQuality] = useState(null)
  const [bestMove, setBestMove] = useState(null)
  const [tactics, setTactics] = useState([])
  const [opponentThreats, setOpponentThreats] = useState([])
  const [coachSections, setCoachSections] = useState([])
  const [liveEval, setLiveEval] = useState('0.0')
  const [livePositionAnalysis, setLivePositionAnalysis] = useState(null)
  const [analysisBusy, setAnalysisBusy] = useState(false)
  const [playerLevel, setPlayerLevel] = useState('Beginner')

  const playerColorRef = useRef(playerColor)
  const difficultyRef = useRef(difficulty)
  const savedRef = useRef(false)
  const resignationRef = useRef(null)

  const updateRefs = useCallback(() => {
    playerColorRef.current = playerColor
    difficultyRef.current = difficulty
  }, [playerColor, difficulty])

  const updateLiveAnalysis = useCallback(async (chess) => {
    setAnalysisBusy(true)
    try {
      const skill = difficultyRef.current ? AI_SKILL[difficultyRef.current] ?? 5 : 5
      const currentAnalysis = await analyzeCurrentPosition(chess, { skill, depth: 12, movetime: 300 })
      setLivePositionAnalysis(currentAnalysis)
      setLiveEval(currentAnalysis.engineEval)

      const evalCp = currentAnalysis.cp ?? 0
      setEvalHistory((prev) => {
        const moveNum = chess.history().length
        if (prev.length > 0 && prev[prev.length - 1].moveNumber === moveNum) {
          return prev
        }
        return [...prev, { moveNumber: moveNum, eval: currentAnalysis.engineEval, cp: evalCp }]
      })

      const tacticsList = detectTactics(chess, playerColorRef.current)
      setTactics(tacticsList)

      const threats = detectOpponentThreats(chess, playerColorRef.current)
      setOpponentThreats(threats)

      const coach = buildCoachMessage(chess, currentAnalysis, playerColorRef.current, playerLevel)
      setCoachSections(coach)

      if (currentAnalysis.bestMoveSan) {
        setBestMove(currentAnalysis.bestMoveSan)
      }
    } catch {
      // silently ignore analysis errors
    } finally {
      setAnalysisBusy(false)
    }
  }, [playerLevel])

  const syncState = useCallback((chess) => {
    setBoard(buildBoard(chess))
    setFen(chess.fen())
    setPgn(chess.pgn())
    setMoves(chess.history())
    setCaptured(collectCaptured(chess))
    setStatus(getGameStatus(chess, resignationRef.current))
    setHint(null)
  }, [])

  const reset = useCallback(() => {
    savedRef.current = false
    setSaveResult(null)
    setError(null)
    setSelectedSquare(null)
    setLegalTargets([])
    setHint(null)
    setPlayerClock(0)
    setAiClock(0)
    setStartedAt(Date.now())
    setMoveAnalysis([])
    setEvalHistory([])
    setLastMoveQuality(null)
    setBestMove(null)
    setTactics([])
    setOpponentThreats([])
    setCoachSections([])
    setLiveEval('0.0')
    setLivePositionAnalysis(null)
    setAnalysisBusy(false)
    setPlayerLevel('Beginner')
    resignationRef.current = null
    const chess = initialFen ? new Chess(initialFen) : new Chess()
    chessRef.current = chess
    syncState(chess)
  }, [initialFen, syncState])

  useEffect(() => {
    updateRefs()
  }, [updateRefs])

  const analyzeLastPlayerMove = useCallback(async (chessBefore, moveSan) => {
    const analysis = await analyzePlayerMove(chessBefore, moveSan, playerColorRef.current, {
      skill: difficultyRef.current ? AI_SKILL[difficultyRef.current] ?? 5 : 5,
      depth: 12,
      movetime: 300,
    })
    if (!analysis) return

    setLastMoveQuality(analysis.quality)
    setBestMove(analysis.bestMoveSan)

    setMoveAnalysis((prev) => {
      const next = [...prev, analysis]
      return next
    })
  }, [])

  // AI move scheduling
  useEffect(() => {
    let cancelled = false
    const chess = chessRef.current
    if (!chess || startedAt === null) return undefined
    if (getGameStatus(chess).over) return undefined
    const aiColor = playerColorRef.current === 'white' ? 'b' : 'w'
    if (chess.turn() !== aiColor) return undefined

    setIsAiThinking(true)
    const skill = difficultyRef.current ? AI_SKILL[difficultyRef.current] ?? 5 : 5
    const depth = difficultyRef.current ? AI_DEPTH[difficultyRef.current] ?? 3 : 3

    getBestMove(chess.fen(), { skill, depth, movetime: 600 })
      .then((bestMove) => {
        if (cancelled) return
        const current = chessRef.current
        if (!current || getGameStatus(current).over) return
        if (bestMove && bestMove.length >= 4) {
          const from = bestMove.slice(0, 2)
          const to = bestMove.slice(2, 4)
          let moveResult = current.move({ from, to, promotion: 'q' })
          if (!moveResult) {
            const legal = current.moves({ verbose: true })
            if (legal.length > 0) {
              const m = legal[Math.floor(Math.random() * legal.length)]
              moveResult = current.move(m)
            }
          }
          if (moveResult) {
            syncState(current)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsAiThinking(false)
      })

    return () => { cancelled = true }
  }, [fen, startedAt, syncState])

  // Live analysis after state changes
  useEffect(() => {
    if (!startedAt) return
    const chess = chessRef.current
    if (!chess || getGameStatus(chess).over) return
    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      await updateLiveAnalysis(chess)
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fen, startedAt, updateLiveAnalysis])

  const makeMove = useCallback(
    (from, to) => {
      const chess = chessRef.current
      if (!chess || getGameStatus(chess).over) return false
      const humanColor = playerColorRef.current === 'white' ? 'w' : 'b'
      if (chess.turn() !== humanColor) return false

      const fenBefore = chess.fen()
      try {
        const move = chess.move({ from, to, promotion: 'q' })
        if (!move) return false

        const chessBefore = new Chess(fenBefore)
        const moveUci = move.from + move.to + (move.promotion ? move.promotion : '')
        analyzeLastPlayerMove(chessBefore, moveUci)

        syncState(chess)
        setSelectedSquare(null)
        setLegalTargets([])
        return true
      } catch {
        return false
      }
    },
    [syncState, analyzeLastPlayerMove],
  )

  const onSquareClick = useCallback(
    (square) => {
      const chess = chessRef.current
      if (!chess || getGameStatus(chess).over) return
      const humanColor = playerColorRef.current === 'white' ? 'w' : 'b'
      if (chess.turn() !== humanColor) return
      const piece = chess.get(square)
      if (selectedSquare && square !== selectedSquare) {
        const moved = makeMove(selectedSquare, square)
        if (moved) return
      }
      if (!piece || piece.color !== humanColor) {
        setSelectedSquare(null)
        setLegalTargets([])
        return
      }
      setSelectedSquare(square)
      const targets = chess.moves({ square, verbose: true }).map((m) => m.to)
      setLegalTargets(targets)
    },
    [selectedSquare, makeMove],
  )

  const resign = useCallback(() => {
    const chess = chessRef.current
    if (!chess || getGameStatus(chess, resignationRef.current).over) return
    const winner = playerColorRef.current === 'white' ? 'Black' : 'White'
    resignationRef.current = winner
    setStatus(getGameStatus(chess, winner))
  }, [])

  const undo = useCallback(() => {
    const chess = chessRef.current
    if (!chess || getGameStatus(chess).over) return
    chess.undo()
    if (chess.history().length > 0) chess.undo()
    syncState(chess)
    setSelectedSquare(null)
    setLegalTargets([])
    setMoveAnalysis((prev) => prev.slice(0, -1))
  }, [syncState])

  const durationSeconds = useCallback(() => {
    if (!startedAt) return 0
    return Math.floor((Date.now() - startedAt) / 1000)
  }, [startedAt])

  const getHint = useCallback(async () => {
    const chess = chessRef.current
    if (!chess || getGameStatus(chess).over) return null
    if (hintBusy) return null
    setHintBusy(true)
    setHint(null)
    const skill = difficultyRef.current ? AI_SKILL[difficultyRef.current] ?? 5 : 5
    try {
      const bestRaw = await getBestMove(chess.fen(), { skill, depth: 12, movetime: 800 })
      if (!bestRaw || bestRaw.length < 4) return null
      const from = bestRaw.slice(0, 2)
      const to = bestRaw.slice(2, 4)
      const move = chess.move({ from, to, promotion: 'q' })
      if (!move) return null
      chess.undo()
      const san = move.san + (move.isCheck ? '+' : '')
      setHint(san)
      return san
    } catch {
      return null
    } finally {
      setHintBusy(false)
    }
  }, [difficultyRef, hintBusy])

  return {
    board,
    fen,
    pgn,
    moves,
    captured,
    status,
    playerClock,
    aiClock,
    isAiThinking,
    selectedSquare,
    legalTargets,
    hint,
    hintBusy,
    reset,
    makeMove,
    onSquareClick,
    resign,
    undo,
    getHint,
    durationSeconds,
    formatClock,
    playerColor,
    saveResult,
    setSaveResult,
    error,
    setError,
    moveAnalysis,
    evalHistory,
    lastMoveQuality,
    bestMove,
    tactics,
    opponentThreats,
    coachSections,
    liveEval,
    livePositionAnalysis,
    analysisBusy,
    playerLevel,
    setPlayerLevel,
  }
}

export default useChessGame
