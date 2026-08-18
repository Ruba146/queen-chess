import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`qc-loading-state flex flex-col items-center justify-center text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="qc-loading-state-icon"
      >
        <Loader2 className="h-4 w-4 text-[var(--qc-gold-light)]" aria-hidden="true" />
      </motion.div>
      <p className="qc-loading-state-text text-xs">{label}</p>
    </div>
  )
}

export default LoadingState
