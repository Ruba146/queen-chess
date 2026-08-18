import { useState } from 'react'
import { Play, Swords, Bot, Clock, User, Crown, Zap, Shield } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', rating: 800, desc: 'Casual play', icon: '♟' },
  { value: 'intermediate', label: 'Intermediate', rating: 1200, desc: 'Balanced', icon: '♞' },
  { value: 'advanced', label: 'Advanced', rating: 1600, desc: 'Competitive', icon: '♝' },
  { value: 'master', label: 'Master', rating: 2200, desc: 'Expert', icon: '♛' },
]

const COLORS = [
  { value: 'white', label: 'White', icon: '♔', accent: '#F4F1F7' },
  { value: 'black', label: 'Black', icon: '♚', accent: '#12101C' },
  { value: 'random', label: 'Random', icon: '🎲', accent: 'linear-gradient(135deg, #F4F1F7, #12101C)' },
]

const TIME_CONTROLS = [
  { label: '1+0', value: '1+0', desc: 'Blitz' },
  { label: '3+2', value: '3+2', desc: 'Blitz' },
  { label: '5+0', value: '5+0', desc: 'Rapid' },
  { label: '10+0', value: '10+0', desc: 'Rapid' },
]

function StartScreen({ onStart, userRating }) {
  const [color, setColor] = useState('white')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [timeControl, setTimeControl] = useState('5+0')

  const selectedDifficulty = DIFFICULTIES.find((d) => d.value === difficulty) || DIFFICULTIES[1]
  const aiRating = selectedDifficulty.rating

  return (
    <div className="play-setup-layout">
      <div className="play-setup-main">
        <div className="play-setup-hero mb-4">
          <div className="play-setup-hero-glow" aria-hidden="true" />
          <div className="play-setup-hero-content">
            <Badge tone="warning" size="sm" className="mb-3">
              <Crown className="h-3 w-3" aria-hidden="true" />
              New Match
            </Badge>
            <h1 className="play-setup-title">
              Challenge <span className="qc-text-gradient-gold">Queen AI</span>
            </h1>
            <p className="play-setup-desc">
              Choose your color, tune the difficulty, and start a premium training match.
            </p>
          </div>
          <div className="play-setup-hero-visual" aria-hidden="true">
            <div className="play-setup-hero-board">
              <div className="play-setup-hero-board-grid">
                {Array(8).fill(null).map((_, r) =>
                  Array(8).fill(null).map((_, c) => {
                    const isLight = (r + c) % 2 === 0
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`play-setup-hero-cell ${isLight ? 'light' : 'dark'}`}
                      />
                    )
                  }),
                )}
              </div>
              <div className="play-setup-hero-float top-right">
                <Zap className="h-3 w-3 qc-text-gold" aria-hidden="true" />
                <span className="text-[10px] font-bold qc-text-primary">AI Ready</span>
              </div>
              <div className="play-setup-hero-float bottom-left">
                <Shield className="h-3 w-3 qc-text-gold" aria-hidden="true" />
                <span className="text-[10px] font-bold qc-text-primary">{aiRating} ELO</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="play-setup-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] qc-text-muted">
                Your Color
              </p>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center transition-all ${
                      color === option.value
                        ? 'qc-border-accent qc-bg-accent-soft qc-text-primary shadow-glow'
                        : 'qc-border qc-bg-card qc-text-secondary qc-hover-bg-card-hover'
                    }`}
                  >
                    <span className="text-xl leading-none">{option.icon}</span>
                    <span className="text-[11px] font-bold">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] qc-text-muted">
                Time Control
              </p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_CONTROLS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTimeControl(option.value)}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-all ${
                      timeControl === option.value
                        ? 'qc-border-accent qc-bg-accent-soft qc-text-primary shadow-glow'
                        : 'qc-border qc-bg-card qc-text-secondary qc-hover-bg-card-hover'
                    }`}
                  >
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span className="text-[11px] font-bold">{option.label}</span>
                    <span className="text-[9px] qc-text-muted">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] qc-text-muted">
              AI Difficulty
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-all ${
                    difficulty === option.value
                      ? 'qc-border-accent qc-bg-accent-soft qc-text-primary shadow-glow'
                      : 'qc-border qc-bg-card qc-text-secondary qc-hover-bg-card-hover'
                  }`}
                >
                  <span className="text-lg leading-none">{option.icon}</span>
                  <span className="text-xs font-extrabold">{option.label}</span>
                  <span className="text-[10px] qc-text-muted">{option.desc}</span>
                  <span className="text-[10px] font-mono qc-text-gold">{option.rating}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg qc-border qc-bg-card px-4 py-2.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 qc-text-gold" aria-hidden="true" />
              <span className="text-xs qc-text-secondary">Your rating</span>
            </div>
            <span className="font-mono text-sm font-bold qc-text-primary">{userRating ?? '—'}</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={Play}
            rightIcon={Crown}
            onClick={() => onStart({ color, difficulty, timeControl })}
            className="mt-3"
          >
            Start Match
          </Button>
        </Card>
      </div>

      <div className="play-setup-side">
        <Card className="play-setup-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg qc-gradient-accent">
              <Bot className="h-5 w-5 qc-text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold qc-text-primary">Queen AI</h3>
              <p className="text-[10px] qc-text-muted">Your opponent</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md qc-border qc-bg-card px-3 py-2">
              <span className="text-[11px] qc-text-secondary">Difficulty</span>
              <Badge tone="accent" size="sm">{selectedDifficulty.label}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md qc-border qc-bg-card px-3 py-2">
              <span className="text-[11px] qc-text-secondary">AI Rating</span>
              <span className="font-mono text-sm font-bold qc-text-primary">{aiRating}</span>
            </div>
            <div className="flex items-center justify-between rounded-md qc-border qc-bg-card px-3 py-2">
              <span className="text-[11px] qc-text-secondary">Time Control</span>
              <span className="font-mono text-sm font-bold qc-text-primary">{timeControl}</span>
            </div>
            <div className="flex items-center justify-between rounded-md qc-border qc-bg-card px-3 py-2">
              <span className="text-[11px] qc-text-secondary">Mode</span>
              <span className="text-sm font-bold qc-text-primary">AI vs Human</span>
            </div>
          </div>
        </Card>

        <Card className="play-setup-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Swords className="h-4 w-4 qc-text-gold" aria-hidden="true" />
            <h3 className="text-xs font-extrabold qc-text-primary uppercase tracking-wider">Match Preview</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl mb-1">{color === 'black' ? '♚' : '♔'}</div>
              <p className="text-[10px] qc-text-muted">You</p>
              <p className="text-xs font-bold qc-text-primary">{userRating ?? '-'}</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold qc-text-gold">VS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">{color === 'white' ? '♚' : '♔'}</div>
              <p className="text-[10px] qc-text-muted">Queen AI</p>
              <p className="text-xs font-bold qc-text-primary">{aiRating}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default StartScreen
