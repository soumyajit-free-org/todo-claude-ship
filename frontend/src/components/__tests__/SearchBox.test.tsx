import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import SearchBox from '../SearchBox'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SearchBox', () => {
  it('debounces onChange by 300ms', async () => {
    const onChange = vi.fn()
    render(<SearchBox value="" onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Search tasks' })

    await act(async () => {
      await userEvent.type(input, 'hello', { advanceTimers: vi.advanceTimersByTime })
    })

    expect(onChange).not.toHaveBeenCalled()

    await act(() => { vi.advanceTimersByTime(300) })

    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('focuses input on "/" keypress from outside', async () => {
    render(<SearchBox value="" onChange={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Search tasks' })

    expect(document.activeElement).not.toBe(input)

    await act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
    })

    expect(document.activeElement).toBe(input)
  })

  it('clears value and blurs on Escape', async () => {
    const onChange = vi.fn()
    render(<SearchBox value="test" onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Search tasks' })
    input.focus()

    await act(async () => {
      await userEvent.keyboard('{Escape}', { advanceTimers: vi.advanceTimersByTime })
    })

    expect(onChange).toHaveBeenCalledWith('')
    expect(document.activeElement).not.toBe(input)
  })

  it('has maxLength of 100', () => {
    render(<SearchBox value="" onChange={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Search tasks' })
    expect(input).toHaveAttribute('maxLength', '100')
  })

  it('shows clear button when value is non-empty', async () => {
    const onChange = vi.fn()
    render(<SearchBox value="test" onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Clear search' }), { advanceTimers: vi.advanceTimersByTime })
    })
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('hides clear button when value is empty', () => {
    render(<SearchBox value="" onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })
})
