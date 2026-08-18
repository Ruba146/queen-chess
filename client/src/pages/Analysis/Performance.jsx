import { Target, Star, AlertTriangle, Megaphone, TrendingDown } from 'lucide-react'
import Card from '../../components/ui/Card'
import SectionTitle from '../../components/ui/SectionTitle'
import EmptyState from '../../components/common/EmptyState'

function Performance({ analysis }) {
  const metrics = [
    { label: 'Accuracy', value: analysis?.accuracy, icon: Target, tone: 'success', suffix: '%' },
    {
      label: 'Brilliant Moves',
      value: analysis?.brilliantMoves,
      icon: Star,
      tone: 'accent',
    },
    {
      label: 'Excellent Moves',
      value: analysis?.excellentMoves,
      icon: Star,
      tone: 'gold',
    },
    {
      label: 'Good Moves',
      value: analysis?.goodMoves,
      icon: Target,
      tone: 'primary',
    },
    {
      label: 'Inaccuracies',
      value: analysis?.inaccuracies,
      icon: AlertTriangle,
      tone: 'warning',
    },
    {
      label: 'Mistakes',
      value: analysis?.mistakes,
      icon: AlertTriangle,
      tone: 'warning',
    },
    {
      label: 'Blunders',
      value: analysis?.blunders,
      icon: Megaphone,
      tone: 'danger',
    },
    {
      label: 'Avg. CP Loss',
      value: analysis?.averageCentipawnLoss,
      icon: TrendingDown,
      tone: 'neutral',
    },
  ]

  const hasData = metrics.some((m) => m.value !== undefined && m.value !== null)

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="Performance"
        title="How you played"
        className="mb-4"
      />
      {!hasData ? (
        <Card className="p-6">
          <EmptyState
            icon={Target}
            title="No engine metrics yet"
            description="Engine analysis will appear once it is available for this game."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
          {metrics.map((stat) => {
            const Icon = stat.icon
            const isSet = stat.value !== undefined && stat.value !== null
            const iconColor =
              stat.tone === 'success'
                ? 'qc-text-success'
                : stat.tone === 'accent'
                  ? 'qc-text-gold'
                  : stat.tone === 'gold'
                    ? 'qc-text-gold'
                    : stat.tone === 'primary'
                      ? 'qc-text-purple-light'
                      : stat.tone === 'warning'
                        ? 'qc-text-warning'
                        : stat.tone === 'danger'
                          ? 'qc-text-error'
                          : 'qc-text-secondary'
            return (
              <Card key={stat.label} hover className="text-center p-3">
                <Icon className={`mx-auto mb-1.5 h-4 w-4 ${iconColor}`} aria-hidden="true" />
                <p className="text-base font-extrabold qc-text-primary">
                  {isSet ? `${stat.value}${stat.suffix || ''}` : '—'}
                </p>
                <p className="mt-0.5 text-[10px] qc-text-muted uppercase tracking-wider">{stat.label}</p>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Performance
