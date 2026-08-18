import { motion } from 'framer-motion'

/**
 * Ambient gradient background layer.
 * Combines a base background with blurred color orbs for depth.
 * Pure presentational — no logic.
 */
const variants = {
  primary: 'bg-grad-primary',
  surface: 'bg-grad-surface',
  radial: 'bg-grad-radial',
}

function GradientBackground({
  children,
  variant = 'surface',
  className = '',
  orbs = true,
  ...props
}) {
  return (
    <div
      className={`relative min-h-full overflow-hidden ${variants[variant]} ${className}`}
      {...props}
    >
      {orbs && (
        <>
          <motion.div
            aria-hidden="true"
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-chess-primary/20 blur-[120px]"
          />
          <motion.div
            aria-hidden="true"
            animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-chess-accent/20 blur-[120px]"
          />
        </>
      )}
      {children}
    </div>
  )
}

export default GradientBackground
