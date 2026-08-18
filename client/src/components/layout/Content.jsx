import { motion } from 'framer-motion'

function Content({ children, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`h-full min-h-0 flex-1 overflow-y-auto scrollbar-thin ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Content
