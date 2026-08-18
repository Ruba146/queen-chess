import { Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import ChessPiece from '../../components/chess/ChessPiece'

function PlayerCard({ name, rating, time, captured = [], color, active, isAI = false }) {
  return (
    <Card className={`play-player-card p-2.5 transition-colors ${active ? 'is-active' : ''}`}>
      <div className="flex items-center gap-2.5">
        <Avatar name={name} size="sm" status={active ? 'online' : null} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-xs font-bold qc-text-primary">{name}</h3>
            {active && (
              <span className="inline-block h-1.5 w-1.5 rounded-full qc-dot-accent qc-shadow-accent" />
            )}
            {isAI && (
              <Badge tone="neutral" size="sm" className="text-[9px] px-1.5 py-0.5">
                AI
              </Badge>
            )}
          </div>
          <p className="text-[10px] qc-text-muted">Rating {rating}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md qc-border-weak qc-bg-card px-2 py-1">
          <Clock className="h-3 w-3 qc-text-gold" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold qc-text-primary">{time}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--qc-border)] pt-2">
        <div className="flex min-h-[1rem] items-center gap-1">
          {captured.length > 0 ? (
            captured.map((c, i) => (
              <ChessPiece key={`${c.type}-${i}`} type={c.type} color={c.color} size={16} />
            ))
          ) : (
            <span className="text-[10px] qc-text-muted">No captures</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] qc-text-muted">
          <span className="inline-flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${color === 'White' ? 'bg-gradient-to-br from-white to-slate-300' : 'bg-[var(--qc-bg-primary)] ring-1 ring-[var(--qc-text-muted)]'}`} />
            {color}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default PlayerCard


