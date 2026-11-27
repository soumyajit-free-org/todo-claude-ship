import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../context/ThemeContext'
import ThemeToggle from '../ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
})

function renderToggle() {
  return render(
    <ThemeProvider><ThemeToggle /></ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  it('renders three buttons with correct aria-labels', () => {
    renderToggle()
    expect(screen.getByRole('button', { name: 'System theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Light theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dark theme' })).toBeInTheDocument()
  })

  it('defaults to system as pressed', () => {
    renderToggle()
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking dark sets dark as pressed', async () => {
    renderToggle()
    await userEvent.click(screen.getByRole('button', { name: 'Dark theme' }))
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('cycling through all three modes works', async () => {
    renderToggle()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Light theme' }))
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Dark theme' }))
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'System theme' }))
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders inside a group with Theme label', () => {
    renderToggle()
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  })
})
