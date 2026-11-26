import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import DueDateChip from '../DueDateChip'

function dateStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('DueDateChip', () => {
  it('shows "Overdue" with danger class for past dates', () => {
    render(<DueDateChip dueDate={dateStr(-3)} />)
    const chip = screen.getByText('Overdue')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveClass('due-overdue')
  })

  it('shows "Due today" for today', () => {
    render(<DueDateChip dueDate={dateStr(0)} />)
    expect(screen.getByText('Due today')).toBeInTheDocument()
    expect(screen.getByText('Due today')).not.toHaveClass('due-overdue')
  })

  it('shows "Due tomorrow" for tomorrow', () => {
    render(<DueDateChip dueDate={dateStr(1)} />)
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument()
  })

  it('shows formatted date for future dates beyond tomorrow', () => {
    const { container } = render(<DueDateChip dueDate={dateStr(10)} />)
    const chip = container.querySelector('.due-chip')!
    expect(chip.textContent).not.toContain('Overdue')
    expect(chip.textContent).not.toContain('Due today')
    expect(chip.textContent).not.toContain('Due tomorrow')
    expect(chip).not.toHaveClass('due-overdue')
  })

  it('has due-chip class on all variants', () => {
    const { container } = render(<DueDateChip dueDate={dateStr(0)} />)
    expect(container.querySelector('.due-chip')).toBeInTheDocument()
  })
})
