import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  RotateCcw,
  Check,
  ChevronRight,
  Play,
  Lock,
} from 'lucide-react'
import PageContainer from '../../components/ui/PageContainer'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/common/LoadingState'
import { quizApi } from '../../services/api'
import { getCategoryMeta } from './quizPacks'

const PUZZLES_PER_CATEGORY = 20

function PuzzleGrid({ category, onBack, onSelectPuzzle }) {
  const [puzzles, setPuzzles] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState(false)

  const meta = getCategoryMeta(category)

  const loadPuzzles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const puzzlesData = await quizApi.getCategoryPuzzles({ category, count: PUZZLES_PER_CATEGORY }) || []
      setPuzzles(puzzlesData)

      const progressData = await quizApi.getCategoryProgress({ category }) || {}
      setProgress(progressData)
    } catch {
      setError('Could not load puzzles. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPuzzles()
  }, [loadPuzzles])

  const completedCount = puzzles.filter((p) => p.completed === true).length
  const totalCount = puzzles.length || PUZZLES_PER_CATEGORY
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const firstUnsolvedIndex = puzzles.findIndex((p) => p.completed !== true)
  const currentPuzzleIndex = firstUnsolvedIndex === -1 ? totalCount - 1 : firstUnsolvedIndex
  const bestStreak = progress?.bestStreak ?? 0
  const accuracy = progress?.accuracy ?? 0
  const allCompleted = completionPct >= 100

  const getPuzzleStatus = (puzzle, index) => {
    if (puzzle.completed === true) return 'solved'
    if (index === currentPuzzleIndex) return 'current'
    return 'locked'
  }

  const handleResetProgress = async () => {
    setResetting(true)
    try {
      await quizApi.resetCategory({ category })
      await loadPuzzles()
    } catch {
      setError('Could not reset progress. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <LoadingState label="Loading puzzles..." />
      </PageContainer>
    )
  }

  if (error !== '' && puzzles.length === 0) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <div className="py-8 text-center">
          <p className="qc-text-secondary">{error}</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="max-w-7xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <button className="inline-flex items-center gap-1 text-xs font-medium qc-text-muted hover:qc-text-primary transition-colors" onClick={onBack} type="button">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Training
            </button>
            <h1 className="text-base font-extrabold qc-text-primary">{meta.title}</h1>
            <p className="text-[11px] qc-text-muted">{meta.description}</p>
          </div>
          <div>
            <Button variant="secondary" size="sm" leftIcon={RotateCcw} onClick={handleResetProgress} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset Progress'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border qc-border qc-bg-card p-3 text-center">
            <div className="text-lg font-extrabold qc-text-primary">{totalCount}</div>
            <div className="text-xs qc-text-muted uppercase tracking-wider">Puzzles</div>
          </div>
          <div className="rounded-lg border qc-border qc-bg-card p-3 text-center">
            <div className="text-lg font-extrabold qc-text-success">{completedCount}</div>
            <div className="text-xs qc-text-muted uppercase tracking-wider">Solved</div>
          </div>
          <div className="rounded-lg border qc-border qc-bg-card p-3 text-center">
            <div className="text-lg font-extrabold qc-text-warning">{bestStreak}</div>
            <div className="text-xs qc-text-muted uppercase tracking-wider">Best Streak</div>
          </div>
          <div className="rounded-lg border qc-border qc-bg-card p-3 text-center">
            <div className="text-lg font-extrabold qc-text-gold">{accuracy}%</div>
            <div className="text-xs qc-text-muted uppercase tracking-wider">Accuracy</div>
          </div>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full qc-bg-card-soft">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allCompleted ? 'qc-progress-fill-success' : 'qc-progress-fill'}`}
            style={{ width: `${Math.min(completionPct, 100)}%` }}
          />
        </div>

        {allCompleted ? (
          <Card className="p-6 text-center sm:p-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
              <div className="text-4xl">🏆</div>
              <h2 className="text-xl font-extrabold qc-text-primary sm:text-2xl">Category Complete!</h2>
              <p className="qc-text-secondary">You have solved all puzzles in {meta.title}.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" onClick={() => onSelectPuzzle(category, puzzles[0]?.id)}>
                  Replay First Puzzle
                </Button>
                <Button variant="secondary" leftIcon={RotateCcw} onClick={handleResetProgress} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset Progress'}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {puzzles.map((puzzle, index) => {
              const status = getPuzzleStatus(puzzle, index)
              const isSolved = status === 'solved'
              const isCurrent = status === 'current'
              const isLocked = status === 'locked'

              return (
                <div
                  key={puzzle.id || index}
                  className={`flex flex-col gap-2 rounded-lg border qc-border qc-bg-card p-3 transition-all duration-200 ${isSolved ? 'qc-border-success' : ''} ${isCurrent ? 'qc-border-accent shadow-glow' : ''} ${isLocked ? 'opacity-50' : 'cursor-pointer qc-hover-border-strong'}`}
                  onClick={() => {
                    if (!isLocked) {
                      onSelectPuzzle(category, puzzle.id)
                    }
                  }}
                  role="button"
                  tabIndex={isLocked ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onSelectPuzzle(category, puzzle.id)
                    }
                  }}
                >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md qc-bg-accent-soft">
                  {isSolved ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 qc-text-success" aria-hidden="true" />
                  ) : isCurrent ? (
                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 qc-text-gold" aria-hidden="true" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 qc-text-muted" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {puzzle.rating ? (
                    <span className="text-xs qc-text-muted">Rating {puzzle.rating}</span>
                  ) : null}
                  <Badge tone={isSolved ? 'success' : isCurrent ? 'primary' : 'neutral'} size="xs">
                    {isSolved ? 'Solved' : isCurrent ? 'Current' : 'Locked'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm sm:text-base font-semibold qc-text-primary">Puzzle {index + 1}</p>
                <p className="text-xs sm:text-sm qc-text-muted leading-snug mt-0.5 line-clamp-2">{puzzle.goal || 'Find the best move'}</p>
              </div>

                  {puzzle.theme ? (
                    <Badge tone="neutral" size="xs">{puzzle.theme}</Badge>
                  ) : null}

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--qc-border)] mt-auto">
                    {isSolved ? (
                      <>
                        <span className="text-[10px] font-semibold qc-text-success">Solved</span>
                        <span className="text-[10px] qc-text-muted">{puzzle.attempts || 1} {puzzle.attempts === 1 ? 'attempt' : 'attempts'}</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <span className="text-[10px] font-semibold qc-text-gold">Current</span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold qc-text-gold">
                          Continue <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold qc-text-muted">Locked</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export default PuzzleGrid
