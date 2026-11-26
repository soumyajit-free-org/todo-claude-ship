import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../services/api'

interface Props {
  onAdd: (title: string, description?: string) => Promise<void>
}

export default function AddTodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
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
      await onAdd(trimmed, description.trim() || undefined)
      setTitle('')
      setDescription('')
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
      <button type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
      {error && <p role="alert" className="error">{error}</p>}
    </form>
  )
}
