import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TodoItem from '../components/TodoItem'
import { todoApi } from '../services/api'
import type { Todo } from '../types'

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>()
  return { ...actual, todoApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() } }
})

const todo: Todo = {
  id: 1,
  title: 'Buy milk',
  description: null,
  is_completed: false,
  created_at: '2026-11-26T10:00:00Z',
}

describe('TodoItem', () => {
  it('toggles completion via the API and reports the updated todo (US5)', async () => {
    const updated = { ...todo, is_completed: true }
    vi.mocked(todoApi.update).mockResolvedValue(updated)
    const onChange = vi.fn()
    render(<TodoItem todo={todo} onChange={onChange} onDelete={vi.fn()} />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(todoApi.update).toHaveBeenCalledWith(1, { is_completed: true })
    expect(onChange).toHaveBeenCalledWith(updated)
  })

  it('renders completed todos with the strikethrough style (US5)', () => {
    render(<TodoItem todo={{ ...todo, is_completed: true }} onChange={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Buy milk').parentElement).toHaveClass('done')
  })

  it('saves an edited title (US6)', async () => {
    const updated = { ...todo, title: 'Buy oat milk' }
    vi.mocked(todoApi.update).mockResolvedValue(updated)
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TodoItem todo={todo} onChange={onChange} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const input = screen.getByLabelText('Edit title')
    await user.clear(input)
    await user.type(input, 'Buy oat milk')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(todoApi.update).toHaveBeenCalledWith(1, { title: 'Buy oat milk', description: null })
    expect(onChange).toHaveBeenCalledWith(updated)
  })

  it('blocks saving an empty title (US6)', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={todo} onChange={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Edit title'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Title cannot be empty.')
    expect(todoApi.update).not.toHaveBeenCalled()
  })

  it('restores the original text on cancel (US6)', async () => {
    const user = userEvent.setup()
    render(<TodoItem todo={todo} onChange={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.type(screen.getByLabelText('Edit title'), ' extra')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(todoApi.update).not.toHaveBeenCalled()
  })

  it('removes a todo after the API delete succeeds (US7)', async () => {
    vi.mocked(todoApi.remove).mockResolvedValue(undefined)
    const onDelete = vi.fn()
    render(<TodoItem todo={todo} onChange={vi.fn()} onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }))

    expect(todoApi.remove).toHaveBeenCalledWith(1)
    expect(onDelete).toHaveBeenCalledWith(1)
  })
})
