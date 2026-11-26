export default function TaskCounter({ count, overdue = 0 }: { count: number; overdue?: number }) {
  return (
    <span className="task-counter">
      {count} {count === 1 ? 'item' : 'items'} left
      {overdue > 0 && <span className="task-counter-overdue"> · {overdue} overdue</span>}
    </span>
  )
}
