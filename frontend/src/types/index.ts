export interface User {
  id: number
  email: string
  created_at: string
}

export interface Todo {
  id: number
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export type Filter = 'all' | 'active' | 'completed'

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpired: boolean
  authError: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  retry: () => void
}
