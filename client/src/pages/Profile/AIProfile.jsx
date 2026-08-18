import { Bot } from 'lucide-react'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/common/EmptyState'

function AIProfile() {
  return (
    <section className="qc-section">
      <SectionTitle
        eyebrow="AI Profile"
        title="What the AI says about you"
        description="A data-driven profile of your playing style."
        className="qc-section-head mb-3"
      />
      <Card padded={false}>
        <EmptyState
          icon={Bot}
          title="No AI insights yet"
          description="Play more games to unlock personalized insights about your playing style."
        />
      </Card>
    </section>
  )
}

export default AIProfile
