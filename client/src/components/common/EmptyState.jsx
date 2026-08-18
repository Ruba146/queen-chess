import { Inbox } from 'lucide-react'

function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`qc-empty-state flex flex-col items-center justify-center gap-2 border-dashed border px-4 py-8 text-center ${className}`}
    >
      <div className="qc-empty-state-icon flex h-10 w-10 items-center justify-center rounded-full">
        <Icon className="h-5 w-5 text-[var(--qc-text-muted)]" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold qc-text-primary">{title}</h3>
      {description && (
        <p className="max-w-xs text-xs text-[var(--qc-text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export default EmptyState
