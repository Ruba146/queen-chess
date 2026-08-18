import { forwardRef } from 'react'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const Avatar = forwardRef(function Avatar(
  {
    src,
    alt = '',
    name = '',
    size = 'md',
    className = '',
    status = null,
    ...props
  },
  ref,
) {
  const classes = [
    'qc-avatar',
    SIZES[size] || SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span ref={ref} className={classes} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'avatar'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        getInitials(name) || '?'
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-[var(--qc-bg-primary)] ${
            status === 'online' ? 'qc-avatar-status-online' : 'qc-avatar-status-offline'
          }`}
          aria-hidden="true"
        />
      )}
    </span>
  )
})

Avatar.displayName = 'Avatar'

export default Avatar
