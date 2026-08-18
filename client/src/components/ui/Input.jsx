import { forwardRef, useId } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon = null,
    className = '',
    wrapperClassName = '',
    id,
    required = false,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const inputId = id || props.name || autoId
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  const classes = [
    'qc-input',
    error ? 'qc-input-error' : '',
    Icon ? 'pl-9' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="qc-form-label"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[var(--qc-error)]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--qc-text-muted)]"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          className={classes}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--qc-error)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--qc-text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
