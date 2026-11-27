import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <strong>My Todos</strong>
      <span className="navbar-right">
        <ThemeToggle />
        {user && <span>{user.email}</span>}
        <button type="button" onClick={onLogout}>Logout</button>
      </span>
    </header>
  )
}
