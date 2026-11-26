import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AddTodoForm from '../components/AddTodoForm'
import EmptyState from '../components/EmptyState'
import FilterPopover from '../components/FilterPopover'
import FilterTabs from '../components/FilterTabs'
import Navbar from '../components/Navbar'
import OfflineBanner from '../components/OfflineBanner'
import ProgressBar from '../components/ProgressBar'
import SearchBox from '../components/SearchBox'
import SkeletonLoader from '../components/SkeletonLoader'
import SortDropdown from '../components/SortDropdown'
import TaskCounter from '../components/TaskCounter'
import TodoList from '../components/TodoList'
import { useOptimistic } from '../hooks/useOptimistic'
import { useToast } from '../context/ToastContext'
import { errorMessage, todoApi } from '../services/api'
import type { DueFilter, Filter, Priority, SortOption, Todo } from '../types'

const UNDO_WINDOW = 5000

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { items: todos, apply, confirm, rollback, addItem, removeItem, restoreItem, setItems } =
    useOptimistic<Todo>([])
  const [filter, setFilter] = useState<Filter>(
    (searchParams.get('status') as Filter) || 'all',
  )
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [priorities, setPriorities] = useState<Priority[]>(
    (searchParams.get('priority')?.split(',').filter(Boolean) as Priority[]) || [],
  )
  const [dueFilter, setDueFilter] = useState<DueFilter | null>(
    (searchParams.get('due') as DueFilter) || null,
  )
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'position',
  )
  const [order, setOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc',
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const { addToast } = useToast()
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filter !== 'all') params.status = filter
    if (search) params.q = search
    if (priorities.length) params.priority = priorities.join(',')
    if (dueFilter) params.due = dueFilter
    if (sort !== 'position') params.sort = sort
    if (order !== 'desc') params.order = order
    setSearchParams(params, { replace: true })
  }, [filter, search, priorities, dueFilter, sort, order, setSearchParams])

  const fetchTodos = useCallback(
    async (cursor?: string) => {
      const completed = filter === 'all' ? undefined : filter === 'completed'
      const priorityParam = priorities.length === 1 ? priorities[0] : undefined
      const resp = await todoApi.list({
        completed,
        q: search || undefined,
        priority: priorityParam,
        due: dueFilter || undefined,
        sort,
        order,
        cursor,
        limit: 50,
      })
      return resp
    },
    [filter, search, priorities, dueFilter, sort, order],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchTodos()
      .then((resp) => {
        if (!cancelled) {
          setItems(resp.items)
          setNextCursor(resp.next_cursor)
          setTotalCount(resp.total_count)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchTodos, setItems])

  useEffect(() => {
    const timers = pendingDeletes.current
    return () => { timers.forEach((t) => clearTimeout(t)) }
  }, [])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const resp = await fetchTodos(nextCursor)
      setItems([...todos, ...resp.items])
      setNextCursor(resp.next_cursor)
      setTotalCount(resp.total_count)
    } catch (err) {
      addToast({ message: errorMessage(err), variant: 'error' })
    } finally {
      setLoadingMore(false)
    }
  }

  const addTodo = async (data: { title: string; description?: string; due_date?: string; priority?: Priority }) => {
    const created = await todoApi.create({
      title: data.title,
      description: data.description || null,
      due_date: data.due_date || null,
      priority: data.priority || 'medium',
    })
    addItem(created)
    addToast({ message: 'Task created', variant: 'success' })
  }

  const toggleTodo = useCallback(
    async (todo: Todo) => {
      const reqId = apply(todo.id, { is_completed: !todo.is_completed })
      try {
        const updated = await todoApi.update(todo.id, { is_completed: !todo.is_completed })
        confirm(reqId, updated)
      } catch (err) {
        rollback(reqId)
        addToast({
          message: errorMessage(err),
          variant: 'error',
          action: { label: 'Retry', onClick: () => toggleTodo(todo) },
        })
      }
    },
    [apply, confirm, rollback, addToast],
  )

  const editTodo = useCallback(
    async (id: number, data: Partial<Pick<Todo, 'title' | 'description'>>) => {
      const reqId = apply(id, data)
      try {
        const updated = await todoApi.update(id, data)
        confirm(reqId, updated)
        addToast({ message: 'Task updated', variant: 'success' })
      } catch (err) {
        rollback(reqId)
        addToast({ message: errorMessage(err), variant: 'error' })
      }
    },
    [apply, confirm, rollback, addToast],
  )

  const deleteTodo = useCallback(
    (id: number) => {
      const reqId = removeItem(id)
      const timer = setTimeout(() => {
        pendingDeletes.current.delete(reqId)
        todoApi.remove(id).catch((err) => {
          restoreItem(reqId)
          addToast({ message: errorMessage(err), variant: 'error' })
        })
      }, UNDO_WINDOW)
      pendingDeletes.current.set(reqId, timer)
      addToast({
        message: 'Task deleted',
        variant: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            const t = pendingDeletes.current.get(reqId)
            if (t) { clearTimeout(t); pendingDeletes.current.delete(reqId) }
            restoreItem(reqId)
          },
        },
      })
    },
    [removeItem, restoreItem, addToast],
  )

  const activeCount = useMemo(() => todos.filter((t) => !t.is_completed).length, [todos])

  const overdueCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return todos.filter((t) => t.due_date && !t.is_completed && new Date(t.due_date + 'T00:00:00') < today).length
  }, [todos])

  const dragDisabled = sort !== 'position' || filter !== 'all' || !!search || priorities.length > 0 || !!dueFilter

  const reorderTodo = useCallback(
    (activeId: number, overId: number) => {
      const oldIndex = todos.findIndex((t) => t.id === activeId)
      const newIndex = todos.findIndex((t) => t.id === overId)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...todos]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      setItems(reordered)

      const beforeId = newIndex < reordered.length - 1 ? reordered[newIndex + 1].id : undefined
      const afterId = newIndex > 0 ? reordered[newIndex - 1].id : undefined

      todoApi
        .updatePosition(activeId, { before_id: beforeId, after_id: afterId })
        .catch((err) => {
          addToast({ message: errorMessage(err), variant: 'error' })
        })
    },
    [todos, setItems, addToast],
  )

  return (
    <>
      <OfflineBanner />
      <Navbar />
      <main className="dashboard">
        <AddTodoForm onAdd={addTodo} />

        <div className="toolbar">
          <FilterTabs filter={filter} onChange={setFilter} />
          <SearchBox value={search} onChange={setSearch} />
        </div>

        <div className="toolbar">
          <div className="toolbar-left">
            <FilterPopover
              priorities={priorities}
              onPrioritiesChange={setPriorities}
              dueFilter={dueFilter}
              onDueFilterChange={setDueFilter}
            />
            <SortDropdown sort={sort} order={order} onSortChange={setSort} onOrderChange={setOrder} />
          </div>
          <div className="progress-wrap">
            <TaskCounter count={activeCount} overdue={overdueCount} />
            {todos.length > 0 && (
              <ProgressBar completed={todos.length - activeCount} total={todos.length} />
            )}
          </div>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div role="alert" className="error">
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : todos.length === 0 ? (
          <EmptyState filtered={filter !== 'all' || !!search || priorities.length > 0 || !!dueFilter} />
        ) : (
          <>
            <TodoList
              todos={todos}
              onToggle={toggleTodo}
              onEdit={editTodo}
              onDelete={deleteTodo}
              onReorder={reorderTodo}
              dragDisabled={dragDisabled}
            />
            {nextCursor && (
              <button
                type="button"
                className="btn-ghost"
                onClick={loadMore}
                disabled={loadingMore}
                style={{ justifySelf: 'center' }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </main>
    </>
  )
}
