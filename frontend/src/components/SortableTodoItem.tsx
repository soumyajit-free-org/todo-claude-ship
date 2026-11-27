import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../types'
import DragHandle from './DragHandle'
import DueDateChip from './DueDateChip'
import PriorityBadge from './PriorityBadge'
import { useState } from 'react'

interface Props {
  todo: Todo
  onToggle: (todo: Todo) => void
  onEdit: (id: number, data: Partial<Pick<Todo, 'title' | 'description'>>) => void
  onDelete: (id: number) => void
  dragDisabled?: boolean
}

export default function SortableTodoItem({ todo, onToggle, onEdit, onDelete, dragDisabled }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: dragDisabled })

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description ?? '')
  const [error, setError] = useState<string | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) { setError('Title cannot be empty.'); return }
    onEdit(todo.id, { title: trimmed, description: description.trim() || null })
    setEditing(false)
    setError(null)
  }

  const cancel = () => {
    setTitle(todo.title)
    setDescription(todo.description ?? '')
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} {...attributes} className="todo-item editing">
        <input
          type="text"
          value={title}
          maxLength={255}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Edit title"
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Edit description"
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        />
        <button type="button" className="btn-primary" onClick={save}>Save</button>
        <button type="button" className="btn-ghost" onClick={cancel}>Cancel</button>
        {error && <p role="alert" className="error">{error}</p>}
      </li>
    )
  }

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="todo-item">
      <DragHandle listeners={listeners} disabled={dragDisabled} />
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.is_completed}
        onChange={() => onToggle(todo)}
        aria-label={`Mark "${todo.title}" as ${todo.is_completed ? 'active' : 'completed'}`}
      />
      <div className={todo.is_completed ? 'todo-text done' : 'todo-text'}>
        <span className="todo-title">{todo.title}</span>
        {todo.description && <span className="todo-desc">{todo.description}</span>}
        <div className="todo-meta">
          <PriorityBadge priority={todo.priority} />
          {todo.due_date && <DueDateChip dueDate={todo.due_date} />}
        </div>
      </div>
      <div className="todo-actions">
        <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
        <button
          type="button"
          className="btn-danger"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete "${todo.title}"`}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
