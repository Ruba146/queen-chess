import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

function MoveHistory({ moves = [] }) {
  const rows = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      no: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    })
  }

  return (
    <Card className="flex flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-wider qc-text-muted">
          Moves
        </h3>
        <Badge tone="neutral" size="sm" className="text-[10px] px-1.5 py-0.5">
          {moves.length}
        </Badge>
      </div>

      {moves.length === 0 ? (
        <p className="py-3 text-center text-[10px] qc-text-muted">
          No moves yet — make your first move.
        </p>
      ) : (
        <div className="scrollbar-thin max-h-52 overflow-y-auto">
          <div className="grid grid-cols-[1.5rem_1fr_1fr] gap-x-1.5 gap-y-0.5 text-[11px]">
            <div className="pb-1 text-[9px] font-semibold qc-text-muted">#</div>
            <div className="pb-1 text-[9px] font-semibold qc-text-muted">White</div>
            <div className="pb-1 text-[9px] font-semibold qc-text-muted">Black</div>
            {rows.map((row) => (
              <div key={row.no} className="contents">
                <span className="py-0.5 qc-text-muted">{row.no}.</span>
                <span className="rounded px-1.5 py-0.5 font-mono text-[10px] qc-text-gold qc-bg-accent-soft">
                  {row.white}
                </span>
                <span className="rounded px-1.5 py-0.5 font-mono text-[10px] qc-text-secondary">
                  {row.black || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default MoveHistory

