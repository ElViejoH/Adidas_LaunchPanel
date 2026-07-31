import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { WarningCircle, X } from '@phosphor-icons/react'
import { useI18n } from '../hooks/useI18n'
import { Button } from './Button'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  isLoading = false,
  tone = 'default',
  children,
}) {
  const { t } = useI18n()
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const returnFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const isLoadingRef = useRef(isLoading)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const appRoot = document.getElementById('root')
    const previousRootInert = appRoot?.inert ?? false
    const previousFocus = document.activeElement
    returnFocusRef.current = previousFocus instanceof HTMLElement ? previousFocus : null
    document.body.style.overflow = 'hidden'
    if (appRoot) appRoot.inert = true

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoadingRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      const focusableElements = dialog
        ? [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
            (element) => element.getAttribute('aria-hidden') !== 'true',
          )
        : []

      if (!dialog || focusableElements.length === 0) {
        event.preventDefault()
        dialog?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      if (appRoot) appRoot.inert = previousRootInert
      window.removeEventListener('keydown', handleKeyDown)
      if (returnFocusRef.current && document.contains(returnFocusRef.current)) {
        returnFocusRef.current.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-950/65 p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t('common.closeDialog')}
        tabIndex={-1}
        onClick={() => !isLoading && onClose()}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_rgba(24,24,27,0.22)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {tone === 'danger' && (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-700">
                <WarningCircle size={22} weight="bold" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-black tracking-[-0.02em] text-zinc-950">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1.5 text-sm leading-6 text-zinc-600">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:opacity-50"
            aria-label={t('common.close')}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {children && <div className="mt-5">{children}</div>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('common.processing') : confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
