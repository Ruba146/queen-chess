import { useCallback, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  Crown,
  Flame,
  Gauge,
  Play,
  Puzzle,
  Swords,
  Target,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import PageContainer from '../../components/ui/PageContainer'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useApi } from '../../hooks/useApi'
import { learningApi, gameApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ChessPiece from '../../components/chess/ChessPiece'

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return `${diff} sec ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`
}

function outcomeLabel(game) {
  if (game.result === 'draw') return 'Draw'
  if (game.result === 'White' && game.playerColor === 'white') return 'Victory'
  if (game.result === 'Black' && game.playerColor === 'black') return 'Victory'
  if (game.result === 'White' && game.playerColor === 'black') return 'Defeat'
  if (game.result === 'Black' && game.playerColor === 'white') return 'Defeat'
  return 'Review'
}

function RevealSection({ children, className = '', delay = 0 }) {
  return (
    <motion.section
      className={`qc-reveal ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: delay / 1000 }}
    >
      {children}
    </motion.section>
  )
}

const BOARD_STATES = [
  {
    evalText: '+0.4',
    bestMove: 'Qd6',
    position: [
      [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, null, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
      [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
      [null, null, { type: 'p', color: 'b' }, null, null, null, null, null],
      [null, null, null, null, { type: 'p', color: 'b' }, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, { type: 'q', color: 'w' }, null, null],
      [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, null, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
      [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, null, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
    ],
  },
  {
    evalText: '+1.2',
    bestMove: 'Nxe5',
    position: [
      [{ type: 'r', color: 'b' }, null, null, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, null, { type: 'r', color: 'b' }],
      [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
      [null, null, { type: 'n', color: 'b' }, null, null, null, null, null],
      [null, null, null, { type: 'p', color: 'b' }, null, null, null, null],
      [null, null, null, null, { type: 'p', color: 'w' }, { type: 'n', color: 'w' }, null, null],
      [null, null, null, null, { type: 'q', color: 'w' }, null, null, null],
      [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, null, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
      [{ type: 'r', color: 'w' }, null, null, null, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, null, { type: 'r', color: 'w' }],
    ],
  },
  {
    evalText: '+0.0',
    bestMove: 'd4',
    position: [
      [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
      [{ type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
      [null, null, null, null, null, null, null, null],
      [null, { type: 'p', color: 'b' }, null, null, null, { type: 'p', color: 'w' }, null, null],
      [null, null, null, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, null, null, null],
      [null, null, null, null, null, null, null, null],
      [{ type: 'p', color: 'w' }, null, { type: 'p', color: 'w' }, null, { type: 'p', color: 'w' }, null, null, { type: 'p', color: 'w' }],
      [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, null, null, { type: 'r', color: 'w' }],
    ],
  },
]

function DynamicChessBoard({ className = '' }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % BOARD_STATES.length)
        setVisible(true)
      }, 350)
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  const state = BOARD_STATES[index]

  return (
    <div className={`qc-home-hero-board ${className}`}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={index}
            className="qc-home-hero-board-grid"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {state.position.map((row, r) =>
              row.map((cell, c) => {
                const isLight = (r + c) % 2 === 0
                const isHighlighted = (r === 3 && c === 5) || (r === 4 && c === 4)
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`qc-home-hero-board-cell ${isLight ? 'light' : 'dark'} ${isHighlighted ? 'highlighted' : ''}`}
                  >
                     {cell && (
                       <ChessPiece type={cell.type} color={cell.color} />
                     )}
                  </div>
                )
              }),
            )}
            <div className="qc-home-hero-board-arrow" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="qc-home-hero-ai-float top-right">
        <div className="qc-home-hero-ai-float-label">EVALUATION</div>
        <div className="qc-home-hero-ai-float-value qc-home-hero-eval-value">{state.evalText}</div>
      </div>
      <div className="qc-home-hero-ai-float bottom-left">
        <div className="qc-home-hero-ai-float-label">BEST MOVE</div>
        <div className="qc-home-hero-ai-float-value gold">{state.bestMove}</div>
      </div>
    </div>
  )
}

function HomeHero({ mode = 'guest', userName }) {
  const isGuest = mode === 'guest'

  const getSubtext = () => {
    if (isGuest) {
      return 'Your personal AI chess coach analyzes every move, finds your weaknesses, and turns every game into a personalized training session.'
    }
    return 'Sharpen your skills with AI-powered training, master every game, and climb the ratings.'
  }

  return (
    <section className={`qc-home-hero ${isGuest ? '' : 'qc-home-hero-logged-in'}`}>
      <div className="qc-home-hero-glow qc-home-hero-glow-1" aria-hidden="true" />
      <div className="qc-home-hero-glow qc-home-hero-glow-2" aria-hidden="true" />
      {isGuest && (
        <>
          <div className="qc-home-hero-piece qc-home-hero-queen" aria-hidden="true">♛</div>
          <div className="qc-home-hero-piece qc-home-hero-knight" aria-hidden="true">♞</div>
        </>
      )}

      <div className="qc-home-hero-content">
        <div className="qc-home-hero-badge">
          <span className="qc-home-hero-badge-dot" aria-hidden="true" />
          {isGuest ? 'AI Chess Training Suite' : `Welcome back, ${userName || 'Player'}`}
        </div>
        <h1 className="qc-home-hero-title">
          Train Smarter.<br />
          <span className="qc-home-hero-accent">Play Stronger.</span>
        </h1>
        <p className={`qc-home-hero-sub ${isGuest ? '' : 'qc-home-hero-sub-logged-in'}`}>
          {getSubtext()}
        </p>
        <div className="qc-home-hero-actions">
          {isGuest ? (
            <>
              <Button as={NavLink} to="/play" size="lg" variant="primary" leftIcon={Play}>
                Play a Game
              </Button>
              <Button as={NavLink} to="/login" size="lg" variant="secondary" leftIcon={Play}>
                Sign In
              </Button>
            </>
          ) : (
            <>
              <Button as={NavLink} to="/learning" size="md" variant="primary" leftIcon={Brain} rightIcon={Crown}>
                Continue Training
              </Button>
              <Button as={NavLink} to="/play" size="md" variant="secondary" leftIcon={Play}>
                Play a Game
              </Button>
            </>
          )}
        </div>
      </div>

      {isGuest ? (
        <div className="qc-home-hero-visual">
          <DynamicChessBoard />
          <div className="qc-home-hero-float-card">
            <div className="qc-home-hero-float-card-icon">
              <Brain className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <p className="qc-home-hero-float-card-title">AI Coach</p>
              <p className="qc-home-hero-float-card-sub">Get personalized tips</p>
            </div>
          </div>
          <div className="qc-home-hero-float-card">
            <div className="qc-home-hero-float-card-icon">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <p className="qc-home-hero-float-card-title">Tactical Training</p>
              <p className="qc-home-hero-float-card-sub">Improve your vision</p>
            </div>
          </div>
          <div className="qc-home-hero-float-card">
            <div className="qc-home-hero-float-card-icon">
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <p className="qc-home-hero-float-card-title">Opening Mastery</p>
              <p className="qc-home-hero-float-card-sub">Master openings like a pro</p>
            </div>
          </div>
          <div className="qc-home-hero-piece-float qc-home-hero-queen-float" aria-hidden="true">♛</div>
          <div className="qc-home-hero-piece-float qc-home-hero-knight-float" aria-hidden="true">♞</div>
          <div className="qc-home-hero-particle qc-home-hero-particle-1" aria-hidden="true" />
          <div className="qc-home-hero-particle qc-home-hero-particle-2" aria-hidden="true" />
          <div className="qc-home-hero-particle qc-home-hero-particle-3" aria-hidden="true" />
        </div>
      ) : (
        <div className="qc-home-hero-visual" aria-hidden="true" />
      )}
    </section>
  )
}

function QuickActionCard({ label, to, icon: Icon, subtitle, variant = 'ghost' }) {
  return (
    <NavLink
      to={to}
      className={`qc-dashboard-quick-action-card qc-dashboard-quick-action-card-${variant}`}
    >
      <div className="qc-dashboard-quick-action-icon">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="qc-dashboard-quick-action-title">{label}</p>
        {subtitle && <p className="qc-dashboard-quick-action-subtitle">{subtitle}</p>}
      </div>
      <ChevronRight className="h-3.5 w-3.5 qc-dashboard-quick-action-arrow" aria-hidden="true" />
    </NavLink>
  )
}

function QuickActions() {
  const actions = [
    { label: 'AI Coach', to: '/learning', icon: Brain, subtitle: 'Personalized guidance', variant: 'primary' },
    { label: 'Tactical Training', to: '/quiz', icon: Target, subtitle: 'Sharpen your tactics', variant: 'ghost' },
    { label: 'Opening Mastery', to: '/learning', icon: Crown, subtitle: 'Master the openings', variant: 'ghost' },
    { label: 'Review Games', to: '/my-games', icon: Swords, subtitle: 'Analyze your games', variant: 'ghost' },
  ]

  return (
    <div className="qc-dashboard-quick-actions">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <QuickActionCard
            key={action.label}
            label={action.label}
            to={action.to}
            icon={Icon}
            subtitle={action.subtitle}
            variant={action.variant}
          />
        )
      })}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent = 'purple', trend }) {
  const accentColors = {
    purple: 'var(--qc-purple-light)',
    gold: 'var(--qc-gold)',
    green: 'var(--qc-success)',
  }
  const accentBg = {
    purple: 'rgba(122,53,212,0.12)',
    gold: 'rgba(201,164,81,0.12)',
    green: 'rgba(74,191,138,0.12)',
  }
  const borderColor = accent === 'purple' ? 'rgba(122,53,212,0.18)' : accent === 'gold' ? 'rgba(201,164,81,0.18)' : 'rgba(74,191,138,0.18)'

  return (
    <Card className="dashboard-stat-card" accent={accent} padded={false}>
      <div className="flex items-center justify-between gap-2">
        <div
          className="dashboard-stat-icon"
          style={{
            background: accentBg[accent],
            color: accentColors[accent],
            borderColor,
          }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        {trend && (
          <span
            className="dashboard-trend"
            style={{
              background: 'rgba(74,191,138,0.12)',
              color: 'var(--qc-success)',
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xl font-extrabold qc-text-primary leading-tight">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] qc-text-muted">
        {label}
      </p>
    </Card>
  )
}

function DashboardStatCard({ label, value, icon: Icon, accent = 'purple', trend }) {
  const accentColors = {
    purple: 'var(--qc-purple-light)',
    gold: 'var(--qc-gold)',
    green: 'var(--qc-success)',
  }
  const accentBg = {
    purple: 'rgba(122,53,212,0.12)',
    gold: 'rgba(201,164,81,0.12)',
    green: 'rgba(74,191,138,0.12)',
  }
  const borderColor = accent === 'purple' ? 'rgba(122,53,212,0.18)' : accent === 'gold' ? 'rgba(201,164,81,0.18)' : 'rgba(74,191,138,0.18)'

  return (
    <Card className="dashboard-stat-card" accent={accent} padded={false}>
      <div className="flex items-center justify-between gap-2">
        <div
          className="dashboard-stat-icon"
          style={{
            background: accentBg[accent],
            color: accentColors[accent],
            borderColor,
          }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        {trend && (
          <span
            className="dashboard-trend"
            style={{
              background: 'rgba(74,191,138,0.12)',
              color: 'var(--qc-success)',
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xl font-extrabold qc-text-primary leading-tight">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] qc-text-muted">
        {label}
      </p>
    </Card>
  )
}

function ContinueTraining({ data }) {
  const goal = data?.todayGoal
  const training = data?.todayTraining?.[0]

  const item = goal || training
  if (!item) return null

  const progress = goal?.progress ?? training?.progress ?? 0
  const isComplete = goal?.completed || false

  return (
    <Card className="qc-continue-card">
      <div className="qc-continue-card-header">
        <div className="qc-continue-card-icon">
          <Brain className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="qc-continue-card-title">Continue Training</h3>
          <p className="qc-continue-card-desc">{item.title || item.description || 'Keep up the momentum'}</p>
        </div>
        {isComplete && (
          <Badge tone="success" size="sm">Done</Badge>
        )}
      </div>
      {progress > 0 && (
        <div className="qc-continue-progress">
          <div className="qc-continue-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] qc-text-muted">{progress}% complete</span>
        <Button as={NavLink} to="/learning" size="sm" variant="primary" rightIcon={ChevronRight}>
          Continue
        </Button>
      </div>
    </Card>
  )
}

function DashboardRecentGames({ games }) {
  return (
    <Card className="dashboard-panel p-0">
      <div className="dashboard-panel-header">
        <div>
          <h2>Recent Games</h2>
          <p>Latest match activity</p>
        </div>
          <NavLink to="/my-games" className="dashboard-text-link">
          View all
        </NavLink>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {(games?.length ? games : []).slice(0, 4).map((game, index) => {
          const result = outcomeLabel(game)
          const isWin = result === 'Victory'
          const isLoss = result === 'Defeat'
          const rating = game.ratingsAfter?.player1 || game.ratingSnapshot?.after || 1200
          const change = game.ratingChange || game.ratingSnapshot?.change || 0
          const timeAgo = formatTimeAgo(game.createdAt)
          const opponentName = game.opponent || game.opening?.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'AI Training Game'

          return (
            <div key={game.id || index} className="qc-dashboard-game-row">
              <div className="qc-dashboard-game-avatar">
                <Swords className="h-3 w-3" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold qc-text-primary">
                  vs {opponentName}
                </p>
                <p className="text-[10px] qc-text-muted">
                  {game.difficulty || 'AI'}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-bold qc-text-primary">{rating}</p>
                <p
                  className={`text-[10px] font-bold ${change >= 0 ? 'qc-text-success' : 'qc-text-error'}`}
                >
                  {change >= 0 ? '+' : ''}{change}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-[11px] font-extrabold ${
                    isWin
                      ? 'qc-text-success'
                      : isLoss
                        ? 'qc-text-error'
                        : 'qc-text-secondary'
                  }`}
                >
                  {result}
                </p>
                <span className="qc-dashboard-game-time">{timeAgo}</span>
              </div>
            </div>
          )
        })}
        {!games?.length && (
          <div className="dashboard-empty-row">
            <Swords className="h-5 w-5 qc-text-gold" aria-hidden="true" />
            <span>No recent games yet. Start one from Play.</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function GuestHome() {
  const stats = [
    { label: 'AI-Powered', value: 'Training', icon: Brain, accent: 'purple' },
    { label: 'Analysis', value: 'Deep', icon: Gauge, accent: 'purple' },
  ]

  return (
    <PageContainer maxWidth="max-w-[1320px]" className="qc-home-page">
      <HomeHero mode="guest" />

      <RevealSection delay={100}>
        <div className="qc-home-stats">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </RevealSection>

      <RevealSection delay={200}>
        <div className="qc-home-main-grid">
          <Card className="dashboard-panel p-4">
            <div className="dashboard-panel-header" style={{ padding: 0, border: 'none' }}>
              <div>
                <h2>Train with AI</h2>
                <p>Personalized coaching that adapts to your style</p>
              </div>
              <Brain className="h-5 w-5 qc-text-gold" aria-hidden="true" />
            </div>
            <p className="text-[11px] qc-text-secondary" style={{ lineHeight: 1.6, marginTop: 8 }}>
              Every move you make is analyzed. Every weakness is identified. Every training session is tailored to help you improve faster than ever before.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge tone="primary">Tactics</Badge>
              <Badge tone="accent">Openings</Badge>
              <Badge tone="neutral">Endgames</Badge>
              <Badge tone="warning">Analysis</Badge>
            </div>
          </Card>
          <div className="qc-home-right-col">
            <Card className="dashboard-puzzle-card p-4">
              <div className="dashboard-puzzle-mark">
                <Puzzle className="h-5 w-5" aria-hidden="true" />
              </div>
              <Badge tone="warning" size="sm" className="mb-2">
                Daily Puzzle
              </Badge>
              <h3 className="text-sm font-extrabold qc-text-primary">Tactical Calibration</h3>
              <p className="text-[11px] qc-text-secondary">Solve a compact position to keep calculation sharp.</p>
              <Button as={NavLink} to="/login" size="sm" variant="gold" rightIcon={ArrowRight} className="mt-3">
                Sign In to Play
              </Button>
            </Card>
            <Card className="dashboard-panel p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="dashboard-stat-icon gold">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--qc-text-primary)', margin: 0 }}>Track Progress</h2>
                  <p style={{ fontSize: 11, color: 'var(--qc-text-muted)', margin: '2px 0 0' }}>Monitor your rating and performance</p>
                </div>
              </div>
              <p className="text-[11px] qc-text-secondary" style={{ lineHeight: 1.5 }}>
                Detailed statistics, rating trends, and performance breakdowns for every game mode.
              </p>
            </Card>
          </div>
        </div>
      </RevealSection>
    </PageContainer>
  )
}

// =====================
// LOGGED-IN DASHBOARD HOME
// =====================

function DashboardHome() {
  const dashboardQuery = useApi(
    useCallback(() => learningApi.getDashboard().then((res) => res.data?.data || res.data), []),
    { immediate: true },
  )

  const gamesQuery = useApi(
    useCallback(
      () => gameApi.listMyGames({ take: 5 }).then((res) => res.data?.data ?? res.data ?? res),
      [],
    ),
    { immediate: true },
  )

  const data = dashboardQuery.data || {}
  const games = gamesQuery.data || []

  const lp = data.learningProgress || {}
  const userName = data.welcome?.name || 'Player'

  const stats = [
    {
      label: 'Rating',
      value: (data.rating?.rapid || 1200).toLocaleString('en-US'),
      icon: Gauge,
      accent: 'purple',
      trend: data.rating?.change ? `${data.rating.change >= 0 ? '+' : ''}${data.rating.change}` : undefined,
    },
    {
      label: 'Games Played',
      value: (lp.totalGames || 0).toLocaleString('en-US'),
      icon: Trophy,
      accent: 'gold',
    },
    {
      label: 'Accuracy',
      value: `${(lp.avgAccuracy || 0).toLocaleString('en-US')}%`,
      icon: Target,
      accent: 'green',
    },
    {
      label: 'Training Streak',
      value: `${(data.dailyStreak?.count || 0).toLocaleString('en-US')} days`,
      icon: Flame,
      accent: 'purple',
    },
  ]

  if (dashboardQuery.loading) {
    return (
      <PageContainer maxWidth="max-w-[1320px]">
        <div className="flex items-center justify-center py-12">
          <div className="qc-spinner" />
        </div>
      </PageContainer>
    )
  }

  if (dashboardQuery.error) {
    return (
      <PageContainer maxWidth="max-w-[1320px]">
        <div className="py-10 text-center">
          <p className="text-sm qc-text-secondary">
            {dashboardQuery.error.message || 'Failed to load dashboard.'}
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={dashboardQuery.refetch}>
            Retry
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="max-w-[1320px]" className="qc-dashboard-page">
      <HomeHero mode="logged-in" userName={userName} />

      <RevealSection delay={100}>
        <QuickActions />
      </RevealSection>

      <RevealSection delay={150}>
        <div className="qc-dashboard-stat-grid">
          {stats.map((stat) => (
            <DashboardStatCard key={stat.label} {...stat} />
          ))}
        </div>
      </RevealSection>

      <RevealSection delay={200}>
        <div className="qc-dashboard-main-grid">
          <div className="qc-dashboard-left-col">
            <ContinueTraining data={data} />
          </div>
          <div className="qc-dashboard-right-col">
            <DashboardRecentGames games={games} />
          </div>
        </div>
      </RevealSection>
    </PageContainer>
  )
}

// =====================
// ROOT HOME
// =====================

function Home() {
  const { isAuthenticated } = useAuth()
  const forceAuthenticated = import.meta.env.DEV || import.meta.env.VITE_FORCE_AUTH === 'true'

  if (!isAuthenticated && !forceAuthenticated) {
    return <GuestHome />
  }

  return <DashboardHome />
}

export default Home