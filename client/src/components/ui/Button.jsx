import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'qc-btn-primary',
  secondary: 'qc-btn-secondary',
  ghost: 'qc-btn-ghost',
  outline: 'qc-btn-outline',
  danger: 'qc-btn-danger',
  success: 'qc-btn-success',
  gold: 'qc-btn-gold',
}

const SIZES = {
  xs: 'qc-btn-xs',
  sm: 'qc-btn-sm',
  md: 'qc-btn-md',
  lg: 'qc-btn-lg',
}

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon: LeftIcon = null,
    rightIcon: RightIcon = null,
    className = '',
    as: Component = 'button',
    ...props
  },
  ref,
) {
  const isNativeButton = Component === 'button'
  const isDisabled = disabled || loading

  const classes = [
    'qc-btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qc-gold)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qc-bg-primary)]',
    'disabled:pointer-events-none disabled:opacity-50',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component
      ref={ref}
      className={classes}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <svg
          className="h-5 w-5 shrink-0 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        LeftIcon && <LeftIcon className={`shrink-0 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} aria-hidden="true" />
      )}
      <span className="truncate">{children}</span>
      {!loading && RightIcon && (
        <RightIcon className={`shrink-0 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} aria-hidden="true" />
      )}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button
