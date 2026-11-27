import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TodoItem from '../components/TodoItem'
import type { Todo } from '../types'

const todo: Todo = {
  id: 1,
  title: 'Buy milk',
  description: null,
  is_completed: false,
  due_date: null,
  priority: 'medium',
  position: 1024,
  created_at: '2026-11-26T10:00:00Z',
}

describe('TodoItem', () => {
  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn()
    render(<TodoItem todo={todo} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onToggle).toHaveBeenCalledWith(todo)
  })

  it('renders completed todos with the strikethrough style', () => {
    render(<TodoItem todo={{ ...todo, is_completed: true }} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Buy milk').parentElement).toHaveClass('done')
  })

  it('calls onEdit with trimmed title on save', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const input = screen.getByLabelText('Edit title')
    await user.clear(input)
    await user.type(input, 'Buy oat milk')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onEdit).toHaveBeenCalledWith(1, { title: 'Buy oat milk', description: null })
  })

  it('blocks saving an empty title', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Edit title'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Title cannot be empty.')
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('restores the original text on cancel', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.type(screen.getByLabelText('Edit title'), ' extra')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<TodoItem todo={todo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }))

    expect(onDelete).toHaveBeenCalledWith(1)
  })
})
