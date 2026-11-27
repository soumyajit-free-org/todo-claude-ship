import { useCallback, useRef, useState } from 'react'

export interface OptimisticState<T extends { id: number }> {
  items: T[]
  apply: (id: number, patch: Partial<T>) => string
  confirm: (reqId: string, server: T) => void
  rollback: (reqId: string) => void
  addItem: (item: T) => void
  removeItem: (id: number) => string
  restoreItem: (reqId: string) => void
  setItems: (items: T[]) => void
}

interface Pending<T> {
  reqId: string
  itemId: number
  prev: T
  type: 'update' | 'remove'
}

let _reqId = 0
function nextReqId() {
  return `req-${++_reqId}`
}

export function useOptimistic<T extends { id: number }>(
  initial: T[],
): OptimisticState<T> {
  const [items, setItemsState] = useState<T[]>(initial)
  const pendingRef = useRef<Pending<T>[]>([])

  const setItems = useCallback((next: T[]) => {
    pendingRef.current = []
    setItemsState(next)
  }, [])

  const apply = useCallback((id: number, patch: Partial<T>): string => {
    const reqId = nextReqId()
    setItemsState((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) {
        pendingRef.current.push({ reqId, itemId: id, prev: { ...item }, type: 'update' })
      }
      return prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    })
    return reqId
  }, [])

  const confirm = useCallback((reqId: string, server: T) => {
    pendingRef.current = pendingRef.current.filter((p) => p.reqId !== reqId)
    setItemsState((prev) => prev.map((i) => (i.id === server.id ? server : i)))
  }, [])

  const rollback = useCallback((reqId: string) => {
    const pending = pendingRef.current.find((p) => p.reqId === reqId)
    if (!pending) return
    pendingRef.current = pendingRef.current.filter((p) => p.reqId !== reqId)
    if (pending.type === 'update') {
      setItemsState((prev) => prev.map((i) => (i.id === pending.itemId ? pending.prev : i)))
    } else {
      setItemsState((prev) => [...prev, pending.prev])
    }
  }, [])

  const addItem = useCallback((item: T) => {
    setItemsState((prev) => [item, ...prev])
  }, [])

  const removeItem = useCallback((id: number): string => {
    const reqId = nextReqId()
    setItemsState((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) {
        pendingRef.current.push({ reqId, itemId: id, prev: { ...item }, type: 'remove' })
      }
      return prev.filter((i) => i.id !== id)
    })
    return reqId
  }, [])

  const restoreItem = useCallback((reqId: string) => {
    const pending = pendingRef.current.find((p) => p.reqId === reqId)
    if (!pending) return
    pendingRef.current = pendingRef.current.filter((p) => p.reqId !== reqId)
    setItemsState((prev) => [...prev, pending.prev])
  }, [])

  return { items, apply, confirm, rollback, addItem, removeItem, restoreItem, setItems }
}
