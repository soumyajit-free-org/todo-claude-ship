import { useEffect, useMemo, useState } from 'react'
import AddTodoForm from '../components/AddTodoForm'
import EmptyState from '../components/EmptyState'
import FilterTabs from '../components/FilterTabs'
import Navbar from '../components/Navbar'
import TaskCounter from '../components/TaskCounter'
import TodoList from '../components/TodoList'
import { errorMessage, todoApi } from '../services/api'
import type { Filter, Todo } from '../types'

export default function DashboardPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    todoApi
      .list()
      .then((data) => {
        if (!cancelled)
          setTodos((prev) => [...prev.filter((p) => !data.some((d) => d.id === p.id)), ...data])
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = () => {
    setError(null)
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const addTodo = async (title: string, description?: string) => {
    const created = await todoApi.create(title, description)
    setTodos((prev) => [created, ...prev])
  }

  const replaceTodo = (updated: Todo) =>
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))

  const removeTodo = (id: number) => setTodos((prev) => prev.filter((t) => t.id !== id))

  const visible = useMemo(
    () =>
      todos.filter((t) =>
        filter === 'all' ? true : filter === 'active' ? !t.is_completed : t.is_completed,
      ),
    [todos, filter],
  )
  const activeCount = useMemo(() => todos.filter((t) => !t.is_completed).length, [todos])

  return (
    <>
      <Navbar />
      <main className="dashboard">
        <AddTodoForm onAdd={addTodo} />
        <div className="toolbar">
          <FilterTabs filter={filter} onChange={setFilter} />
          <TaskCounter count={activeCount} />
        </div>
        {loading ? (
          <p className="loading" role="status">Loading tasks…</p>
        ) : error ? (
          <div role="alert" className="error">
            <p>{error}</p>
            <button type="button" onClick={retry}>Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filtered={todos.length > 0} />
        ) : (
          <TodoList todos={visible} onChange={replaceTodo} onDelete={removeTodo} />
        )}
      </main>
    </>
  )
}
