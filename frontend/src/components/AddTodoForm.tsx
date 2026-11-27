import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../services/api'
import type { Priority } from '../types'

interface Props {
  onAdd: (data: { title: string; description?: string; due_date?: string; priority?: Priority }) => Promise<void>
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function AddTodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Title is required.')
      return
    }
    if (trimmed.length > 255) {
      setError('Title must be 255 characters or fewer.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onAdd({
        title: trimmed,
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        priority,
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="add-form" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="What needs to be done?"
        value={title}
        maxLength={255}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Task title"
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        aria-label="Task description"
      />
      <div className="add-form-row">
        <div className="add-form-date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
          />
          <div className="quick-picks">
            <button type="button" className="btn-ghost" onClick={() => setDueDate(todayStr())}>Today</button>
            <button type="button" className="btn-ghost" onClick={() => setDueDate(addDays(1))}>Tomorrow</button>
            <button type="button" className="btn-ghost" onClick={() => setDueDate(addDays(7))}>Next week</button>
          </div>
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label="Priority"
          className="priority-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
    </form>
  )
}
