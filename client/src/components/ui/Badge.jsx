const TONES = {
  neutral: 'qc-badge-neutral',
  primary: 'qc-badge-primary',
  accent: 'qc-badge-accent',
  success: 'qc-badge-success',
  warning: 'qc-badge-warning',
  danger: 'qc-badge-error',
}

const SIZES = {
  sm: 'qc-badge-sm',
  md: '',
}

function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  className = '',
  icon: Icon = null,
  dot = false,
  ...props
}) {
  const classes = [
    'qc-badge',
    TONES[tone] || TONES.neutral,
    SIZES[size] || '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...props}>
      {dot && (
        <span
          className="h-1 w-1 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}

export default Badge
