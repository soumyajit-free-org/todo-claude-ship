import { useState } from 'react'
import type { DueFilter, Priority } from '../types'

interface Props {
  priorities: Priority[]
  onPrioritiesChange: (p: Priority[]) => void
  dueFilter: DueFilter | null
  onDueFilterChange: (d: DueFilter | null) => void
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Next 7 days' },
  { value: 'none', label: 'No date' },
]

export default function FilterPopover({
  priorities,
  onPrioritiesChange,
  dueFilter,
  onDueFilterChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const activeCount = priorities.length + (dueFilter ? 1 : 0)

  const togglePriority = (p: Priority) => {
    onPrioritiesChange(
      priorities.includes(p) ? priorities.filter((x) => x !== p) : [...priorities, p],
    )
  }

  return (
    <div className="filter-popover">
      <button
        type="button"
        className={`btn-ghost${activeCount > 0 ? ' filter-active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>
      {open && (
        <div className="filter-dropdown">
          <div className="filter-section">
            <strong>Priority</strong>
            {PRIORITIES.map((p) => (
              <label key={p} className="filter-option">
                <input
                  type="checkbox"
                  checked={priorities.includes(p)}
                  onChange={() => togglePriority(p)}
                />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <strong>Due date</strong>
            {DUE_OPTIONS.map((opt) => (
              <label key={opt.value} className="filter-option">
                <input
                  type="radio"
                  name="due-filter"
                  checked={dueFilter === opt.value}
                  onChange={() => onDueFilterChange(dueFilter === opt.value ? null : opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onPrioritiesChange([])
                onDueFilterChange(null)
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
