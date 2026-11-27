import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface Props {
  listeners?: SyntheticListenerMap
  disabled?: boolean
}

export default function DragHandle({ listeners, disabled }: Props) {
  return (
    <button
      type="button"
      className={`drag-handle${disabled ? ' drag-disabled' : ''}`}
      aria-label="Drag to reorder"
      title={disabled ? 'Reordering disabled while filtering or searching' : 'Drag to reorder'}
      disabled={disabled}
      {...(disabled ? {} : listeners)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="11" cy="4" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
      </svg>
    </button>
  )
}
