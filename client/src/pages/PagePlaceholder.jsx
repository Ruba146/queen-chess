import { motion } from 'framer-motion'
import PageContainer from '../components/ui/PageContainer'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

/**
 * Placeholder page used until each feature page is built.
 * Displays only the page title — no application logic.
 */
function PagePlaceholder({ title, description }) {
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex min-h-[60vh] flex-col items-center justify-center"
      >
        <Card className="w-full max-w-xl text-center">
          <Badge tone="accent" className="mb-4">
            Foundation
          </Badge>
          <h1 className="text-4xl font-bold qc-text-primary md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-base qc-text-secondary">{description}</p>
          )}
        </Card>
      </motion.div>
    </PageContainer>
  )
}

export default PagePlaceholder
