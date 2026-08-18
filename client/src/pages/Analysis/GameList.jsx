import { Swords, ChevronRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/common/EmptyState'
import LoadingState from '../../components/common/LoadingState'
import Button from '../../components/ui/Button'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-US')
  } catch {
    return '—'
  }
}

function moveCount(game) {
  if (Array.isArray(game.moves)) return game.moves.length
  if (game.totalMoves) return game.totalMoves
  return 0
}

function GameList({ games, loading, error, selectedId, onSelect, onRetry }) {
  if (loading) {
    return <LoadingState label="Loading your games..." />
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-xs qc-text-secondary">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Card>
    )
  }

  if (!games || games.length === 0) {
    return (
      <Card className="p-4">
        <EmptyState
          icon={Swords}
          title="No saved games yet"
          description="Play a game first, then come back to review it."
        />
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold qc-text-primary">My Games</h3>
          <p className="text-xs qc-text-muted">
            {games.length} saved {games.length === 1 ? 'game' : 'games'}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const outcomeTone =
            game.result === 'White'
              ? game.playerColor === 'white'
                ? 'success'
                : 'danger'
              : game.result === 'Black'
                ? game.playerColor === 'black'
                  ? 'success'
                  : 'danger'
                : 'neutral'
          const outcomeLabel =
            game.result === 'draw'
              ? 'Draw'
              : game.result === 'White'
                ? game.playerColor === 'white'
                  ? 'Win'
                  : 'Loss'
                : game.result === 'Black'
                  ? game.playerColor === 'black'
                    ? 'Win'
                    : 'Loss'
                  : '—'
          const moves = moveCount(game)
          const opponentName = game.opponent || (game.opening && game.opening !== 'Unknown Opening' ? game.opening.replace(/[^a-zA-Z0-9 ]/g, '').trim() : 'AI Training Game')
          const rating = game.ratingsAfter?.player1 || game.ratingSnapshot?.after || 1200
          const change = game.ratingChange || game.ratingSnapshot?.change || 0
          const timeAgo = formatDate(game.createdAt)
          const mode = game.mode || game.difficulty || 'rapid'

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => onSelect(game)}
              className={`qc-card p-4 text-left transition-all duration-200 ease-out group ${
                selectedId === game.id
                  ? 'qc-border-accent qc-bg-accent-soft'
                  : 'qc-border qc-bg-card hover:qc-bg-card-hover hover:border-white/10'
              }`}
              aria-pressed={selectedId === game.id}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg qc-gradient-accent-soft qc-shadow-accent">
                  <Swords className="h-4 w-4 qc-text-gold" aria-hidden="true" />
                </div>
                <Badge tone={outcomeTone} size="sm">
                  {outcomeLabel}
                </Badge>
              </div>

              <div className="min-w-0 flex-1 mb-2">
                <p className="truncate text-sm font-bold qc-text-primary">
                  vs {opponentName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] qc-text-muted">{mode}</span>
                  <span className="h-1 w-1 rounded-full qc-dot-muted" />
                  <span className="text-[10px] qc-text-muted">{moves} moves</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--qc-border)]">
                <div className="text-right">
                  <p className="text-xs font-bold qc-text-primary">{rating.toLocaleString('en-US')}</p>
                  <p
                    className={`text-[10px] font-bold ${change >= 0 ? 'qc-text-success' : 'qc-text-error'}`}
                  >
                    {change >= 0 ? '+' : ''}{change}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] qc-text-muted">{timeAgo}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 qc-text-muted group-hover:qc-text-primary transition-colors" aria-hidden="true" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default GameList

