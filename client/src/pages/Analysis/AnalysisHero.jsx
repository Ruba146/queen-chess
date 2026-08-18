import { Clock, Calendar, Gauge, Swords } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const total = Math.max(0, Math.round(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function AnalysisHero({ game }) {
  const moves = Array.isArray(game?.moves) ? game.moves : []
  const totalMoves = moves.length
  const fullMoves = Math.ceil(totalMoves / 2)

  const resultLabel =
    game?.result === 'draw'
      ? 'Draw'
      : game?.result === 'White'
        ? '1–0'
        : game?.result === 'Black'
          ? '0–1'
          : '—'

  const resultTone =
    game?.result === 'draw'
      ? 'neutral'
      : game?.result === 'White'
        ? 'success'
        : game?.result === 'Black'
          ? 'danger'
          : 'neutral'

  const opening = game?.opening || 'Unknown Opening'
  const duration = formatDuration(game?.duration)
  const date = formatDate(game?.createdAt)
  const ratingAfter = game?.ratingAfterGame || game?.ratingsAfter?.player1 || 1200
  const ratingChange = game?.ratingChange || 0

  return (
    <section className="qc-card qc-card-elevated relative overflow-hidden p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 qc-bg-accent-radial"
      />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent" size="sm" icon={Swords}>
              Game Review
            </Badge>
            <Badge tone={resultTone} dot>
              {resultLabel}
            </Badge>
            {ratingChange !== 0 && (
              <Badge tone={ratingChange > 0 ? 'success' : 'danger'} size="sm">
                {ratingChange > 0 ? '+' : ''}{ratingChange}
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-lg font-extrabold qc-text-primary sm:text-xl">
              {opening}
            </h1>
            <p className="mt-1 text-xs qc-text-secondary">
              {totalMoves > 0
                ? `${fullMoves} full moves · ${duration}`
                : 'Engine review of your saved game.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] qc-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {duration}
            </span>
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              {ratingAfter.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" aria-hidden="true" />
              {totalMoves} moves
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-extrabold qc-text-primary leading-none">{resultLabel}</p>
            <p className="mt-1 text-[10px] qc-text-muted uppercase tracking-wider">Result</p>
          </div>
          <Avatar name="Queen AI" size="md" />
        </div>
      </div>
    </section>
  )
}

export default AnalysisHero
