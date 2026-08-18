import Card from '../../components/ui/Card'

function Insights({ moveCount, capturedWhite, capturedBlack, gameStarted, moveAnalysis }) {
  const items = [
    { label: 'Moves', value: String(moveCount), tone: 'qc-text-primary' },
    { label: 'Captures', value: String(capturedWhite.length + capturedBlack.length), tone: 'qc-text-primary' },
    { label: 'W Captured', value: String(capturedWhite.length), tone: 'qc-text-gold' },
    { label: 'B Captured', value: String(capturedBlack.length), tone: 'qc-text-error' },
  ]

  const stats = (() => {
    if (!moveAnalysis || moveAnalysis.length === 0) return null
    let totalLoss = 0
    let bestMoves = 0
    let brilliantMoves = 0
    let mistakes = 0
    let blunders = 0
    let inaccuracies = 0
    for (const m of moveAnalysis) {
      totalLoss += m.loss
      if (m.classification === 'Best') bestMoves++
      if (m.classification === 'Brilliant') brilliantMoves++
      if (m.classification === 'Mistake') mistakes++
      if (m.classification === 'Blunder') blunders++
      if (m.classification === 'Inaccuracy') inaccuracies++
    }
    const avgCpl = Math.round(totalLoss / moveAnalysis.length)
    const accuracy = Math.max(0, Math.min(100, Math.round(100 - avgCpl / 2)))
    return { accuracy, avgCpl, bestMoves, brilliantMoves, mistakes, blunders, inaccuracies }
  })()

  const perfItems = stats
    ? [
        { label: 'Accuracy', value: `${stats.accuracy}%`, tone: 'qc-text-success' },
        { label: 'Avg CPL', value: String(stats.avgCpl), tone: 'qc-text-secondary' },
        { label: 'Best', value: String(stats.bestMoves), tone: 'qc-text-gold' },
        { label: 'Brilliant', value: String(stats.brilliantMoves), tone: 'qc-text-accent' },
        { label: 'Mistakes', value: String(stats.mistakes), tone: 'qc-text-warning' },
        { label: 'Blunders', value: String(stats.blunders), tone: 'qc-text-error' },
      ]
    : items

  return (
    <Card className="p-3">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider qc-text-muted">
        Insights
      </h3>
      {!gameStarted && moveCount === 0 ? (
        <p className="py-3 text-center text-[10px] qc-text-muted">
          No data yet — start a match.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {perfItems.map((item) => (
            <div
              key={item.label}
              className="rounded-md qc-border-weak qc-bg-elevated p-2 text-center"
            >
              <p className={`text-sm font-bold ${item.tone}`}>{item.value}</p>
              <p className="mt-0.5 text-[9px] qc-text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default Insights
