import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from '../pages/DashboardPage'
import { todoApi } from '../services/api'
import type { Todo } from '../types'

vi.mock('../context/auth', () => ({
  useAuth: () => ({ user: { id: 1, email: 'me@example.com', created_at: '' }, logout: vi.fn() }),
}))
vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>()
  return { ...actual, todoApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() } }
})

const make = (id: number, title: string, done: boolean): Todo => ({
  id,
  title,
  description: null,
  is_completed: done,
  created_at: '2026-11-26T10:00:00Z',
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

describe('DashboardPage', () => {
  it('shows a loading indicator while tasks load (US8)', () => {
    vi.mocked(todoApi.list).mockReturnValue(new Promise(() => undefined))
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks')
  })

  it('shows the empty state when there are no tasks (US8)', async () => {
    vi.mocked(todoApi.list).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/No tasks yet/)).toBeInTheDocument()
  })

  it('shows an error with retry when loading fails (US8)', async () => {
    vi.mocked(todoApi.list).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(todoApi.list).mockResolvedValueOnce([make(1, 'Recovered', false)])
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Recovered')).toBeInTheDocument()
  })

  it('filters tasks and counts active items (US4)', async () => {
    vi.mocked(todoApi.list).mockResolvedValue([
      make(1, 'Active one', false),
      make(2, 'Active two', false),
      make(3, 'Done one', true),
    ])
    renderPage()

    expect(await screen.findByText('2 items left')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Completed' }))
    expect(screen.getByText('Done one')).toBeInTheDocument()
    expect(screen.queryByText('Active one')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Active' }))
    expect(screen.queryByText('Done one')).not.toBeInTheDocument()
    expect(screen.getByText('Active two')).toBeInTheDocument()
  })

  it('preserves input when creating a task fails (edge case)', async () => {
    vi.mocked(todoApi.list).mockResolvedValue([])
    vi.mocked(todoApi.create).mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/No tasks yet/)

    await user.type(screen.getByLabelText('Task title'), 'Keep me')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Task title')).toHaveValue('Keep me')
  })
})
