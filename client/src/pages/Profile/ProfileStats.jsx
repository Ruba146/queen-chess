import {
  Gamepad2,
  Trophy,
  TrendingUp,
  Swords,
  Target,
  Flame,
  Gauge,
  Activity,
  Medal,
  BookOpen,
  Dumbbell,
  Star,
  Layers,
  Crown,
} from 'lucide-react'
import SectionTitle from '../../components/ui/SectionTitle'

const STAT_META = [
  { key: 'rating', label: 'Rating', icon: Star, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'rank', label: 'Rank', icon: Medal, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'tier', label: 'Tier', icon: Layers, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'gamesPlayed', label: 'Games Played', icon: Gamepad2, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'wins', label: 'Wins', icon: Trophy, tone: 'qc-text-success', bg: 'rgba(74,191,138,0.12)' },
  { key: 'losses', label: 'Losses', icon: TrendingUp, tone: 'qc-text-error', bg: 'rgba(248,113,113,0.12)' },
  { key: 'draws', label: 'Draws', icon: Swords, tone: 'qc-text-muted', bg: 'rgba(255,255,255,0.06)' },
  { key: 'winRate', label: 'Win Rate', icon: Target, tone: 'qc-text-success', bg: 'rgba(74,191,138,0.12)' },
  { key: 'currentStreak', label: 'Current Streak', icon: Flame, tone: 'qc-text-warning', bg: 'rgba(212,167,90,0.12)' },
  { key: 'avgAccuracy', label: 'Avg Accuracy', icon: Gauge, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'consistency', label: 'Consistency', icon: Activity, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'playerLevel', label: 'Player Level', icon: Crown, tone: 'qc-text-warning', bg: 'rgba(212,167,90,0.12)' },
  { key: 'favoriteOpening', label: 'Favorite Opening', icon: BookOpen, tone: 'qc-text-gold', bg: 'rgba(201,164,81,0.12)' },
  { key: 'mostPlayedDifficulty', label: 'Difficulty', icon: Dumbbell, tone: 'qc-text-muted', bg: 'rgba(255,255,255,0.06)' },
]

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'avgAccuracy' || key === 'consistency') return `${value}%`
  if (key === 'favoriteOpening' || key === 'mostPlayedDifficulty') {
    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return value
}

function ProfileStats({ stats }) {
  return (
    <section className="qc-section">
      <SectionTitle eyebrow="Statistics" title="Career numbers" className="qc-section-head mb-4" />
      <div className="qc-stat-grid">
        {STAT_META.map((stat) => {
          const Icon = stat.icon
          const value = stats?.[stat.key]
          return (
            <div key={stat.key} className="qc-stat-card">
              <div className="qc-stat-icon" style={{ background: stat.bg }}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.tone}`} aria-hidden="true" />
              </div>
              <p className="qc-stat-value">{formatValue(stat.key, value)}</p>
              <p className="qc-stat-label">{stat.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ProfileStats
