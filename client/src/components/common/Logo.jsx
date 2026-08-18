import { Link } from 'react-router-dom'

/**
 * Brand logo lockup. Reusable, presentational.
 */
function Logo({ to = '/', size = 'md', className = '' }) {
  const box = size === 'lg' ? 'h-12 w-12 text-2xl' : 'h-10 w-10 text-xl'
  const title = size === 'lg' ? 'text-lg' : 'text-base'

  return (
    <Link to={to} className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex ${box} items-center justify-center rounded-xl qc-gradient-brand shadow-glow`}
      >
        <span className="font-display font-bold qc-text-primary">♞</span>
      </div>
      <div className="leading-tight">
        <p className={`font-display font-bold qc-text-primary ${title}`}>
          Queen Chess
        </p>
        <p className="text-xs qc-text-muted">AI Training Suite</p>
      </div>
    </Link>
  )
}

export default Logo
