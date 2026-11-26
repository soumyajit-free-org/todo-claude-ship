export default function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <p className="empty-state">
      {filtered ? 'No tasks match this filter.' : 'No tasks yet — add one above!'}
    </p>
  )
}
