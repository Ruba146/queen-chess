import { Dumbbell, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react'
import Card from '../../components/ui/Card'
import SectionTitle from '../../components/ui/SectionTitle'
import EmptyState from '../../components/common/EmptyState'

function AIRecommendations({ summary }) {
  const hasStrengths = Array.isArray(summary?.strengths) && summary.strengths.length > 0
  const hasWeaknesses = Array.isArray(summary?.weaknesses) && summary.weaknesses.length > 0
  const hasPlan = Array.isArray(summary?.improvementPlan) && summary.improvementPlan.length > 0
  const hasRecs = Array.isArray(summary?.trainingRecommendations) && summary.trainingRecommendations.length > 0
  const hasSummary = Boolean(summary?.summary)

  const hasContent = hasStrengths || hasWeaknesses || hasPlan || hasRecs || hasSummary

  return (
    <section className="py-4">
      <SectionTitle
        eyebrow="AI Recommendations"
        title="Personalized next steps"
        description="Actionable insight generated from your game by the backend."
        className="mb-4"
      />
      {!hasContent ? (
        <Card className="p-6">
          <EmptyState
            icon={Lightbulb}
            title="No AI recommendations yet"
            description="AI explanations will appear once the backend generates them for this game."
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {hasSummary && (
            <Card className="flex flex-col gap-2.5 md:col-span-2 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md qc-border-accent qc-bg-accent-soft">
                  <Lightbulb className="h-4 w-4 qc-text-gold" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold qc-text-primary">Summary</h3>
              </div>
              <p className="text-xs leading-relaxed qc-text-secondary">{summary.summary}</p>
            </Card>
          )}
          {hasStrengths && (
            <Card className="flex flex-col gap-2.5 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md qc-border-success qc-bg-success-soft">
                  <ThumbsUp className="h-4 w-4 qc-text-success" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold qc-text-primary">Strengths</h3>
              </div>
              <ul className="space-y-1.5 text-xs qc-text-secondary">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <ThumbsUp className="mt-0.5 h-3 w-3 shrink-0 qc-text-success" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {hasWeaknesses && (
            <Card className="flex flex-col gap-2.5 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md qc-border-error qc-bg-error-soft">
                  <ThumbsDown className="h-4 w-4 qc-text-error" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold qc-text-primary">Weaknesses</h3>
              </div>
              <ul className="space-y-1.5 text-xs qc-text-secondary">
                {summary.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <ThumbsDown className="mt-0.5 h-3 w-3 shrink-0 qc-text-error" aria-hidden="true" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {hasPlan && (
            <Card className="flex flex-col gap-2.5 md:col-span-2 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md qc-border-accent qc-bg-accent-soft">
                  <Dumbbell className="h-4 w-4 qc-text-gold" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold qc-text-primary">Improvement Plan</h3>
              </div>
              <ul className="space-y-1.5 text-xs qc-text-secondary">
                {summary.improvementPlan.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <Dumbbell className="mt-0.5 h-3 w-3 shrink-0 qc-text-gold" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {hasRecs && (
            <Card className="flex flex-col gap-2.5 md:col-span-2 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md qc-border-accent qc-bg-accent-soft">
                  <Dumbbell className="h-4 w-4 qc-text-gold" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold qc-text-primary">Training Recommendations</h3>
              </div>
              <ul className="space-y-1.5 text-xs qc-text-secondary">
                {summary.trainingRecommendations.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <Dumbbell className="mt-0.5 h-3 w-3 shrink-0 qc-text-gold" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </section>
  )
}

export default AIRecommendations
