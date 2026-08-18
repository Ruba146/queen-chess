import { forwardRef } from 'react'

const Card = forwardRef(function Card(
  {
    children,
    className = '',
    padded = true,
    hover = false,
    interactive = false,
    glass = false,
    ...props
  },
  ref,
) {
  const classes = [
    'qc-card',
    glass ? 'qc-card-glass' : '',
    padded ? 'p-2.5 sm:p-3' : '',
    hover || interactive
       ? 'cursor-pointer transition-colors duration-200 qc-card-hover'
       : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card
