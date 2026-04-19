import { useEffect } from 'react'

interface Props {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmModal({
  title, body,
  confirmLabel = 'CONFIRMER',
  cancelLabel = 'ANNULER',
  onConfirm, onCancel,
  danger = true,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.8)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md card-accent anim-fade-up"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className={`font-mono text-[10px] tracking-widest mb-2 ${danger ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
            ! CONFIRMATION
          </div>
          <div className="font-display text-xl leading-tight">{title}</div>
          {body && <div className="text-xs text-[var(--ink-dim)] mt-3 leading-relaxed">{body}</div>}
          <div className="mt-5 flex gap-2">
            <button onClick={onCancel} className="btn btn-ghost flex-1">{cancelLabel}</button>
            <button
              onClick={onConfirm}
              className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
              style={danger ? { background: 'var(--danger)', color: '#000', borderColor: 'var(--danger)' } : {}}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
