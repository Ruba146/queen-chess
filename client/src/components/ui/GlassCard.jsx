import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const GlassCard = forwardRef(
  (
    {
      children,
      className = '',
      interactive = false,
      padded = true,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'qc-card-glass',
      padded ? 'p-5' : '',
      interactive
        ? 'transition-all duration-200 ease-out qc-card-hover'
        : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -3 }}
          className={classes}
          {...props}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  },
)

GlassCard.displayName = 'GlassCard'

export default GlassCard
