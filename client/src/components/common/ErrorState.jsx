import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'

function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }) {
  return (
    <div
      className={`qc-error-state flex flex-col items-center justify-center gap-3 text-center ${className}`}
      role="alert"
    >
      <div className="qc-error-state-icon flex h-9 w-9 items-center justify-center rounded-full">
        <AlertTriangle className="h-4 w-4 text-[var(--qc-error)]" aria-hidden="true" />
      </div>
      <p className="max-w-md text-xs text-[var(--qc-text-secondary)]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export default ErrorState
