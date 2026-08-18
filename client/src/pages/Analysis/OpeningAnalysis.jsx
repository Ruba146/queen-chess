import { BookOpen, ThumbsUp, ChevronRight, Gauge } from 'lucide-react'
import Card from '../../components/ui/Card'
import SectionTitle from '../../components/ui/SectionTitle'
import EmptyState from '../../components/common/EmptyState'

function PhaseScoreCard({ label, score, icon: Icon }) {
  const color =
    score >= 75
      ? 'qc-text-success'
      : score >= 50
        ? 'qc-text-gold'
        : 'qc-text-error'

  return (
    <div className="flex items-center gap-3 rounded-md qc-border qc-bg-card p-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md qc-bg-card-soft ${color}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider qc-text-muted">{label}</p>
        <p className={`text-lg font-extrabold leading-none ${color}`}>{score}</p>
      </div>
    </div>
  )
}

function OpeningAnalysis({ opening, eco, strengths = [], weaknesses = [], openingScore, middleGameScore, endgameScore }) {
  const hasContent = Boolean(opening) || strengths.length > 0 || weaknesses.length > 0
  const hasScores = [openingScore, middleGameScore, endgameScore].some((s) => typeof s === 'number' && s > 0)

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="Opening Analysis"
        title="Opening report"
        className="mb-4"
      />
      {!hasContent && !hasScores ? (
        <Card className="p-6">
          <EmptyState
            icon={BookOpen}
            title="No opening analysis yet"
            description="Opening analysis will appear once the engine review is available."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="flex flex-col gap-3 lg:col-span-2 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md qc-gradient-accent-soft-alt">
                <BookOpen className="h-4 w-4 qc-text-gold" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold qc-text-primary">{opening || 'Unknown Opening'}</h3>
                <p className="text-[11px] qc-text-secondary">
                  {eco ? `ECO ${eco}` : 'Opening detection'}
                </p>
              </div>
            </div>
            {strengths.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-[11px] font-semibold qc-text-success uppercase tracking-wider">Strengths</h4>
                <ul className="space-y-1 text-xs qc-text-secondary">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <ThumbsUp className="mt-0.5 h-3 w-3 shrink-0 qc-text-success" aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-[11px] font-semibold qc-text-error uppercase tracking-wider">Weaknesses</h4>
                <ul className="space-y-1 text-xs qc-text-secondary">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 qc-text-error" aria-hidden="true" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="flex flex-col gap-3">
            <Card className="p-4 qc-border qc-bg-card">
              <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider qc-text-secondary">
                <Gauge className="h-3.5 w-3.5 qc-text-gold" aria-hidden="true" />
                Phase scores
              </h3>
              <div className="space-y-2">
                <PhaseScoreCard label="Opening" score={openingScore ?? 0} icon={BookOpen} />
                <PhaseScoreCard label="Middlegame" score={middleGameScore ?? 0} icon={Gauge} />
                <PhaseScoreCard label="Endgame" score={endgameScore ?? 0} icon={Gauge} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  )
}

export default OpeningAnalysis
