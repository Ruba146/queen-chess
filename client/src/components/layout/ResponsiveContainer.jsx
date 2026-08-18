/**
 * Layout primitive for responsive, evenly-gapped content grids.
 * Configurable via `cols` — accepts arrays for responsive behavior.
 *
 * Examples:
 *  <ResponsiveContainer cols="1 sm:grid-cols-2 lg:grid-cols-3">
 *  <ResponsiveContainer> keeps a simple stacked flex/column layout.
 */
function ResponsiveContainer({
  children,
  cols = '',
  gap = 'gap-6',
  className = '',
  ...props
}) {
  const classes = ['grid', gap, cols, className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default ResponsiveContainer
