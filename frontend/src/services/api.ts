import axios, { AxiosError } from 'axios'
import type { PaginatedResponse, Todo, TokenResponse, User } from '../types'

export const TOKEN_KEY = 'access_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthAttempt = error.config?.url === '/auth/login'
    if (error.response?.status === 401 && !isAuthAttempt) onUnauthorized?.()
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Network error. Please check your connection and try again.'
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string }
      if (first.msg) return first.msg
    }
  }
  return 'Something went wrong. Please try again.'
}

export interface TodoListParams {
  completed?: boolean
  q?: string
  priority?: string
  due?: string
  sort?: string
  order?: string
  cursor?: string
  limit?: number
}

export const authApi = {
  register: (email: string, password: string) =>
    api.post<User>('/auth/register', { email, password }).then((r) => r.data),
  login: (email: string, password: string) =>
    api
      .post<TokenResponse>('/auth/login', new URLSearchParams({ username: email, password }))
      .then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
}

export const todoApi = {
  list: (params?: TodoListParams) =>
    api.get<PaginatedResponse<Todo>>('/todos', { params }).then((r) => r.data),
  create: (data: { title: string; description?: string | null; due_date?: string | null; priority?: string }) =>
    api.post<Todo>('/todos', data).then((r) => r.data),
  update: (id: number, data: Partial<Pick<Todo, 'title' | 'description' | 'is_completed' | 'due_date' | 'priority'>>) =>
    api.put<Todo>(`/todos/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/todos/${id}`).then(() => undefined),
  updatePosition: (id: number, data: { before_id?: number; after_id?: number }) =>
    api.patch<Todo>(`/todos/${id}/position`, data).then((r) => r.data),
}
