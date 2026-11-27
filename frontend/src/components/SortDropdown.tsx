import type { SortOption } from '../types'

interface Props {
  sort: SortOption
  order: 'asc' | 'desc'
  onSortChange: (sort: SortOption) => void
  onOrderChange: (order: 'asc' | 'desc') => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'position', label: 'Manual' },
  { value: 'created_at', label: 'Date created' },
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
]

export default function SortDropdown({ sort, order, onSortChange, onOrderChange }: Props) {
  return (
    <div className="sort-dropdown">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        aria-label="Sort by"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn-ghost sort-order"
        onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
        aria-label={`Sort ${order === 'asc' ? 'descending' : 'ascending'}`}
      >
        {order === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  )
}
