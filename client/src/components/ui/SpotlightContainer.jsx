import { useCallback, useRef } from 'react'

/**
 * Interactive spotlight cursor-follow container.
 * Tracks the pointer and sets CSS custom properties consumed by the
 * `.spotlight` utility in the design system.
 */
function SpotlightContainer({
  children,
  className = '',
  radius = 600,
  ...props
}) {
  const ref = useRef(null)

  const handleMouseMove = useCallback(
    (event) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
      el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [radius],
  )

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`spotlight ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default SpotlightContainer
