export default function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="empty-state">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {filtered ? (
          <>
            <circle cx="34" cy="34" r="18" />
            <path d="M47 47l12 12" />
            <path d="M28 34h12" />
          </>
        ) : (
          <>
            <rect x="16" y="20" width="48" height="40" rx="4" />
            <path d="M16 32h48" />
            <path d="M32 32v28" />
            <circle cx="40" cy="14" r="6" />
            <path d="M40 20v0" />
          </>
        )}
      </svg>
      <p className="empty-title">
        {filtered ? 'No matches' : 'All clear!'}
      </p>
      <p className="empty-hint">
        {filtered
          ? 'No tasks match the current filter.'
          : 'Add your first task above to get started.'}
      </p>
    </div>
  )
}
