import { useCallback } from 'react'
import { Medal, Trophy, Flame, Zap, Target, Crown, Puzzle } from 'lucide-react'
import SectionTitle from '../../components/ui/SectionTitle'
import EmptyState from '../../components/common/EmptyState'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/common/LoadingState'
import { useApi } from '../../hooks/useApi'
import { learningApi } from '../../services/api'

const ACHIEVEMENT_ICONS = {
  'Puzzle Novice': Puzzle,
  'Tactical Master': Trophy,
  'On Fire': Flame,
  'Sharpshooter': Target,
  'Strategist': Crown,
  'Rising Star': Trophy,
  'Dedicated': Zap,
}

const ACHIEVEMENT_COLORS = {
  'Puzzle Novice': 'success',
  'Tactical Master': 'warning',
  'On Fire': 'danger',
  'Sharpshooter': 'accent',
  'Strategist': 'primary',
  'Rising Star': 'warning',
  'Dedicated': 'success',
}

function Achievements() {
  const dashboardQuery = useApi(
    useCallback(
      () => learningApi.getDashboard().then((res) => res.data?.data ?? res.data),
      []
    )
  )

  const achievements = dashboardQuery.data?.achievements || []

  if (dashboardQuery.loading) {
    return (
      <section className="qc-section">
        <SectionTitle
          eyebrow="Achievements"
          title="Badges, titles & milestones"
          className="qc-section-head mb-3"
        />
        <LoadingState label="Loading achievements..." />
      </section>
    )
  }

  if (achievements.length === 0) {
    return (
      <section className="qc-section">
        <SectionTitle
          eyebrow="Achievements"
          title="Badges, titles & milestones"
          className="qc-section-head mb-3"
        />
        <EmptyState
          icon={Medal}
          title="No achievements yet"
          description="Complete puzzles and games to unlock achievements."
        />
      </section>
    )
  }

  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="Achievements"
        title="Badges, titles & milestones"
        description={`You have unlocked ${achievements.length} achievement${achievements.length === 1 ? '' : 's'}.`}
        className="qc-section-head mb-3"
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((name, idx) => {
          const Icon = ACHIEVEMENT_ICONS[name] || Trophy
          const tone = ACHIEVEMENT_COLORS[name] || 'primary'
          return (
            <Card
              key={name + idx}
              hover
              interactive
              padded={false}
              className="qc-achievement-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-md qc-bg-accent-soft">
                  <Icon className="h-3.5 w-3.5 qc-text-gold" aria-hidden="true" />
                </div>
                <Badge tone={tone} size="sm">Unlocked</Badge>
              </div>
              <h3 className="text-xs font-semibold qc-text-primary">{name}</h3>
              <p className="text-[10px] qc-text-secondary">Achievement unlocked</p>
              <div className="h-1 w-full overflow-hidden rounded-full qc-bg-card">
                <div
                  className="h-full rounded-full qc-gradient-accent transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default Achievements
