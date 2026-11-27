import { useRef, useState } from 'react'
import { errorMessage, todoApi } from '../services/api'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  onChange: (todo: Todo) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onChange, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const toggle = () =>
    run(async () => onChange(await todoApi.update(todo.id, { is_completed: !todo.is_completed })))

  const remove = () =>
    run(async () => {
      await todoApi.remove(todo.id)
      onDelete(todo.id)
    })

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Title cannot be empty.')
      return
    }
    return run(async () => {
      const updated = await todoApi.update(todo.id, {
        title: trimmed,
        description: description.trim() || null,
      })
      onChange(updated)
      setEditing(false)
    })
  }

  const cancel = () => {
    setTitle(todo.title)
    setDescription(todo.description ?? '')
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="todo-item editing">
        <input value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} aria-label="Edit title" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Edit description" />
        <button type="button" onClick={save} disabled={busy}>Save</button>
        <button type="button" onClick={cancel} disabled={busy}>Cancel</button>
        {error && <p role="alert" className="error">{error}</p>}
      </li>
    )
  }

  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.is_completed}
        onChange={toggle}
        disabled={busy}
        aria-label={`Mark "${todo.title}" as ${todo.is_completed ? 'active' : 'completed'}`}
      />
      <div className={todo.is_completed ? 'todo-text done' : 'todo-text'}>
        <span className="todo-title">{todo.title}</span>
        {todo.description && <span className="todo-desc">{todo.description}</span>}
      </div>
      <button type="button" onClick={() => setEditing(true)} disabled={busy}>Edit</button>
      <button type="button" onClick={remove} disabled={busy} aria-label={`Delete "${todo.title}"`}>Delete</button>
      {error && <p role="alert" className="error">{error}</p>}
    </li>
  )
}
