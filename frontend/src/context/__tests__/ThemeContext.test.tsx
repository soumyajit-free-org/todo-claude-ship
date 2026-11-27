import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../ThemeContext'
import { useTheme } from '../theme'

function ThemeDisplay() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}

let mqListeners: Array<(e: { matches: boolean }) => void> = []
let mqMatches = false

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: mqMatches,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        mqListeners.push(cb)
      },
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        mqListeners = mqListeners.filter((l) => l !== cb)
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

beforeEach(() => {
  mqListeners = []
  mqMatches = false
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  mockMatchMedia()
})

describe('ThemeContext', () => {
  it('defaults to system theme when no localStorage value', () => {
    render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
  })

  it('resolves to dark when system prefers dark', () => {
    mqMatches = true
    render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
  })

  it('resolves explicit light/dark directly (not via system)', () => {
    localStorage.setItem('theme', 'dark')
    render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
  })

  it('persists theme to localStorage on setTheme', async () => {
    const { getByText } = render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    await act(() => { getByText('Dark').click() })
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('still works when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('system')

    await act(() => { screen.getByText('Light').click() })
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('updates resolvedTheme when OS preference changes in system mode', async () => {
    render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')

    await act(() => {
      mqListeners.forEach((cb) => cb({ matches: true }))
    })
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
  })

  it('sets data-theme attribute on documentElement', async () => {
    const { getByText } = render(
      <ThemeProvider><ThemeDisplay /></ThemeProvider>,
    )
    await act(() => { getByText('Dark').click() })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await act(() => { getByText('System').click() })
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('throws when useTheme is used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeDisplay />)).toThrow('useTheme must be used within ThemeProvider')
    spy.mockRestore()
  })
})
