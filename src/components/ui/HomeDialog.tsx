import { useEffect, useId, useRef, type ReactNode } from 'react'

export function HomeDialog({
  open,
  title,
  onClose,
  children,
  dismissible = true,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  dismissible?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = ref.current
    if (!open) {
      element?.close()
      return
    }
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    if (!element?.open) element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0)
        const first = controls[0],
          last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (dismissible) onClose()
      }}
      onClose={onClose}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[520px] max-w-[90vw] overflow-y-auto rounded-xl border border-border bg-surface p-4 text-foreground shadow-xl backdrop:bg-black/70 md:p-8"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        <button
          type="button"
          disabled={!dismissible}
          onClick={onClose}
          aria-label="Fechar janela"
          className="rounded border border-border px-2"
        >
          ×
        </button>
      </div>
      {open && children}
    </dialog>
  )
}
