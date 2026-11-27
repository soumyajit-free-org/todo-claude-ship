import type { Filter } from '../types'

const TABS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

interface Props {
  filter: Filter
  onChange: (filter: Filter) => void
}

export default function FilterTabs({ filter, onChange }: Props) {
  return (
    <div className="filter-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={filter === tab.value}
          className={filter === tab.value ? 'active' : ''}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
