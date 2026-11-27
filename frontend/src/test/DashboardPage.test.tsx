import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from '../pages/DashboardPage'
import { ThemeProvider } from '../context/ThemeContext'
import { ToastProvider } from '../context/ToastContext'
import { todoApi } from '../services/api'
import type { PaginatedResponse, Todo } from '../types'

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
  due_date: null,
  priority: 'medium',
  position: id * 1024,
  created_at: '2026-11-26T10:00:00Z',
})

const paginated = (items: Todo[]): PaginatedResponse<Todo> => ({
  items,
  next_cursor: null,
  total_count: items.length,
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <ToastProvider>
          <DashboardPage />
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )

describe('DashboardPage', () => {
  it('shows a loading indicator while tasks load', () => {
    vi.mocked(todoApi.list).mockReturnValue(new Promise(() => undefined))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows the empty state when there are no tasks', async () => {
    vi.mocked(todoApi.list).mockResolvedValue(paginated([]))
    renderPage()
    expect(await screen.findByText(/All clear/)).toBeInTheDocument()
  })

  it('shows an error with retry when loading fails', async () => {
    vi.mocked(todoApi.list).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(todoApi.list).mockResolvedValueOnce(paginated([make(1, 'Recovered', false)]))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
  })

  it('filters tasks and counts active items', async () => {
    vi.mocked(todoApi.list).mockResolvedValue(
      paginated([
        make(1, 'Active one', false),
        make(2, 'Active two', false),
        make(3, 'Done one', true),
      ]),
    )
    renderPage()

    expect(await screen.findByText('2 items left')).toBeInTheDocument()
  })

  it('preserves input when creating a task fails (edge case)', async () => {
    vi.mocked(todoApi.list).mockResolvedValue(paginated([]))
    vi.mocked(todoApi.create).mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/All clear/)

    await user.type(screen.getByLabelText('Task title'), 'Keep me')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Task title')).toHaveValue('Keep me')
  })
})
