import { useMemo } from 'react'
import { ListChecks } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SectionTitle from '../../components/ui/SectionTitle'
import EmptyState from '../../components/common/EmptyState'

const QUALITY = {
  Best: { tone: 'success' },
  Excellent: { tone: 'accent' },
  Good: { tone: 'primary' },
  Inaccuracy: { tone: 'warning' },
  Mistake: { tone: 'warning' },
  Blunder: { tone: 'danger' },
}

function MoveTimeline({ analysis = [], coachRecommendations = [] }) {
  const hasMoves = analysis && analysis.length > 0

  const moveEntries = useMemo(() => {
    const entries = []
    for (let i = 0; i < analysis.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1
      const white = analysis[i] || null
      const black = analysis[i + 1] || null
      entries.push({ moveNum, white, black })
    }
    return entries
  }, [analysis])

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="Move Timeline"
        title="Every move, judged"
        description="Move list with engine quality badges from the backend analysis."
        className="mb-4"
      />
      <Card className="p-4">
        {!hasMoves ? (
          <EmptyState
            icon={ListChecks}
            title="No move analysis yet"
            description="Move-by-move engine analysis will appear once available."
          />
        ) : (
          <>
            <div className="max-h-[420px] overflow-y-auto pr-1.5 scrollbar-thin">
              <div className="space-y-1">
                {moveEntries.map((entry) => (
                  <div
                    key={entry.moveNum}
                    className="flex items-center gap-2 rounded-md qc-border qc-bg-card px-2.5 py-2"
                  >
                    <span className="w-6 shrink-0 text-[10px] font-bold qc-text-muted">
                      {entry.moveNum}.
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      {entry.white && (
                        <>
                          <span className="rounded-sm qc-border qc-bg-card px-1.5 py-0.5 font-mono text-[11px] qc-text-primary min-w-[48px] text-center">
                            {entry.white.move}
                          </span>
                          <Badge tone={QUALITY[entry.white.classification]?.tone || 'neutral'} size="xs">
                            {entry.white.classification}
                          </Badge>
                          {typeof entry.white.loss === 'number' && (
                            <span className="text-[10px] qc-text-muted">
                              −{entry.white.loss} cp
                            </span>
                          )}
                        </>
                      )}
                      {entry.black && (
                        <>
                          <span className="text-[10px] qc-text-muted ml-1">
                            {entry.moveNum}...
                          </span>
                          <span className="rounded-sm qc-border qc-bg-card px-1.5 py-0.5 font-mono text-[11px] qc-text-primary min-w-[48px] text-center">
                            {entry.black.move}
                          </span>
                          <Badge tone={QUALITY[entry.black.classification]?.tone || 'neutral'} size="xs">
                            {entry.black.classification}
                          </Badge>
                          {typeof entry.black.loss === 'number' && (
                            <span className="text-[10px] qc-text-muted">
                              −{entry.black.loss} cp
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {coachRecommendations && coachRecommendations.length > 0 && (
              <div className="mt-4 space-y-2 border-t qc-border-strong pt-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider qc-text-secondary">
                  Coach recommendations
                </h4>
                {coachRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge tone="accent" size="xs">Coach</Badge>
                    <p className="text-[11px] qc-text-secondary">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  )
}

export default MoveTimeline
