import { useMemo } from 'react'
import { LineChart } from 'lucide-react'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'
import { useApi } from '../../hooks/useApi'
import { userApi } from '../../services/api'
import { useCallback } from 'react'

function RatingProgress() {
  const historyQuery = useApi(
    useCallback(() => userApi.getRatingHistory('rapid').then((res) => res.data), []),
    { immediate: true },
  )

  const history = useMemo(() => historyQuery.data?.history || [], [historyQuery.data])
  const currentRating = historyQuery.data?.currentRating || 1200
  const hasHistory = history.length > 0

  const chartCoords = useMemo(() => {
    if (!hasHistory) return ''
    const ratings = history.map((h) => h.rating)
    const min = Math.min(...ratings)
    const max = Math.max(...ratings)
    return ratings
      .map((rating, index) => {
        const x = ratings.length > 1 ? (index / (ratings.length - 1)) * 84 + 8 : 50
        const y = max > min ? 82 - ((rating - min) / (max - min)) * 52 : 50
        return `${x},${y}`
      })
      .join(' ')
  }, [history, hasHistory])

  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="Rating Progress"
        title="Your rating journey"
        className="qc-section-head mb-3"
      />
      <Card padded={false}>
        {historyQuery.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="qc-spinner" />
          </div>
        ) : !hasHistory ? (
          <EmptyState
            icon={LineChart}
            title="No rating history yet"
            description="Play your first rated game to start tracking progress."
          />
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs qc-text-muted">Current Rating</p>
                <p className="text-2xl font-extrabold qc-text-primary">{currentRating}</p>
              </div>
              <div className="text-right">
                <p className="text-xs qc-text-muted">Games Tracked</p>
                <p className="text-lg font-bold qc-text-primary">{history.length}</p>
              </div>
            </div>
            <div className="relative h-40 w-full overflow-hidden rounded-md qc-border qc-bg-card">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="ratingLineGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="var(--qc-purple-light)" />
                    <stop offset="100%" stopColor="var(--qc-gold)" />
                  </linearGradient>
                </defs>
                <polyline className="dashboard-chart-grid" points="8,80 92,80" />
                <polyline className="dashboard-chart-grid" points="8,52 92,52" />
                <polyline className="dashboard-chart-grid" points="8,24 92,24" />
                <polyline className="dashboard-chart-line" points={chartCoords} />
              </svg>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] qc-text-muted">
              <LineChart className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Rating progression over {history.length} games</span>
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}

export default RatingProgress
