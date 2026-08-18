import { useNavigate } from 'react-router-dom'
import { useCallback, useMemo, useState, useEffect } from 'react'
import React from 'react'
import {
  Sparkles,
  Target,
  Trophy,
  Gauge,
  TrendingUp,
  Bot,
  BookOpen,
  Swords,
  Puzzle,
  Crown,
  ChevronRight,
  Flame,
  Zap,
  Clock,
  Brain,
  Play,
  ArrowRight,
  Check,
} from 'lucide-react'
import { Chess } from 'chess.js'
import PageContainer from '../../components/ui/PageContainer'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import SectionTitle from '../../components/ui/SectionTitle'
import LoadingState from '../../components/common/LoadingState'
import Modal from '../../components/common/Modal'
import { useApi } from '../../hooks/useApi'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { learningApi } from '../../services/api'
import AICoach from './AICoach'
import AIChessCoach from './AIChessCoach'
import OpeningSearch from './OpeningSearch'
import OpeningExplorer from './OpeningExplorer'
import EndgameLab from './EndgameLab'
import TacticsTrainer from './TacticsTrainer'
import PuzzleTrainer from './PuzzleTrainer'
import LearningPath from './LearningPath'
import MasterGames from './MasterGames'
import LearningBoard from './LearningBoard'

const PIECES = [
  { icon: '♔', name: 'King', move: 'Moves one square in any direction. The most important piece — if your king is checkmated, you lose.' },
  { icon: '♕', name: 'Queen', move: 'Moves any number of squares in any direction. The most powerful piece on the board.' },
  { icon: '♖', name: 'Rook', move: 'Moves any number of squares horizontally or vertically. Powerful on open files and ranks.' },
  { icon: '♗', name: 'Bishop', move: 'Moves any number of squares diagonally. Each bishop stays on its starting color forever.' },
  { icon: '♘', name: 'Knight', move: 'Moves in an L-shape: two squares in one direction, then one square perpendicular. Can jump over other pieces.' },
  { icon: '♙', name: 'Pawn', move: 'Moves one square forward (or two on its first move). Captures diagonally forward. Can promote upon reaching the last rank.' },
]

const RULES = [
  { icon: '🎯', title: 'Check', desc: "When your king is under attack by an opponent's piece. You must respond immediately." },
  { icon: '💀', title: 'Checkmate', desc: 'When your king is in check and there is no legal move to escape. The game ends.' },
  { icon: '🤝', title: 'Stalemate', desc: 'When the player to move has no legal moves but their king is NOT in check. The game ends in a draw.' },
  { icon: '🏰', title: 'Castling', desc: 'A special move involving the king and a rook. The king moves two squares toward the rook, and the rook jumps over.' },
  { icon: '🔄', title: 'En Passant', desc: "A special pawn capture. When an opponent's pawn moves two squares and lands beside your pawn, you may capture it." },
  { icon: '⬆', title: 'Pawn Promotion', desc: 'When a pawn reaches the opposite side of the board, it must be promoted to a queen, rook, bishop, or knight.' },
]

const AI_TOOLS = [
  { id: 'ai-coach', icon: '🔥', title: 'AI Coach', desc: 'Personal analysis and a training plan built around your play.' },
  { id: 'tactics', icon: '⚡', title: 'Tactics Trainer', desc: 'Practice tactical patterns with AI guidance.' },
  { id: 'opening-search', icon: '🔍', title: 'Opening Search', desc: 'Search any opening by name or move sequence.' },
  { id: 'opening-explorer', icon: '📖', title: 'Opening Explorer', desc: 'Explore key openings with move-by-move annotations.' },
  { id: 'endgame-lab', icon: '🏁', title: 'Endgame Lab', desc: 'Master critical endgame positions with AI coaching.' },
  { id: 'puzzle-trainer', icon: '🧩', title: 'Puzzle Trainer', desc: 'Solve puzzles by category and rating.' },
  { id: 'chess-coach', icon: '🤖', title: 'AI Chess Coach', desc: 'Chat with your AI coach about any chess question.' },
  { id: 'learning-path', icon: '🎓', title: 'Learning Path', desc: 'A personalized curriculum for your goals and level.' },
  { id: 'master-games', icon: '🏆', title: 'Master Games', desc: 'Study famous games with AI annotations.' },
]

function AccordionContainer({ children }) {
  const [openId, setOpenId] = useState(null)

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="learning-accordion-container">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null
        return React.cloneElement(child, {
          isOpen: openId === child.props.id,
          onToggle: () => toggle(child.props.id),
        })
      })}
    </div>
  )
}

function AccordionSection({ id, title, icon, isOpen, onToggle, children, defaultOpen = false }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div id={id} className={`learning-accordion-section ${isOpen || defaultOpen ? 'open' : ''}`}>
      <div
        className="learning-accordion-header"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {icon && <span className="learning-accordion-icon">{icon}</span>}
        <span className="learning-accordion-title">{title}</span>
        <span className="learning-accordion-arrow">{isOpen || defaultOpen ? '▴' : '▾'}</span>
      </div>
      <div
        className="learning-accordion-body"
        style={{ maxHeight: isOpen || defaultOpen ? '3000px' : '0' }}
      >
        <div className="learning-accordion-inner">{children}</div>
      </div>
    </div>
  )
}

function Hero({ activeMode, onContinueLearning, onAskAICoach }) {
  const isClassic = activeMode === 'classic'
  const title = isClassic ? 'Classic Learning' : 'AI Learning'
  const description =
    isClassic
      ? 'Master chess from the fundamentals to advanced strategy with structured lessons, opening guides, tactics, and endgame training — everything you need to build a solid foundation.'
      : 'Personalized AI coaching that adapts to your play. Get custom training plans, weakness-focused exercises, and intelligent recommendations powered by your game data.'
  const eyebrowLabel = isClassic ? 'Classic Learning — Structured Education' : 'AI Learning — Personalized Coaching'
  const accentClass = isClassic ? 'qc-border-accent qc-bg-accent-soft' : 'qc-border-warning qc-bg-warning-soft'

  const stats = [
    { label: 'Sections', value: isClassic ? '4' : '3' },
    { label: 'Topics', value: '20+' },
    { label: 'Powered', value: isClassic ? 'Content' : 'AI' },
  ]

  return (
    <div className={`qc-card p-5 sm:p-6 mb-4 ${accentClass}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="qc-section-eyebrow" style={{ marginBottom: 0 }}>
              {eyebrowLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight qc-text-primary">
            {title}
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-6 qc-text-secondary max-w-xl">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 sm:flex-col sm:text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 sm:block px-3 py-2 rounded-lg qc-bg-surface-soft min-w-0">
              <p className="text-xl font-extrabold qc-text-primary">{stat.value}</p>
              <p className="text-sm uppercase tracking-wider qc-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
        <Button size="md" variant="primary" leftIcon={Play} onClick={onContinueLearning}>
          Continue Learning
        </Button>
        <Button size="md" variant="secondary" leftIcon={Bot} onClick={onAskAICoach}>
          Ask the AI Coach
        </Button>
      </div>
    </div>
  )
}

function ProgressCards({ data }) {
  const lp = data?.learningProgress

  const stats = [
    { label: 'Level', value: lp?.level ?? '—', icon: Gauge, tone: 'primary' },
    { label: 'XP', value: lp ? `${lp.xp.toLocaleString('en-US')} XP` : '—', icon: Zap, tone: 'warning' },
    { label: 'Streak', value: `${data?.dailyStreak?.count ?? 0} days`, icon: Flame, tone: 'danger' },
    { label: 'Win Rate', value: lp?.winRate ?? '—', icon: Target, tone: 'success' },
    { label: 'Accuracy', value: lp ? `${lp.avgAccuracy}%` : '—', icon: TrendingUp, tone: 'accent' },
    { label: 'Games', value: lp?.totalGames ?? '—', icon: Trophy, tone: 'neutral' },
  ]

  const toneColor = {
    primary: 'qc-text-gold',
    accent: 'qc-text-accent',
    success: 'qc-text-success',
    warning: 'qc-text-warning',
    danger: 'qc-text-error',
    neutral: 'qc-text-muted',
  }

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="Your Progress"
        title="Keep climbing"
        description="Real-time stats from your backend when available."
        className="mb-4"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="qc-card p-4 text-center">
              <Icon className={`mx-auto mb-2 h-6 w-6 sm:h-7 sm:w-7 ${toneColor[stat.tone] || toneColor.neutral}`} aria-hidden="true" />
              <p className="text-xl sm:text-2xl font-extrabold qc-text-primary leading-none">{stat.value}</p>
              <p className="mt-1.5 text-sm qc-text-muted uppercase tracking-wider leading-none">{stat.label}</p>
            </div>
          )
        })}
      </div>
      {lp && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm qc-text-muted">
            <span>XP to next level</span>
            <span>{lp.xpProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full qc-bg-surface">
            <div
              className="h-full rounded-full"
              style={{ width: `${lp.xpProgress}%`, background: 'linear-gradient(90deg, var(--qc-gold), var(--qc-gold-light))' }}
            />
          </div>
        </div>
      )}
    </section>
  )
}

function ContinueLearning({ data, onResume, onReview }) {
  const quick = data?.quickResume

  if (!quick) {
    return (
      <section className="py-4">
        <SectionTitle
          eyebrow="Continue Learning"
          title="Resume your journey"
          description="Pick up right where you left off."
          className="mb-4"
        />
        <div className="qc-card p-4">
          <p className="text-sm qc-text-secondary">No active session to resume. Start a new game or lesson to begin.</p>
        </div>
      </section>
    )
  }

  const title = `You vs. AI — ${quick.opening}`
  const opening = quick.opening
  const meta = quick.result
    ? `Last result: ${quick.result}`
    : `Move ${quick.move || '?'} · You are ${quick.color || '?'} · ${quick.advantage || ''}`

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="Continue Learning"
        title="Resume your journey"
        description="Pick up right where you left off."
        className="mb-4"
      />
      <div className="qc-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md qc-gradient-accent">
            <Swords className="h-5 w-5 qc-text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="accent" size="sm">In Progress</Badge>
              <Badge tone="neutral" size="sm">{opening}</Badge>
            </div>
            <h3 className="text-base font-bold qc-text-primary leading-tight">{title}</h3>
            <p className="mt-1 text-sm qc-text-secondary">{meta}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
            <Button variant="primary" size="sm" leftIcon={Play} onClick={onResume}>
              Resume
            </Button>
            <Button variant="secondary" size="sm" onClick={onReview}>
              Review
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChessBasicsContent() {
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [moveHistory, setMoveHistory] = useState([])

  const showPieceDemo = (piece) => {
    setSelectedPiece(piece)
    const chess = new Chess()
    setMoveHistory([])
    
    switch (piece.name) {
      case 'Pawn':
        chess.move('e4')
        setMoveHistory(['e4'])
        break
      case 'Knight':
        chess.move('Nf3')
        setMoveHistory(['Nf3'])
        break
      case 'Bishop':
        chess.move('Bc4')
        setMoveHistory(['Bc4'])
        break
      case 'Rook':
        chess.move('Rd1')
        setMoveHistory(['Rd1'])
        break
      case 'Queen':
        chess.move('Qh5')
        setMoveHistory(['Qh5'])
        break
      case 'King':
        chess.move('Ke2')
        setMoveHistory(['Ke2'])
        break
    }
    setBoardFen(chess.fen())
  }

  const resetBoard = () => {
    const chess = new Chess()
    setBoardFen(chess.fen())
    setMoveHistory([])
    setSelectedPiece(null)
  }

  return (
    <div className="learning-section-content">
      <div className="learning-intro-text">
        <p className="text-sm qc-text-secondary">
          Chess is played on an 8×8 board with 64 squares. The board is oriented so a{' '}
          <strong className="qc-text-primary">light square</strong> is on each player's right-hand corner. Files (columns)
          are labeled <strong className="qc-text-primary">a–h</strong>, ranks (rows) are labeled <strong className="qc-text-primary">1–8</strong>.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <h4 className="learning-subsection-title">Interactive Board</h4>
          <div className="learning-board-wrapper">
            <LearningBoard fen={boardFen} />
            <div className="learning-board-actions">
              <Button variant="outline" size="xs" onClick={resetBoard}>Reset Board</Button>
            </div>
            {moveHistory.length > 0 && (
              <div className="learning-move-strip">
                {moveHistory.map((m, i) => (
                  <span key={i} className="learning-move-pill active">{m}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="learning-subsection-title" style={{ marginTop: 0 }}>Piece Movements</h4>
          <div className="learning-pieces-grid">
            {PIECES.map((p) => (
              <div
                key={p.name}
                className={`learning-piece-card learning-hover-scale cursor-pointer transition-all ${
                   selectedPiece?.name === p.name ? 'qc-ring-accent qc-bg-card-hover' : ''
                }`}
                onClick={() => showPieceDemo(p)}
              >
                <div className="learning-piece-icon">{p.icon}</div>
                <div className="learning-piece-info">
                  <h4 className="text-sm font-semibold qc-text-primary">{p.name}</h4>
                  <p className="text-sm qc-text-muted">{p.move}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm qc-text-muted">Click a piece to see its movement on the board</p>
        </div>
      </div>

      <h4 className="learning-subsection-title" style={{ marginTop: 12 }}>Essential Rules</h4>
      <div className="learning-rules-grid">
        {RULES.map((r) => (
          <div key={r.title} className="learning-topic-card learning-hover-scale">
            <div className="learning-topic-icon">{r.icon}</div>
            <div className="learning-topic-content">
              <h4 className="text-sm font-semibold qc-text-primary">{r.title}</h4>
              <p className="text-sm qc-text-muted">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LearningPaths({ data, learningPath, onOpenPath }) {
  const lp = data?.learningProgress
  const pathData = learningPath

  const backendPaths = []
  if (pathData?.focusAreas?.length) {
    backendPaths.push(
      ...pathData.focusAreas.map((area) => ({
        icon: Brain,
        title: area,
        meta: 'Focus Area',
        body: 'A key area to focus on in your chess improvement journey.',
        tone: 'primary',
      }))
    )
  }
  if (pathData?.goals) {
    const dailyGoals = pathData.goals.daily || []
    const weeklyGoals = pathData.goals.weekly || []
    backendPaths.push(
      ...dailyGoals.map((goal) => ({
        icon: Target,
        title: goal,
        meta: 'Daily Goal',
        body: 'Complete this daily goal to maintain your learning momentum.',
        tone: 'success',
      }))
    )
    backendPaths.push(
      ...weeklyGoals.map((goal) => ({
        icon: TrendingUp,
        title: goal,
        meta: 'Weekly Goal',
        body: 'A weekly objective to steadily improve your chess skills.',
        tone: 'accent',
      }))
    )
  }
  if (pathData?.studyPlan?.narrative) {
    backendPaths.push({
      icon: BookOpen,
      title: 'Your Study Plan',
      meta: 'Plan',
      body: `${pathData.studyPlan.narrative}${pathData.dailyStudyMinutes ? ` ${pathData.dailyStudyMinutes} min/day.` : ''}${pathData.goals?.monthly?.length ? ` Monthly: ${pathData.goals.monthly.join(', ')}.` : ''}`,
      tone: 'warning',
    })
  }

  return (
    <div>
      {backendPaths.length >= 2 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {backendPaths.map((path) => {
            const Icon = path.icon
            return (
              <div
                key={path.title}
                className="qc-card p-4 sm:p-5 hover:qc-card-elevated cursor-pointer transition-all"
                onClick={() => onOpenPath && onOpenPath(path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md qc-gradient-accent-soft">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 qc-text-accent" aria-hidden="true" />
                  </div>
                  <Badge tone={path.tone} size="sm">{path.meta}</Badge>
                </div>
                <h3 className="text-sm sm:text-base font-semibold qc-text-primary leading-tight">{path.title}</h3>
                <p className="mt-1.5 text-sm sm:text-sm leading-relaxed qc-text-secondary flex-1">{path.body}</p>
                <div className="mt-3">
                  <Button variant="outline" size="xs" rightIcon={ArrowRight} className="self-start">
                    Explore
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="p-4">
          <p className="text-sm qc-text-secondary">Learning paths will appear here once generated based on your profile.</p>
        </Card>
      )}
      {lp && (
        <div className="qc-card p-4 qc-border-accent mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md qc-gradient-accent-soft">
              <Crown className="h-4 w-4 qc-text-warning" aria-hidden="true" />
            </div>
          </div>
          <h3 className="text-sm font-semibold qc-text-primary leading-tight">Your Level {lp.level}</h3>
          <p className="mt-1 text-sm leading-relaxed qc-text-secondary">
            Rating {learningPath?.currentRating || data?.rating?.rapid || 1200} · {lp.xp} XP earned · {lp.totalGames} games · {lp.avgAccuracy}% avg accuracy
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full qc-bg-surface">
            <div
              className="h-full rounded-full"
              style={{ width: `${lp.xpProgress}%`, background: 'linear-gradient(90deg, var(--qc-gold), var(--qc-gold-light))' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FeaturedLessons({ data, training, learningPath, onOpenLesson }) {
  const backendLessons = []
  const trainingData = training
  const pathData = learningPath

  if (trainingData?.components?.length) {
    backendLessons.push(
      ...trainingData.components.map((comp) => ({
        icon: Puzzle,
        title: comp.type || 'Lesson',
        body: comp.description || comp.summary || '',
        meta: comp.duration ? `${comp.duration} min` : 'Lesson',
        tone: 'primary',
        description: comp.description || comp.summary || 'A training component to improve your skills.',
        difficulty: comp.difficulty || 'intermediate',
        duration: comp.duration || 30,
        objectives: comp.objectives || ['Improve your chess skills', 'Learn new techniques'],
        topics: [comp.type || 'General'],
      }))
    )
  }
  if (trainingData?.sessionSummary) {
      backendLessons.push({
        icon: BookOpen,
        title: 'Daily Training',
        body: trainingData.sessionSummary,
        meta: `${trainingData.sessionDuration || 30} min · ${trainingData.difficulty || 'intermediate'}`,
        tone: 'accent',
        description: trainingData.sessionSummary || 'Your daily training session.',
        difficulty: trainingData.difficulty || 'intermediate',
        duration: trainingData.sessionDuration || 30,
        objectives: ['Complete daily training', 'Improve consistency'],
        topics: ['Daily Training'],
      })
    }
  if (pathData?.studyPlan?.narrative) {
    backendLessons.push({
      icon: BookOpen,
      title: 'Learning Path',
      body: pathData.studyPlan.narrative,
      meta: 'Plan',
      tone: 'success',
      description: pathData.studyPlan.narrative || 'Your personalized learning path.',
      difficulty: 'intermediate',
      duration: pathData.dailyStudyMinutes || 30,
      objectives: ['Follow your learning path', 'Achieve your goals'],
      topics: ['Learning Path'],
    })
  }
  if (data?.todayTraining?.length) {
    backendLessons.push(
      ...data.todayTraining.map((task) => ({
        icon: Target,
        title: task.title,
        body: task.description,
        meta: task.type || 'Task',
        tone: 'warning',
        description: task.description || task.title,
        difficulty: 'intermediate',
        duration: 15,
        objectives: ['Complete today\'s training task'],
        topics: [task.type || 'Training'],
      }))
    )
  }
  if (data?.todayOpening?.name) {
    backendLessons.push({
      icon: Swords,
      title: 'Opening Study',
      body: data.todayOpening.name,
      meta: 'Opening',
      tone: 'accent',
      description: data.todayOpening.description || `Study the ${data.todayOpening.name} opening.`,
      difficulty: 'intermediate',
      duration: 20,
      objectives: ['Learn the opening', 'Practice key lines'],
      topics: ['Opening', data.todayOpening.name],
    })
  }
  if (data?.todayPuzzle?.title) {
    backendLessons.push({
      icon: Puzzle,
      title: 'Tactics Puzzle',
      body: data.todayPuzzle.title,
      meta: 'Puzzle',
      tone: 'success',
      description: data.todayPuzzle.description || `Solve the ${data.todayPuzzle.title} tactical puzzle.`,
      difficulty: 'intermediate',
      duration: 10,
      objectives: ['Solve the puzzle', 'Improve tactical vision'],
      topics: ['Tactics', 'Puzzle'],
    })
  }

   return (
     <div>
       {backendLessons.length >= 2 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {backendLessons.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="qc-card p-4 sm:p-5 cursor-pointer transition-all hover:qc-card-elevated"
                onClick={() => onOpenLesson && onOpenLesson(item)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md qc-gradient-accent-soft">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 qc-text-accent" aria-hidden="true" />
                  </div>
                  <Badge tone={item.tone} size="sm">{item.meta}</Badge>
                </div>
                <h3 className="text-sm sm:text-base font-semibold qc-text-primary leading-tight">{item.title}</h3>
                <p className="mt-1.5 text-sm sm:text-sm leading-relaxed qc-text-secondary flex-1">{item.body}</p>
                <div className="mt-3">
                  <Button variant="secondary" size="xs" rightIcon={ChevronRight} className="self-start">
                    Start
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="p-4">
          <p className="text-sm qc-text-secondary">Featured lessons will appear here once available.</p>
        </Card>
      )}
    </div>
  )
}

function TodayPlan({ data, training, onToggleTask, tasks, onStartGoal, onTaskClick }) {
  const goal = data?.todayGoal
  const trainingTasks = tasks || data?.todayTraining?.length ? data.todayTraining : []
  const opening = data?.todayOpening
  const puzzle = data?.todayPuzzle

  const completedCount = trainingTasks.filter(t => t.completed).length
  const totalCount = trainingTasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="qc-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md qc-gradient-accent">
            <Target className="h-4 w-4 qc-text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider qc-text-muted leading-none">Today's Goal</p>
            <h3 className="text-sm font-bold qc-text-primary leading-tight">{goal?.title || 'Five daily tasks'}</h3>
          </div>
        </div>
        <p className="text-sm leading-relaxed qc-text-secondary">
          {goal?.description || "Complete today's training to keep your streak alive and earn XP."}
        </p>
        {training?.sessionDuration && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="neutral" size="xs" icon={Clock}>{training.sessionDuration} min</Badge>
            {training?.difficulty && <Badge tone="accent" size="xs">{training.difficulty}</Badge>}
            {goal?.type && <Badge tone="neutral" size="xs">{goal.type}</Badge>}
            {goal?.completed !== undefined && <Badge tone={goal.completed ? "success" : "warning"} size="xs">{goal.completed ? "Completed" : "In progress"}</Badge>}
          </div>
        )}
        {goal && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-[10px] qc-text-muted">
              <span>Progress</span>
              <span>{goal.progress}/{goal.target}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full qc-bg-surface">
              <div
                className="h-full rounded-full"
                style={{ width: `${(goal.progress / Math.max(goal.target, 1)) * 100}%`, background: 'linear-gradient(90deg, var(--qc-gold), var(--qc-gold-light))' }}
              />
            </div>
          </div>
        )}
        <div className="mt-3">
          <Button variant="primary" fullWidth size="xs" leftIcon={Play} onClick={onStartGoal}>
            Start Today's Goal
          </Button>
        </div>
      </div>

      <div className="qc-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md qc-gradient-accent">
              <Clock className="h-4 w-4 qc-text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider qc-text-muted leading-none">Training Tasks</p>
              <h3 className="text-sm font-bold qc-text-primary leading-tight">Checklist</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold qc-text-primary leading-none">{completedCount}/{totalCount}</p>
            <p className="text-[10px] qc-text-muted leading-none">{progressPercent}%</p>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full qc-bg-surface mb-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--qc-gold), var(--qc-gold-light))' }}
          />
        </div>

        <ul className="space-y-1.5">
          {trainingTasks.map((task, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-md border p-2 transition-all cursor-pointer ${
                task.completed
                  ? 'qc-border-success qc-bg-success-soft'
                  : 'qc-border qc-bg-card hover:qc-bg-card-hover'
              }`}
              onClick={() => (onTaskClick ? onTaskClick(task, i) : (onToggleTask && onToggleTask(i)))}
            >
              <span
                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold transition-all ${
                  task.completed
                    ? 'qc-bg-success qc-text-primary scale-110'
                    : 'qc-border qc-text-muted'
                }`}
              >
                {task.completed ? <Check className="h-2.5 w-2.5" /> : String(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium leading-tight ${task.completed ? 'qc-text-success line-through' : 'qc-text-primary'}`}>
                  {task.title}
                </p>
                <p className="text-[10px] qc-text-muted">{task.description}</p>
              </div>
              {task.completed && (
                <Badge tone="success" size="xs">Done</Badge>
              )}
            </li>
          ))}
        </ul>
        {(opening || puzzle) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {opening && <Badge tone="accent" size="xs" icon={BookOpen}>{opening.name}{opening.description ? ` — ${opening.description}` : ''}</Badge>}
            {puzzle && <Badge tone="warning" size="xs" icon={Puzzle}>{puzzle.title}{puzzle.description ? ` — ${puzzle.description}` : ''}</Badge>}
          </div>
        )}
      </div>
    </div>
  )
}

function SuggestedLessons({ data, coachPlan, openings, puzzles, onOpenRecommendation }) {
  const recommendation = data?.recentRecommendation
  const coachPlanData = coachPlan
  const openingRecData = openings
  const puzzleRecData = puzzles

  const backendItems = []
  if (coachPlanData?.weaknesses?.length) {
    backendItems.push(
      ...coachPlanData.weaknesses.map((w) => ({
        icon: Brain,
        title: 'Weakness',
        body: w,
        detail: 'This is an area where you can improve. Focus on practicing this skill regularly.',
        type: 'weakness',
      }))
    )
  }
  if (coachPlanData?.trainingRecommendations?.length) {
    backendItems.push(
      ...coachPlanData.trainingRecommendations.map((rec) => ({
        icon: Target,
        title: 'Training',
        body: rec,
        detail: 'Follow this training recommendation to improve your chess skills.',
        type: 'training',
      }))
    )
  }
  if (openingRecData?.recommended?.length) {
    backendItems.push(
      ...openingRecData.recommended.map((op) => ({
        icon: Swords,
        title: 'Opening',
        body: `Study ${op} — recommended for your rating.${openingRecData?.difficulty ? ` Difficulty: ${openingRecData.difficulty}.` : ''}${openingRecData?.instruction ? ` ${openingRecData.instruction}.` : ''}`,
        detail: `The ${op} opening is recommended based on your playing style and rating. Study the main lines and practice regularly.`,
        type: 'opening',
      }))
    )
  }
  if (puzzleRecData?.themes?.length) {
    const puzzleRating = puzzleRecData?.ratingRange ? `${puzzleRecData.ratingRange.min}-${puzzleRecData.ratingRange.max}` : ''
    const puzzleCount = puzzleRecData?.count || ''
    const puzzleDiff = puzzleRecData?.difficulty || ''
    const puzzleDetails = [puzzleRating, puzzleCount ? `${puzzleCount} puzzles` : '', puzzleDiff].filter(Boolean).join(' · ')

    backendItems.push(
      ...puzzleRecData.themes.map((theme) => ({
        icon: Puzzle,
        title: 'Tactics',
        body: `Practice ${theme.replace(/-/g, ' ')} puzzles.${puzzleDetails ? ` ${puzzleDetails}.` : ''}${puzzleRecData?.instruction ? ` ${puzzleRecData.instruction}.` : ''}`,
        detail: `Practicing ${theme.replace(/-/g, ' ')} puzzles will improve your tactical vision and calculation skills.`,
        type: 'tactics',
      }))
    )
  }
  if (data?.recentGame?.opening) {
    backendItems.push({
      icon: BookOpen,
      title: 'Recent Game Review',
      body: `Your last game used the ${data.recentGame.opening}. Review it to improve.`,
      detail: `Review your recent game with the ${data.recentGame.opening} to identify mistakes and learn from them.`,
      type: 'review',
    })
  }

  return (
    <>
      {backendItems.length >= 2 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {backendItems.map((rec) => {
            const Icon = rec.icon
            return (
              <div
                key={rec.title + rec.body}
                className="qc-card p-4 sm:p-5 cursor-pointer transition-all hover:qc-card-elevated"
                onClick={() => onOpenRecommendation && onOpenRecommendation(rec)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md qc-gradient-accent-soft">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 qc-text-accent" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-sm sm:text-base font-semibold qc-text-primary leading-tight">{rec.title}</h3>
                <p className="mt-1.5 text-sm sm:text-sm leading-relaxed qc-text-secondary flex-1">{rec.body}</p>
                <div className="mt-3">
                  <Button variant="ghost" size="xs" rightIcon={ChevronRight} className="self-start">
                    View
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="p-4">
          <p className="text-sm qc-text-secondary">Personalized suggestions will appear here based on your recent games and study habits.</p>
        </Card>
      )}
      {recommendation && (
        <div className="qc-card mt-3 flex items-center gap-2.5 qc-border-accent p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md qc-bg-accent-soft">
            <Bot className="h-3.5 w-3.5 qc-text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider qc-text-muted leading-none">AI Coach Recommendation</p>
            <p className="text-sm qc-text-primary mt-0.5">{recommendation}</p>
          </div>
        </div>
      )}
    </>
  )
}

function Achievements({ data, onOpenAchievement }) {
  const lp = data?.learningProgress
  const streak = data?.dailyStreak?.count || 0
  const unlockedAchievements = data?.achievements || []
  const level = lp?.level || 1
  const xp = lp?.xp || 0

  const backendAchievements = []
  if (unlockedAchievements.length > 0) {
    backendAchievements.push(
      ...unlockedAchievements.map((name, idx) => ({
        icon: Trophy,
        title: name,
        desc: 'Unlocked',
        progress: 100,
        tone: ['warning', 'danger', 'success', 'primary', 'accent'][idx % 5],
        requirements: `Unlock the "${name}" achievement`,
        xpReward: 100,
        unlocked: true,
      }))
    )
  }
  if (streak > 0) {
    backendAchievements.push({
      icon: Flame,
      title: 'Daily Streak',
      desc: `${streak} day streak`,
      progress: Math.min(100, streak * 5),
      tone: 'danger',
      requirements: `Maintain a ${streak}-day streak. Keep going!`,
      xpReward: streak * 10,
      unlocked: streak >= 7,
    })
  }
  if (xp > 0) {
    backendAchievements.push({
      icon: Zap,
      title: 'XP Earned',
      desc: `${xp.toLocaleString()} XP collected`,
      progress: Math.min(100, Math.round((xp / (level * 100)) * 100)),
      tone: 'warning',
      requirements: `Earn ${level * 100} XP to reach level ${level + 1}`,
      xpReward: 50,
      unlocked: xp >= level * 100,
    })
  }

  return (
    <div>
      {backendAchievements.length >= 2 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {backendAchievements.map((ach) => {
            const Icon = ach.icon
            return (
              <div
                key={ach.title}
                className="qc-card p-4 sm:p-5 cursor-pointer transition-all hover:qc-card-elevated"
                onClick={() => onOpenAchievement && onOpenAchievement(ach)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md qc-gradient-accent-soft">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 qc-text-accent" aria-hidden="true" />
                  </div>
                  <Badge tone={ach.tone} size="sm">{ach.progress}%</Badge>
                </div>
                <h3 className="text-sm sm:text-base font-semibold qc-text-primary leading-tight">{ach.title}</h3>
                <p className="mt-1.5 text-sm sm:text-sm leading-relaxed qc-text-secondary flex-1">{ach.desc}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full qc-bg-surface">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ach.progress}%`, background: 'linear-gradient(90deg, var(--qc-gold), var(--qc-gold-light))' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="p-4">
          <p className="text-sm qc-text-secondary">Achievements will appear here as you complete milestones.</p>
        </Card>
      )}
    </div>
  )
}

function PersonalTrainingPlan({ data, coachPlan, onGeneratePlan }) {
  const goal = data?.todayGoal
  const coachPlanData = coachPlan
  const hasBackend = !!coachPlanData?.summary || !!goal

  const planTitle = coachPlanData?.focus || goal?.title || 'Your training plan'
  const planBody = coachPlanData?.summary || goal?.description || ''
  const weakSkills = coachPlanData?.weaknesses?.length
    ? coachPlanData.weaknesses.slice(0, 2).join(', ')
    : ''
  const nextObjective = coachPlanData?.focus || ''

  return (
    <div className="qc-card relative overflow-hidden p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 qc-bg-accent-radial"
      />
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md qc-gradient-accent">
          <Bot className="h-5 w-5 qc-text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent" size="sm">AI Generated</Badge>
            <Badge tone="neutral" size="sm">Adaptive</Badge>
          </div>
          <h3 className="text-base font-bold qc-text-primary leading-tight">
            {planTitle}
          </h3>
          {planBody && (
            <p className="mt-1 text-sm leading-relaxed qc-text-secondary">
              {planBody}
            </p>
          )}
          {weakSkills && (
            <p className="mt-1 text-[10px] qc-text-muted">
              Weak skills: {weakSkills}
            </p>
          )}
          {coachPlanData?.strengths?.length && (
            <p className="mt-1 text-[10px] qc-text-muted">
              Strengths: {coachPlanData.strengths.join(', ')}
            </p>
          )}
          {coachPlanData?.recommendedOpening && (
            <p className="mt-1 text-[10px] qc-text-muted">
              Suggested opening: {coachPlanData.recommendedOpening}
            </p>
          )}
          {coachPlanData?.recommendedEndgame && (
            <p className="mt-1 text-[10px] qc-text-muted">
              Suggested endgame: {coachPlanData.recommendedEndgame}
            </p>
          )}
          {nextObjective && (
            <p className="mt-1 text-[10px] qc-text-muted">
              Next objective: {nextObjective}
            </p>
          )}
        </div>
        <Button variant="primary" size="xs" leftIcon={Sparkles} className="shrink-0" onClick={onGeneratePlan}>
          Generate My Plan
        </Button>
      </div>
      {!hasBackend && (
        <div className="relative z-10 mt-3 text-[10px] qc-text-muted">
          <p>Generate a training plan to see your personalized regimen here.</p>
        </div>
      )}
    </div>
  )
}

function AIToolsCompact() {
  const [active, setActive] = useState('ai-coach')

  const renderModule = () => {
    switch (active) {
      case 'ai-coach':
        return <AICoach />
      case 'tactics':
        return <TacticsTrainer />
      case 'opening-search':
        return <OpeningSearch />
      case 'opening-explorer':
        return <OpeningExplorer />
      case 'endgame-lab':
        return <EndgameLab />
      case 'puzzle-trainer':
        return <PuzzleTrainer />
      case 'chess-coach':
        return <AIChessCoach />
      case 'learning-path':
        return <LearningPath />
      case 'master-games':
        return <MasterGames />
      default:
        return <AICoach />
    }
  }

  return (
    <div>
      <div className="ai-tools-compact">
        {AI_TOOLS.map((tool) => (
          <Button
            key={tool.id}
            variant={active === tool.id ? 'primary' : 'ghost'}
            size="xs"
            onClick={() => setActive(tool.id)}
            className="gap-1"
          >
            <span className="text-sm">{tool.icon}</span>
            {tool.title}
          </Button>
        ))}
      </div>
      <div className="learning-tool-shell">{renderModule()}</div>
    </div>
  )
}

function LessonDetailModal({ lesson, isOpen, onClose }) {
  if (!lesson) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lesson.title} footer={
      <Button variant="primary" size="xs" leftIcon={Play} onClick={onClose}>
        Start Lesson
      </Button>
    }>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {lesson.meta && <Badge tone="accent" size="sm">{lesson.meta}</Badge>}
          {lesson.difficulty && <Badge tone="warning" size="sm">{lesson.difficulty}</Badge>}
          {lesson.duration && <Badge tone="neutral" size="sm" icon={Clock}>{lesson.duration} min</Badge>}
        </div>
        <p className="text-sm qc-text-secondary">{lesson.description || lesson.body}</p>
        {lesson.objectives && lesson.objectives.length > 0 && (
          <div>
            <h4 className="mb-1 text-sm font-semibold qc-text-primary">Objectives</h4>
            <ul className="space-y-1">
              {lesson.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm qc-text-secondary">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 qc-text-success" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}
        {lesson.topics && lesson.topics.length > 0 && (
          <div>
            <h4 className="mb-1 text-sm font-semibold qc-text-primary">Topics</h4>
            <div className="flex flex-wrap gap-1.5">
              {lesson.topics.map((topic, i) => (
                <Badge key={i} tone="primary" size="xs">{topic}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function AchievementDetailModal({ achievement, isOpen, onClose }) {
  if (!achievement) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={achievement.title} footer={
      <div className="flex items-center gap-2">
        <Badge tone={achievement.unlocked ? 'success' : 'warning'} size="sm">
          {achievement.unlocked ? 'Unlocked' : `${achievement.progress}%`}
        </Badge>
        {achievement.xpReward && <Badge tone="accent" size="sm" icon={Zap}>{achievement.xpReward} XP</Badge>}
      </div>
    }>
      <div className="space-y-2">
        <p className="text-sm qc-text-secondary">{achievement.desc}</p>
        <div>
          <h4 className="mb-1 text-sm font-semibold qc-text-primary">Requirements</h4>
          <p className="text-sm qc-text-secondary">{achievement.requirements}</p>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold qc-text-primary">Progress</h4>
          <div className="h-1.5 w-full overflow-hidden rounded-full qc-bg-surface">
            <div
              className="h-full rounded-full"
              style={{ width: `${achievement.progress}%`, background: 'linear-gradient(90deg, var(--qc-gold), var(--qc-gold-light))' }}
            />
          </div>
          <p className="mt-1 text-[10px] qc-text-muted">{achievement.progress}% complete</p>
        </div>
        {achievement.xpReward && (
          <div>
            <h4 className="mb-1 text-sm font-semibold qc-text-primary">XP Reward</h4>
            <p className="text-sm qc-text-secondary">{achievement.xpReward} XP</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function RecommendationDetailModal({ recommendation, isOpen, onClose }) {
  if (!recommendation) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recommendation.title}>
      <div className="space-y-2">
        <p className="text-sm qc-text-secondary">{recommendation.body}</p>
        {recommendation.detail && (
          <div>
            <h4 className="mb-1 text-sm font-semibold qc-text-primary">Why This Recommendation</h4>
            <p className="text-sm qc-text-secondary">{recommendation.detail}</p>
          </div>
        )}
        <div>
          <h4 className="mb-1 text-sm font-semibold qc-text-primary">Related Areas</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="primary" size="xs">Tactics</Badge>
            <Badge tone="accent" size="xs">Openings</Badge>
            <Badge tone="success" size="xs">Endgames</Badge>
          </div>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold qc-text-primary">Estimated Benefit</h4>
          <p className="text-sm qc-text-secondary">Improving in this area will boost your overall rating and win rate.</p>
        </div>
      </div>
    </Modal>
  )
}

function PathDetailModal({ path, isOpen, onClose }) {
  if (!path) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={path.title} footer={
      <Button variant="primary" size="xs" rightIcon={ArrowRight} onClick={onClose}>
        Start Path
      </Button>
    }>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {path.meta && <Badge tone={path.tone || 'primary'} size="sm">{path.meta}</Badge>}
        </div>
        <p className="text-sm qc-text-secondary">{path.body}</p>
        <div>
          <h4 className="mb-1 text-sm font-semibold qc-text-primary">What You'll Learn</h4>
          <ul className="space-y-1">
            <li className="flex items-start gap-2 text-sm qc-text-secondary">
              <Check className="mt-0.5 h-3 w-3 shrink-0 qc-text-success" />
              Core concepts and principles
            </li>
            <li className="flex items-start gap-2 text-sm qc-text-secondary">
              <Check className="mt-0.5 h-3 w-3 shrink-0 qc-text-success" />
              Practical exercises and drills
            </li>
            <li className="flex items-start gap-2 text-sm qc-text-secondary">
              <Check className="mt-0.5 h-3 w-3 shrink-0 qc-text-success" />
              Real-game examples
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold qc-text-primary">Estimated Time</h4>
          <p className="text-sm qc-text-secondary">2-4 weeks depending on your pace</p>
        </div>
      </div>
    </Modal>
  )
}

function Learning() {
  const navigate = useNavigate()
  const [activeMode, setActiveMode] = useState('classic')

  const dashboardQuery = useApi(
    useCallback(() => learningApi.getDashboard().then((res) => res.data?.data ?? res.data), []),
  )

  const data = dashboardQuery.data
  const lp = data?.learningProgress

  const profile = useMemo(() => ({
    rating: data?.rating?.rapid || 1200,
    avgAccuracy: lp?.avgAccuracy || 0,
    gamesPlayed: lp?.totalGames || 0,
    favoriteOpening: data?.recentGame?.opening || 'Unknown',
  }), [data, lp])

  const learningPathQuery = useApi(
    useCallback(() => learningApi.getLearningPath(profile), [profile]),
    { immediate: false, deps: [profile] }
  )

  const coachPlanQuery = useApi(
    useCallback(() => learningApi.getCoachPlan(profile), [profile]),
    { immediate: false, deps: [profile] }
  )

  const trainingQuery = useApi(
    useCallback(() => learningApi.getTrainingDaily(profile), [profile]),
    { immediate: false, deps: [profile] }
  )

  const openingRecQuery = useApi(
    useCallback(() => learningApi.getOpeningRecommendations(profile), [profile]),
    { immediate: false, deps: [profile] }
  )

  const puzzleRecQuery = useApi(
    useCallback(() => learningApi.getPuzzleRecommendations({ rating: profile.rating }), [profile]),
    { immediate: false, deps: [profile] }
  )

  const learningPathData = learningPathQuery.data
  const coachPlanData = coachPlanQuery.data
  const trainingData = trainingQuery.data
  const openingRecData = openingRecQuery.data
  const puzzleRecData = puzzleRecQuery.data

  const [selectedLesson, setSelectedLesson] = useState(null)
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const [selectedPath, setSelectedPath] = useState(null)
  const [selectedRecommendation, setSelectedRecommendation] = useState(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showPathModal, setShowPathModal] = useState(false)
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)

  const [trainingTasks, setTrainingTasks] = useLocalStorage('learning-training-tasks', [])
  const [userModifiedTasks, setUserModifiedTasks] = useLocalStorage('learning-training-tasks-modified', false)

  const backendTasks = useMemo(
    () => data?.todayTraining?.map((t) => ({ ...t, completed: t.completed || false })) || [],
    [data?.todayTraining],
  )

  useEffect(() => {
    if (!userModifiedTasks && backendTasks.length > 0) {
      const hasChanges =
        trainingTasks.length !== backendTasks.length ||
        trainingTasks.some((task, index) =>
          JSON.stringify(task) !== JSON.stringify(backendTasks[index]),
        )

      if (hasChanges) {
        setTrainingTasks(backendTasks)
      }
    }
  }, [backendTasks, trainingTasks, userModifiedTasks, setTrainingTasks])

  const handleToggleTask = (index) => {
    setTrainingTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, completed: !task.completed } : task
    ))
    setUserModifiedTasks(true)
  }

  const handleGeneratePlan = async () => {
    coachPlanQuery.refetch()
  }

  const handleContinueLearning = () => {
    const todaySection = document.getElementById('today')
    if (todaySection) {
      todaySection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleAskAICoach = () => {
    const aiSection = document.getElementById('ai-coach')
    if (aiSection) {
      aiSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleReview = () => {
    const recommendedSection = document.getElementById('recommended')
    if (recommendedSection) {
      recommendedSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleStartGoal = () => {
    const todaySection = document.getElementById('today')
    if (todaySection) {
      todaySection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleOpenLesson = (lesson) => {
    setSelectedLesson(lesson)
    setShowLessonModal(true)
  }

  const handleOpenAchievement = (achievement) => {
    setSelectedAchievement(achievement)
    setShowAchievementModal(true)
  }

  const handleOpenPath = (path) => {
    setSelectedPath(path)
    setShowPathModal(true)
  }

  const handleOpenRecommendation = (rec) => {
    setSelectedRecommendation(rec)
    setShowRecommendationModal(true)
  }

  const QUIZ_CATEGORY_MAP = {
    'Tactical Puzzle': '/quiz?category=tactics',
    'Daily Challenge': '/quiz?category=daily-challenge',
    'Opening Puzzle': '/quiz?category=openings',
    'Endgame Puzzle': '/quiz?category=endgames',
    'Best Move': '/quiz?category=best-move',
    'Mate in 1': '/quiz?category=mate-in-1',
    'Mate in 2': '/quiz?category=mate-in-2',
    'Mate in 3': '/quiz?category=mate-in-3',
    'Defensive Move': '/quiz?category=defensive-move',
    'AI Challenge': '/quiz?category=ai-challenge',
    'Weekly Challenge': '/quiz?category=weekly-challenge',
    'Survival Mode': '/quiz?category=survival-mode',
    'Master Games': '/quiz?category=master-games',
    'Daily Lesson': '/quiz?category=daily-challenge',
    'Openings': '/quiz?category=openings',
    'Tactics': '/quiz?category=tactics',
    'Endgames': '/quiz?category=endgames',
    'Endgame': '/quiz?category=endgames',
    'Tactics Puzzle': '/quiz?category=tactics',
    'Solve 10 tactical puzzles': '/quiz?category=tactics',
    'Study the Italian Game': '/quiz?category=openings',
    'Practice rook endgames': '/quiz?category=endgames',
    'Tactics drill': '/quiz?category=tactics',
    'Opening study': '/quiz?category=openings',
    'Opening Study': '/quiz?category=openings',
  }

  const getQuizUrl = (title) => QUIZ_CATEGORY_MAP[title] || null

  const handlePathClick = (path) => {
    const quizUrl = getQuizUrl(path.title)
    if (quizUrl) {
      navigate(quizUrl)
    } else {
      handleOpenPath(path)
    }
  }

  const handleLessonClick = (lesson) => {
    const quizUrl = getQuizUrl(lesson.title)
    if (quizUrl) {
      navigate(quizUrl)
    } else {
      handleOpenLesson(lesson)
    }
  }

  const handleRecClick = (rec) => {
    const quizUrl = getQuizUrl(rec.title)
    if (quizUrl) {
      navigate(quizUrl)
    } else {
      handleOpenRecommendation(rec)
    }
  }

  const handleTaskClick = (task, index) => {
    const quizUrl = getQuizUrl(task.title)
    if (quizUrl) {
      navigate(quizUrl)
    } else {
      handleToggleTask(index)
    }
  }

  if (dashboardQuery.loading) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <LoadingState label="Loading your learning dashboard..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="max-w-7xl">
      <div className="learning-mode-tabs">
        <button
          type="button"
          className={`learning-mode-tab ${activeMode === 'classic' ? 'active' : ''}`}
          onClick={() => setActiveMode('classic')}
        >
          <span className="learning-mode-tab-icon">📚</span>
          <span className="hidden sm:inline">Classic Learning</span>
          <span className="sm:hidden">Classic</span>
        </button>
        <button
          type="button"
          className={`learning-mode-tab ${activeMode === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveMode('ai')}
        >
          <span className="learning-mode-tab-icon">🤖</span>
          <span className="hidden sm:inline">AI Learning</span>
          <span className="sm:hidden">AI Coach</span>
        </button>
      </div>

      {activeMode === 'classic' ? (
        <>
          <Hero
            data={data}
            activeMode={activeMode}
            onContinueLearning={handleContinueLearning}
            onAskAICoach={handleAskAICoach}
          />
          <ProgressCards data={data} />
          <ContinueLearning data={data} onResume={handleContinueLearning} onReview={handleReview} />

          <AccordionContainer>
            <AccordionSection id="basics" title="Chess Basics" icon="♟">
              <ChessBasicsContent />
            </AccordionSection>

            <AccordionSection id="paths" title="Learning Paths" icon="📚">
              <SectionTitle
                eyebrow="Learning Paths"
                title="Choose your focus"
                description="Pick a discipline and dive into a structured curriculum."
                className="mb-4"
              />
              <LearningPaths data={data} learningPath={learningPathData} onOpenPath={handlePathClick} />
            </AccordionSection>

            <AccordionSection id="featured" title="Featured Lessons" icon="⭐">
              <SectionTitle
                eyebrow="Featured Lessons"
                title="Keep sharp every day"
                description="A balanced training plan of lessons, openings, and tactics."
                className="mb-4"
              />
               <FeaturedLessons data={data} training={trainingData} learningPath={learningPathData} onOpenLesson={handleLessonClick} />
            </AccordionSection>

            <AccordionSection id="today" title="Today's Training" icon="📅">
              <SectionTitle
                eyebrow="Today's Plan"
                title="Your daily training"
                description="Focused tasks to keep you improving every day."
                className="mb-4"
              />
               <TodayPlan data={data} training={trainingData} onToggleTask={handleToggleTask} tasks={trainingTasks} onStartGoal={handleStartGoal} onTaskClick={handleTaskClick} />
            </AccordionSection>
          </AccordionContainer>
        </>
      ) : (
        <>
          <Hero
            data={data}
            activeMode={activeMode}
            onContinueLearning={handleContinueLearning}
            onAskAICoach={handleAskAICoach}
          />
          <ProgressCards data={data} />
          <ContinueLearning data={data} onResume={handleContinueLearning} onReview={handleReview} />

          <AccordionContainer>
            <AccordionSection id="ai-coach" title="Train with your AI Coach" icon="🤖">
              <AIToolsCompact />
            </AccordionSection>

            <AccordionSection id="recommended" title="Recommended" icon="🎯">
              <SectionTitle
                eyebrow="Suggested Lessons"
                title="Recommended for you"
                description="Smart recommendations based on your recent games and study habits."
                className="mb-4"
              />
              <SuggestedLessons
                data={data}
                coachPlan={coachPlanData}
                openings={openingRecData}
                puzzles={puzzleRecData}
                onOpenRecommendation={handleRecClick}
              />
            </AccordionSection>

            <AccordionSection id="plan" title="Personal Training Plan" icon="📝">
              <SectionTitle
                eyebrow="Personal Training Plan"
                title="Build your perfect regimen"
                description="A plan tailored to your goals, style, and time."
                className="mb-4"
              />
              <PersonalTrainingPlan data={data} coachPlan={coachPlanData} onGeneratePlan={handleGeneratePlan} />
            </AccordionSection>

            <AccordionSection id="achievements" title="Achievements" icon="🏆">
              <SectionTitle
                eyebrow="Achievements"
                title="Your milestones"
                description="Track your progress toward your chess goals."
                className="mb-4"
              />
              <Achievements data={data} onOpenAchievement={handleOpenAchievement} />
            </AccordionSection>
          </AccordionContainer>
        </>
      )}

      <LessonDetailModal
        lesson={selectedLesson}
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
      />
      <AchievementDetailModal
        achievement={selectedAchievement}
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
      />
      <PathDetailModal
        path={selectedPath}
        isOpen={showPathModal}
        onClose={() => setShowPathModal(false)}
      />
      <RecommendationDetailModal
        recommendation={selectedRecommendation}
        isOpen={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
      />
    </PageContainer>
  )
}

export default Learning
