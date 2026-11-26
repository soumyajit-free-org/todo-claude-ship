interface Props {
  dueDate: string
}

function formatDueDate(iso: string): { text: string; overdue: boolean } {
  const due = new Date(iso + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (due < today) return { text: 'Overdue', overdue: true }
  if (due.getTime() === today.getTime()) return { text: 'Due today', overdue: false }
  if (due.getTime() === tomorrow.getTime()) return { text: 'Due tomorrow', overdue: false }
  return {
    text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    overdue: false,
  }
}

export default function DueDateChip({ dueDate }: Props) {
  const { text, overdue } = formatDueDate(dueDate)
  return (
    <span className={`due-chip${overdue ? ' due-overdue' : ''}`}>
      {text}
    </span>
  )
}
