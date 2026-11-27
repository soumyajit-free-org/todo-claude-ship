import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RegisterPage from '../pages/RegisterPage'
import { authApi } from '../services/api'

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>()
  return { ...actual, authApi: { register: vi.fn(), login: vi.fn(), me: vi.fn() } }
})

function setup() {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('RegisterPage (US1)', () => {
  it('shows an error and does not submit when passwords do not match', async () => {
    const user = setup()
    await user.type(screen.getByLabelText('Email'), 'a@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'different123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.')
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('rejects a malformed email before submitting', async () => {
    const user = setup()
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(screen.getByRole('alert')).toHaveTextContent('valid email')
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', async () => {
    const user = setup()
    await user.type(screen.getByLabelText('Email'), 'a@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.type(screen.getByLabelText('Confirm password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters')
    expect(authApi.register).not.toHaveBeenCalled()
  })
})
