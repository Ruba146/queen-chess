import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Swords,
  Puzzle,
  Play,
  ChevronRight,
  Crown,
  Flame,
  Target,
  Castle,
  Zap,
  Shield,
  Trophy,
  Bot,
  CheckCircle2,
  Gauge,
} from 'lucide-react'
import PageContainer from '../../components/ui/PageContainer'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import LoadingState from '../../components/common/LoadingState'
import { useApi } from '../../hooks/useApi'
import { quizApi } from '../../services/api'
import QuizPlayer from './QuizPlayer'
import PuzzleGrid from './PuzzleGrid'
import { getCategoryMeta } from './quizPacks'

const CATEGORY_SLUGS = [
  'daily-challenge',
  'openings',
  'middlegame',
  'endgames',
  'tactics',
  'best-move',
  'defensive-move',
  'mate-in-1',
  'mate-in-2',
  'mate-in-3',
  'master-games',
  'survival-mode',
  'ai-challenge',
  'weekly-challenge',
]

const CATEGORY_ICONS = {
  'daily-challenge': Flame,
  'openings': Swords,
  'middlegame': Target,
  'endgames': Castle,
  'tactics': Puzzle,
  'best-move': Zap,
  'defensive-move': Shield,
  'mate-in-1': Crown,
  'mate-in-2': Crown,
  'mate-in-3': Crown,
  'master-games': Trophy,
  'survival-mode': Flame,
  'ai-challenge': Bot,
  'weekly-challenge': Trophy,
}

function Hero({ data, onStartQuiz }) {
  const collections = Array.isArray(data) ? data : []
  const totalSolved = collections.reduce((sum, c) => sum + (c.completedPuzzles || 0), 0)
  const totalPuzzles = collections.reduce((sum, c) => sum + (c.totalPuzzles || 0), 0)
  const avgAccuracy = collections.length > 0
    ? Math.round(collections.reduce((sum, c) => sum + (c.completionPct || 0), 0) / collections.length)
    : 0
  const streak = collections.reduce((max, c) => {
    const s = c.bestStreak || 0
    return s > max ? s : max
  }, 0)

  return (
    <section className="relative overflow-hidden qc-card qc-card-elevated p-5 mb-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border qc-border-accent qc-bg-accent-soft px-2.5 py-1 text-xs font-semibold qc-text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--qc-gold)] shadow-[0_0_6px_var(--qc-gold)]" />
          Puzzle Training
        </div>
        <h1 className="text-xl font-extrabold leading-tight qc-text-primary sm:text-2xl">Train your chess skills.</h1>
        <p className="text-sm leading-relaxed qc-text-secondary">
          Sharpen tactics, master mates, and build pattern recognition across every phase of the game.
        </p>
        <Button size="md" variant="primary" leftIcon={Play} onClick={onStartQuiz}>
          Start Solving
        </Button>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-md border qc-border qc-bg-card-soft px-3 py-1.5">
            <Puzzle className="h-4 w-4 qc-text-gold" aria-hidden="true" />
            <div>
              <div className="text-base font-extrabold leading-tight qc-text-primary">{totalSolved}<span className="qc-text-muted text-sm">/{totalPuzzles}</span></div>
              <div className="text-xs qc-text-muted uppercase tracking-wider">Solved</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border qc-border qc-bg-card-soft px-3 py-1.5">
            <Gauge className="h-4 w-4 qc-text-gold" aria-hidden="true" />
            <div>
              <div className="text-base font-extrabold leading-tight qc-text-primary">{avgAccuracy}%</div>
              <div className="text-xs qc-text-muted uppercase tracking-wider">Accuracy</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border qc-border qc-bg-card-soft px-3 py-1.5">
            <Flame className="h-4 w-4 qc-text-warning" aria-hidden="true" />
            <div>
              <div className="text-base font-extrabold leading-tight qc-text-primary">{streak}</div>
              <div className="text-xs qc-text-muted uppercase tracking-wider">Best Streak</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryGrid({ categories, onSelectCategory }) {
  const counts = useMemo(() => {
    const solved = categories.filter((c) => c.completionPct >= 100).length
    const inProgress = categories.filter((c) => c.completionPct > 0 && c.completionPct < 100).length
    const notStarted = categories.filter((c) => c.completionPct === 0).length
    return { solved, inProgress, notStarted, total: categories.length }
  }, [categories])

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold qc-text-primary">Training Categories</h2>
          <p className="text-xs qc-text-muted">
            {counts.total} categories · {counts.solved} completed · {counts.inProgress} in progress
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => {
          const meta = getCategoryMeta(cat.slug)
          const Icon = CATEGORY_ICONS[cat.slug] || Puzzle
          const progressPct = cat.completionPct ?? 0
          const solvedCount = cat.completedPuzzles ?? 0
          const totalCount = cat.totalPuzzles ?? 0
          const isCompleted = progressPct >= 100
          const isInProgress = progressPct > 0 && progressPct < 100
          const isCurrent = !isCompleted && isInProgress
          const remaining = totalCount - solvedCount

          return (
            <Card
              key={cat.slug}
              hover
              interactive
              className={`p-3 sm:p-3.5 ${isCompleted ? 'qc-border-success' : ''} ${isCurrent ? 'qc-border-accent shadow-glow' : ''}`}
              onClick={() => onSelectCategory(cat.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectCategory(cat.slug)
                }
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md qc-bg-accent-soft">
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 qc-text-success" aria-hidden="true" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 qc-text-gold" aria-hidden="true" />
                  )}
                </div>
                <Badge
                  tone={
                    isCompleted
                      ? 'success'
                      : isCurrent
                        ? 'primary'
                        : meta.tone
                  }
                  size="sm"
                >
                  {isCompleted ? 'Completed' : meta.difficulty}
                </Badge>
              </div>

              <div className="mb-1.5">
                <h3 className="text-sm font-bold qc-text-primary leading-tight">{meta.title}</h3>
                <p className="text-[11px] qc-text-muted leading-snug mt-0.5 line-clamp-2">{meta.description}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] qc-text-muted mb-1.5">
                <span>{solvedCount} / {totalCount} solved</span>
                {remaining > 0 && <span className="h-1 w-1 rounded-full qc-dot-muted" />}
                <span>{remaining} remaining</span>
              </div>

              <div className="h-1 w-full overflow-hidden rounded-full qc-bg-card-soft mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'qc-progress-fill-success' : 'qc-gradient-accent'}`}
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--qc-border)]">
                <div className="flex items-center gap-1.5 text-[11px] qc-text-muted">
                  <Puzzle className="h-3 w-3" aria-hidden="true" />
                  <span>{totalCount} puzzles</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold qc-text-gold">
                  {isCompleted ? 'Replay' : isCurrent ? 'Continue' : 'Open'}
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function Quiz() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const collectionsQuery = useApi(
    useCallback(
      () => quizApi.listCollections(),
      []
    )
  )

  const categoryParam = searchParams.get('category')
  const puzzleIdParam = searchParams.get('puzzle')

  let view = 'home'
  if (categoryParam) {
    view = puzzleIdParam ? 'player' : 'grid'
  }
  const activeCategory = categoryParam

  const handleStartQuiz = useCallback(() => {
    navigate('/quiz')
  }, [navigate])

  const handleSelectCategory = useCallback((slug) => {
    navigate(`/quiz?category=${slug}`)
  }, [navigate])

  const handleSelectPuzzle = useCallback((slug, puzzleId) => {
    navigate(`/quiz?category=${slug}&puzzle=${puzzleId}`)
  }, [navigate])

  const handleBackToGrid = useCallback(() => {
    collectionsQuery.refetch()
    navigate(`/quiz?category=${activeCategory}`)
  }, [navigate, activeCategory, collectionsQuery])

  const handleBackToCategories = useCallback(() => {
    collectionsQuery.refetch()
    navigate('/quiz')
  }, [navigate, collectionsQuery])

  if (collectionsQuery.loading) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <LoadingState label="Loading your puzzle dashboard..." />
      </PageContainer>
    )
  }

  if (collectionsQuery.error) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <div className="py-8 text-center">
          <p className="qc-text-secondary">{collectionsQuery.error.message || 'Failed to load puzzle categories. Please try again.'}</p>
          <Button variant="primary" onClick={handleStartQuiz}>Retry</Button>
        </div>
      </PageContainer>
    )
  }

  if (view === 'player') {
    if (activeCategory !== null) {
      if (puzzleIdParam !== null) {
        return (
          <PageContainer maxWidth="max-w-7xl">
            <QuizPlayer
              category={activeCategory}
              puzzleId={puzzleIdParam}
              onBack={handleBackToGrid}
              onSelectPuzzle={handleSelectPuzzle}
            />
          </PageContainer>
        )
      }
    }
  }

  if (view === 'grid') {
    if (activeCategory !== null) {
      return (
        <PageContainer maxWidth="max-w-7xl">
          <PuzzleGrid
            category={activeCategory}
            onBack={handleBackToCategories}
            onSelectPuzzle={handleSelectPuzzle}
          />
        </PageContainer>
      )
    }
  }

  const collections = collectionsQuery.data || []

  const categories = CATEGORY_SLUGS.map((slug) => {
    const found = collections.find((c) => c.category === slug)
    return {
      slug,
      totalPuzzles: found ? found.totalPuzzles : 0,
      completedPuzzles: found ? found.completedPuzzles : 0,
      completionPct: found ? found.completionPct : 0,
    }
  })

  return (
    <div className="w-full">
      <PageContainer maxWidth="max-w-7xl">
        <Hero data={collectionsQuery.data} onStartQuiz={handleStartQuiz} />
        <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
      </PageContainer>
    </div>
  )
}

export default Quiz
