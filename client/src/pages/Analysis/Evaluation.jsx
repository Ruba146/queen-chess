import { ScanLine } from 'lucide-react'
import Card from '../../components/ui/Card'
import SectionTitle from '../../components/ui/SectionTitle'
import EmptyState from '../../components/common/EmptyState'

function Evaluation({ evaluationData }) {
  const data = Array.isArray(evaluationData) ? evaluationData : []
  const hasData = data.length > 0

  const points = data
    .map((point, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 0
      const value = typeof point?.playerEval === 'number' ? point.playerEval : 0
      const clamped = Math.max(-500, Math.min(500, value))
      const y = 50 - (clamped / 500) * 45
      return `${x},${y}`
    })
    .join(' ')

  const currentEval = data.length > 0 ? data[data.length - 1]?.playerEval || 0 : 0
  const evalLabel = currentEval > 0 ? `+${currentEval}` : `${currentEval}`

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="Evaluation"
        title="Engine evaluation"
        className="mb-4"
      />
      <Card className="p-4">
        {!hasData ? (
          <EmptyState
            icon={ScanLine}
            title="No evaluation data"
            description="The evaluation graph will appear once the engine analysis is available."
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] qc-text-muted">
                Evaluation over {data.length} positions
              </span>
              <span className={`text-sm font-extrabold ${currentEval >= 0 ? 'qc-text-success' : 'qc-text-error'}`}>
                {evalLabel}
              </span>
            </div>
            <div className="relative h-48 w-full overflow-hidden rounded-md qc-border qc-bg-card">
              <div className="absolute left-0 right-0 top-1/2 h-px qc-border" />
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon
                  points={points}
                  fill="url(#evalGrad)"
                  stroke="url(#evalLine)"
                  strokeWidth="0.6"
                />
                <defs>
                  <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--qc-gold)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--qc-gold)" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="evalLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--qc-gold)" />
                    <stop offset="100%" stopColor="var(--qc-gold-light)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="mt-2 text-[11px] qc-text-muted">
              Centipawn evaluation from the backend engine analysis.
            </p>
          </div>
        )}
      </Card>
    </section>
  )
}

export default Evaluation
