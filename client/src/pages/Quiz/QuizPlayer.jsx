import { useState, useEffect, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import LearningBoard from '../Learning/LearningBoard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/common/LoadingState'
import { getBestMove } from '../../services/stockfish'
import { quizApi } from '../../services/api'
import {
  Lightbulb,
  ArrowRight,
  RotateCcw,
  SkipForward,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { getCategoryMeta } from './quizPacks'

const MAX_ATTEMPTS = 3
const PUZZLES_PER_CATEGORY = 20

function PuzzlePlayer({ category, puzzleId, onBack, onSelectPuzzle, onResetProgress, resetting }) {
  const [puzzles, setPuzzles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [chessFen, setChessFen] = useState('')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [status, setStatus] = useState('idle')
  const [attempt, setAttempt] = useState(0)
  const [explanation, setExplanation] = useState(null)
  const [hintBusy, setHintBusy] = useState(false)
  const [hintMove, setHintMove] = useState(null)
  const [lastMove, setLastMove] = useState(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [sessionXp, setSessionXp] = useState(0)
  const [packCompleted, setPackCompleted] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [historicalAccuracy, setHistoricalAccuracy] = useState(null)
  const [userSide, setUserSide] = useState('white')

  const chessRef = useRef(null)
  const timersRef = useRef([])
  const loadingMoreRef = useRef(false)

  const meta = getCategoryMeta(category)
  const currentPuzzle = puzzles[currentIndex] || null
  const totalPuzzles = puzzles.length || PUZZLES_PER_CATEGORY
  const accuracy = historicalAccuracy != null ? historicalAccuracy : (totalPuzzles > 0 ? Math.round((completedCount / totalPuzzles) * 100) : 0)
  const progress = ((currentIndex) / Math.max(totalPuzzles, 1)) * 100

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }, [])

  const loadPuzzles = useCallback(async () => {
    setLoading(true)
    setError('')
    setPackCompleted(false)
    setCompletedCount(0)
    setSessionXp(0)
    setHistoricalAccuracy(null)
    setUserSide('white')
    try {
      const [puzzlesData, progressData] = await Promise.all([
        quizApi.getCategoryPuzzles({ category, count: PUZZLES_PER_CATEGORY }) || [],
        quizApi.getCategoryProgress({ category }) || {},
      ])
      const list = puzzlesData.map((p) => ({
        id: p.id,
        fen: p.fen,
        solution: p.solution || [],
        goal: p.goal || 'Find the best move',
        rating: p.rating,
        theme: p.theme,
        completed: p.completed === true,
        attempts: p.attempts || 0,
      }))
      setPuzzles(list)
      setHistoricalAccuracy(progressData.accuracy ?? null)

      if (puzzleId) {
        const idx = list.findIndex((p) => p.id === puzzleId)
        if (idx !== -1 && list[idx].completed !== true) {
          setCurrentIndex(idx)
        } else if (list.length > 0) {
          const firstUnsolved = list.findIndex((p) => p.completed !== true)
          setCurrentIndex(firstUnsolved === -1 ? list.length - 1 : firstUnsolved)
        }
      } else {
        const firstUnsolved = list.findIndex((p) => p.completed !== true)
        if (firstUnsolved === -1) {
          setPackCompleted(true)
        } else {
          setCurrentIndex(firstUnsolved)
        }
      }
    } catch {
      setError('Could not load puzzles. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [category, puzzleId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPuzzles()
  }, [loadPuzzles])

  useEffect(() => {
    if (puzzles.length === 0) return
    if (currentIndex >= puzzles.length) return
    const p = puzzles[currentIndex]
    if (p === null || p === undefined) return
    if (!p.fen) return
    try {
      const c = new Chess(p.fen)
      chessRef.current = c
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChessFen(c.fen())
      const turn = c.turn()
      setUserSide(turn === 'w' ? 'white' : 'black')
      setStatus('playing')
      setAttempt(0)
      setSelectedSquare(null)
      setLegalTargets([])
      setHintMove(null)
      setLastMove(null)
      setFeedback('')
      setExplanation(null)
    } catch {
      setError('Invalid puzzle position.')
    }
  }, [puzzles, currentIndex])

  const advanceToNext = useCallback(async (prevIndex) => {
    const nextInBatch = puzzles.findIndex((p, i) => i > prevIndex && p.completed !== true)
    if (nextInBatch !== -1) {
      setCurrentIndex(nextInBatch)
      return true
    }

    if (loadingMoreRef.current) return false
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const next = await quizApi.getNextPuzzle({ category })
      if (next && next.puzzle) {
        const newPuzzle = {
          id: next.puzzle.id,
          fen: next.puzzle.fen,
          solution: next.puzzle.solution || [],
          goal: next.puzzle.goal || 'Find the best move',
          rating: next.puzzle.rating,
          theme: next.puzzle.theme,
          completed: false,
          attempts: 0,
        }
        setPuzzles((prev) => [...prev, newPuzzle])
        setCurrentIndex(puzzles.length)
        return true
      }
      setPackCompleted(true)
      return false
    } catch {
      setPackCompleted(true)
      return false
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [puzzles, category])

  const handleSquareClick = useCallback((square) => {
    const chess = chessRef.current
    if (!chess || status !== 'playing') return

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null)
        setLegalTargets([])
        return
      }

      const move = chess.move({ from: selectedSquare, to: square, promotion: 'q' })
      if (!move) {
        const piece = chess.get(square)
        const isPieceTurn = piece !== null ? piece.color === chess.turn() : false
        if (isPieceTurn) {
          const targets = chess.moves({ square, verbose: true }).map((m) => m.to)
          setSelectedSquare(square)
          setLegalTargets(targets)
        } else {
          setSelectedSquare(null)
          setLegalTargets([])
        }
        return
      }

      const cleanSan = move.san.replace(/[+#]/g, '').trim()
      const expected = currentPuzzle.solution?.[0]
      const cleanExpected = expected ? expected.replace(/[+#]/g, '').trim() : null
      const moveUci = move.from + move.to
      const isCorrect = cleanExpected !== null ? (cleanSan === cleanExpected || moveUci === expected) : false

      if (isCorrect) {
        setStatus('correct')
        setLastMove({ from: move.from, to: move.to })
        setSelectedSquare(null)
        setLegalTargets([])
        setFeedback('Excellent! Correct move.')
        setCompletedCount((c) => c + 1)

        quizApi.submitAnswer({
          category,
          puzzleId: currentPuzzle.id,
          move: cleanSan,
          attempts: 1,
        }).then((data) => {
          if (data?.xp?.xpEarned) {
            setSessionXp((s) => s + data.xp.xpEarned)
          }
          if (data?.progress?.completedPuzzles != null) {
            setCompletedCount(data.progress.completedPuzzles)
          }
        }).catch(() => {
        })

        const timer = setTimeout(() => {
          setCurrentIndex((prev) => {
            advanceToNext(prev)
            return prev
          })
        }, 2000)
        timersRef.current.push(timer)
      } else {
        setAttempt((a) => a + 1)
        setStatus('incorrect')
        setFeedback('Not quite. Try again.')
        chess.undo()
        setChessFen(chess.fen())
        setLastMove(null)
        setSelectedSquare(null)
        setLegalTargets([])

        quizApi.submitAnswer({
          category,
          puzzleId: currentPuzzle.id,
          move: cleanSan,
          attempts: 1,
        }).catch(() => {
        })

        if (attempt + 1 >= MAX_ATTEMPTS) {
          setFeedback('Maximum attempts reached. Loading next puzzle...')
          const timer = setTimeout(() => {
            setCurrentIndex((prev) => {
              advanceToNext(prev)
              return prev
            })
          }, 4000)
          timersRef.current.push(timer)
        }
      }
    } else {
      const piece = chess.get(square)
      const isPieceTurn = piece !== null ? piece.color === chess.turn() : false
      if (isPieceTurn) {
        const targets = chess.moves({ square, verbose: true }).map((m) => m.to)
        setSelectedSquare(square)
        setLegalTargets(targets)
      }
    }
  }, [status, currentPuzzle, attempt, selectedSquare, category, advanceToNext])

  const handleHint = useCallback(async () => {
    const chess = chessRef.current
    if (!currentPuzzle || hintBusy || !chess) return
    setHintBusy(true)
    setHintMove(null)
    try {
      const bestRaw = await getBestMove(chess.fen(), { skill: 5, depth: 12, movetime: 800 })
      if (!bestRaw || bestRaw.length < 4) {
        setHintMove(null)
      } else {
        const from = bestRaw.slice(0, 2)
        const to = bestRaw.slice(2, 4)
        setHintMove({ from, to })
      }
    } catch {
      setHintMove(null)
    } finally {
      setHintBusy(false)
    }
  }, [currentPuzzle, hintBusy])

  const handleSkip = useCallback(() => {
    clearTimers()
    quizApi.submitAnswer({
      category,
      puzzleId: currentPuzzle.id,
      move: 'skip',
      attempts: MAX_ATTEMPTS,
    }).catch(() => {
    })
    setCurrentIndex((prev) => {
      advanceToNext(prev)
      return prev
    })
  }, [clearTimers, currentPuzzle, category, advanceToNext])

  const handleRetry = useCallback(() => {
    clearTimers()
    if (!currentPuzzle) return
    try {
      const c = new Chess(currentPuzzle.fen)
      chessRef.current = c
      setChessFen(c.fen())
      const turn = c.turn()
      setUserSide(turn === 'w' ? 'white' : 'black')
      setAttempt(0)
      setStatus('playing')
      setFeedback('')
      setHintMove(null)
      setLastMove(null)
      setSelectedSquare(null)
      setLegalTargets([])
    } catch {
      void 0
    }
  }, [currentPuzzle, clearTimers])

  const handleNextPuzzle = useCallback(() => {
    clearTimers()
    setCurrentIndex((prev) => {
      advanceToNext(prev)
      return prev
    })
  }, [clearTimers, advanceToNext])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  if (loading && puzzles.length === 0) {
    return <LoadingState label="Loading puzzles..." />
  }

  if (error !== '' && puzzles.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="qc-text-secondary">{error}</p>
      </div>
    )
  }

  if (puzzles.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="qc-text-secondary">No puzzles available in this category.</p>
        <Button variant="primary" onClick={onBack}>Back to Categories</Button>
      </div>
    )
  }

  if (packCompleted) {
    const total = puzzles.length
    const accuracyVal = historicalAccuracy != null ? historicalAccuracy : (total > 0 ? Math.round((completedCount / total) * 100) : 0)
    const xpEarnedTotal = sessionXp

    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
          <span className="text-5xl" aria-hidden="true">🏆</span>
          <h2 className="text-2xl font-extrabold qc-text-primary sm:text-3xl">Category Complete!</h2>
          <p className="text-base qc-text-secondary">{meta.title}</p>
          <div className="grid grid-cols-3 gap-4 sm:gap-5">
            <div className="rounded-lg border qc-border qc-bg-card p-4 text-center">
              <div className="text-2xl font-extrabold qc-text-gold">+{xpEarnedTotal}</div>
              <div className="text-xs qc-text-muted uppercase tracking-wider">XP Earned</div>
            </div>
            <div className="rounded-lg border qc-border qc-bg-card p-4 text-center">
              <div className="text-2xl font-extrabold qc-text-success">{accuracyVal}%</div>
              <div className="text-xs qc-text-muted uppercase tracking-wider">Accuracy</div>
            </div>
            <div className="rounded-lg border qc-border qc-bg-card p-4 text-center">
              <div className="text-2xl font-extrabold qc-text-primary">{completedCount}</div>
              <div className="text-xs qc-text-muted uppercase tracking-wider">Solved</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={() => onSelectPuzzle(category, puzzles[0]?.id)}>
              Replay First Puzzle
            </Button>
            {onResetProgress && (
              <Button variant="secondary" leftIcon={RotateCcw} onClick={onResetProgress} disabled={resetting}>
                {resetting ? 'Resetting...' : 'Reset Progress'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isPlaying = status === 'playing'
  const isCorrect = status === 'correct'
  const isIncorrect = status === 'incorrect'
  const canRetry = isIncorrect === true ? (attempt < MAX_ATTEMPTS ? true : false) : false
  const canNext = isCorrect === true ? true : (isIncorrect === true ? (attempt >= MAX_ATTEMPTS ? true : false) : false)

  const turnLabel = userSide === 'white' ? 'White' : 'Black'
  const turnSymbol = userSide === 'white' ? '♔' : '♚'
  const objectiveLabel = currentPuzzle?.goal || 'Find the best move'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-1.5 text-sm font-medium qc-text-muted hover:qc-text-primary transition-colors" onClick={onBack} type="button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Training
          </button>
          <span className="hidden sm:block h-4 w-px qc-bg-divider" aria-hidden="true" />
          <Badge tone={meta.tone} size="sm">{meta.title}</Badge>
          <span className="text-sm qc-text-muted">
            Puzzle {currentIndex + 1}<span className="qc-text-muted">/{totalPuzzles}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-extrabold qc-text-success">{accuracy}%</div>
            <div className="text-xs qc-text-muted uppercase tracking-wider">Accuracy</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold qc-text-gold">{sessionXp}</div>
            <div className="text-xs qc-text-muted uppercase tracking-wider">XP</div>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full qc-bg-card-soft">
        <div
          className="h-full rounded-full qc-gradient-accent transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,600px)_1fr]">
        <div className="relative w-full max-w-[600px] mx-auto lg:mx-0">
          <div className="rounded-lg overflow-hidden border qc-border qc-bg-card aspect-square shadow-lg">
            <LearningBoard
              fen={chessFen}
              interactive
              onSquareClick={handleSquareClick}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMove={lastMove}
              highlight={hintMove ? hintMove.to : null}
              flipped={userSide === 'black'}
              key={currentPuzzle ? currentPuzzle.id + '-' + currentIndex : currentIndex}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border qc-border qc-bg-card p-3">
            <div className={`h-2.5 w-2.5 rounded-full ${userSide === 'white' ? 'qc-bg-white qc-border qc-border-strong' : 'qc-bg-surface qc-border-muted'}`} aria-hidden="true" />
            <div>
              <div className="text-sm font-bold qc-text-primary uppercase tracking-wider">{turnSymbol} Your Move — {turnLabel}</div>
              <div className="text-xs qc-text-muted">{userSide === 'white' ? 'White' : 'Black'} to move</div>
            </div>
          </div>

          <div className="rounded-lg border qc-border qc-bg-card p-3">
            <div className="text-[10px] font-bold qc-text-gold uppercase tracking-wider mb-1">Objective</div>
            <div className="text-base font-bold qc-text-primary leading-tight">{objectiveLabel}</div>
            {currentPuzzle?.rating ? (
              <div className="text-sm qc-text-muted mt-1">Rating {currentPuzzle.rating} · {meta.difficulty}</div>
            ) : null}
          </div>

          {feedback && (
            <div className={`rounded-md p-3 text-sm font-semibold ${isCorrect ? 'qc-bg-success-soft qc-border-success qc-text-success' : isIncorrect ? 'qc-bg-error-soft qc-border-error qc-text-error' : 'qc-bg-accent-soft qc-border-accent qc-text-gold-light'}`}>
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 qc-text-success" aria-hidden="true" />
                ) : isIncorrect ? (
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0 qc-text-error" aria-hidden="true" />
                ) : (
                  <HelpCircle className="h-4 w-4 mt-0.5 shrink-0 qc-text-gold" aria-hidden="true" />
                )}
                <span>{feedback}</span>
              </div>
              {loadingMore && <span className="ml-4 text-xs qc-text-muted opacity-75">Loading next puzzle...</span>}
            </div>
          )}

          {hintMove && (
            <div className="rounded-md border qc-border-warning qc-bg-warning-soft p-3 text-sm qc-text-warning">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 qc-text-warning" aria-hidden="true" />
                <span>Try moving from <strong>{hintMove.from}</strong> to <strong>{hintMove.to}</strong></span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {isPlaying && (
              <>
                <Button variant="secondary" size="sm" leftIcon={Lightbulb} onClick={handleHint} disabled={hintBusy}>
                  {hintBusy ? 'Thinking...' : 'Hint'}
                </Button>
                <Button variant="ghost" size="sm" leftIcon={SkipForward} onClick={handleSkip}>
                  Skip
                </Button>
                <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={handleRetry}>
                  Reset
                </Button>
              </>
            )}
            {canNext && (
              <Button variant="primary" size="sm" leftIcon={ArrowRight} onClick={handleNextPuzzle} disabled={loadingMore}>
                Next Puzzle
              </Button>
            )}
            {canRetry && (
              <Button variant="secondary" size="sm" leftIcon={RotateCcw} onClick={handleRetry}>
                Retry
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm qc-text-muted">
            <span>Attempts</span>
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < attempt ? 'qc-progress-dot-failed' : 'qc-progress-dot-muted'}`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span>{attempt}/{MAX_ATTEMPTS}</span>
          </div>

          {explanation && (
            <div className="mt-1 rounded-lg qc-border qc-bg-surface p-3">
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PuzzlePlayer
