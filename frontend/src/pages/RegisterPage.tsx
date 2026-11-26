import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, errorMessage } from '../services/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validate = (): string | null => {
    if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await authApi.register(email, password)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="card" onSubmit={onSubmit} noValidate>
        <h1>Create account</h1>
        {error && <p role="alert" className="error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </label>
        <label>
          Confirm password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  )
}
