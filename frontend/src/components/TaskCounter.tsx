export default function TaskCounter({ count }: { count: number }) {
  return (
    <span className="task-counter">
      {count} {count === 1 ? 'item' : 'items'} left
    </span>
  )
}
