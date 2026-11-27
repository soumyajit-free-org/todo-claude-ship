import { useReducer, useCallback, useRef, type ReactNode } from 'react'
import { ToastContext, type Toast } from './toast'

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string }

const MAX_TOASTS = 3

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD': {
      const next = [action.toast, ...state]
      return next.slice(0, MAX_TOASTS)
    }
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id)
  }
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, [])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    dispatch({ type: 'REMOVE', id })
  }, [])

  const addToast = useCallback(
    (input: Omit<Toast, 'id'>): string => {
      const id = `toast-${++nextId}`
      const toast: Toast = { ...input, id }
      dispatch({ type: 'ADD', toast })

      const timer = setTimeout(() => {
        timers.current.delete(id)
        dispatch({ type: 'REMOVE', id })
      }, 4000)
      timers.current.set(id, timer)

      return id
    },
    [],
  )

  const pauseTimer = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const resumeTimer = useCallback((id: string) => {
    const timer = setTimeout(() => {
      timers.current.delete(id)
      dispatch({ type: 'REMOVE', id })
    }, 4000)
    timers.current.set(id, timer)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastStack
        toasts={toasts}
        onDismiss={removeToast}
        onMouseEnter={pauseTimer}
        onMouseLeave={resumeTimer}
      />
    </ToastContext.Provider>
  )
}

function ToastStack({
  toasts,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
  onMouseEnter: (id: string) => void
  onMouseLeave: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.variant}`}
          role="status"
          onMouseEnter={() => onMouseEnter(t.id)}
          onMouseLeave={() => onMouseLeave(t.id)}
        >
          <span className="toast-message">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                t.action!.onClick()
                onDismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
