import { useEffect } from 'react'
import { X } from 'lucide-react'

function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="qc-modal-backdrop absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="qc-modal-panel relative w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="qc-modal-header sticky top-0 z-10 flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-bold qc-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg qc-text-secondary hover:qc-bg-card-hover hover:qc-text-primary transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="border-t qc-border px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
