export interface User {
  id: number
  email: string
  created_at: string
}

export type Priority = 'low' | 'medium' | 'high'
export type DueFilter = 'overdue' | 'today' | 'upcoming' | 'none'
export type SortOption = 'created_at' | 'due_date' | 'priority' | 'position'

export interface Todo {
  id: number
  title: string
  description: string | null
  is_completed: boolean
  due_date: string | null
  priority: Priority
  position: number
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null
  total_count: number
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
