import { History } from 'lucide-react'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'

function Activity() {
  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="Activity"
        title="Recent activity"
        className="qc-section-head mb-3"
      />
      <Card padded={false}>
        <EmptyState
          icon={History}
          title="No recent activity"
          description="Activity will appear after your first match."
        />
      </Card>
    </section>
  )
}

export default Activity
