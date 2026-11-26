import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOptimistic } from '../useOptimistic'

interface Item {
  id: number
  title: string
  done: boolean
}

const initial: Item[] = [
  { id: 1, title: 'First', done: false },
  { id: 2, title: 'Second', done: false },
]

describe('useOptimistic', () => {
  it('initializes with given items', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    expect(result.current.items).toEqual(initial)
  })

  it('apply() optimistically patches an item', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))

    act(() => {
      result.current.apply(1, { done: true })
    })

    expect(result.current.items[0].done).toBe(true)
    expect(result.current.items[1].done).toBe(false)
  })

  it('confirm() replaces item with server version', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    let reqId: string

    act(() => {
      reqId = result.current.apply(1, { done: true })
    })

    const serverItem: Item = { id: 1, title: 'First (confirmed)', done: true }
    act(() => {
      result.current.confirm(reqId!, serverItem)
    })

    expect(result.current.items[0]).toEqual(serverItem)
  })

  it('rollback() reverts to the original item', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    let reqId: string

    act(() => {
      reqId = result.current.apply(1, { title: 'Changed' })
    })

    expect(result.current.items[0].title).toBe('Changed')

    act(() => {
      result.current.rollback(reqId!)
    })

    expect(result.current.items[0].title).toBe('First')
  })

  it('addItem() prepends a new item', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    const newItem: Item = { id: 3, title: 'Third', done: false }

    act(() => {
      result.current.addItem(newItem)
    })

    expect(result.current.items[0]).toEqual(newItem)
    expect(result.current.items).toHaveLength(3)
  })

  it('removeItem() removes item and restoreItem() brings it back', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    let reqId: string

    act(() => {
      reqId = result.current.removeItem(1)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(2)

    act(() => {
      result.current.restoreItem(reqId!)
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.items.find((i) => i.id === 1)).toBeTruthy()
  })

  it('rollback on a remove also restores the item', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    let reqId: string

    act(() => {
      reqId = result.current.removeItem(2)
    })

    expect(result.current.items).toHaveLength(1)

    act(() => {
      result.current.rollback(reqId!)
    })

    expect(result.current.items).toHaveLength(2)
  })

  it('handles rapid sequential applies on the same item', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))
    let reqId1: string
    let reqId2: string

    act(() => {
      reqId1 = result.current.apply(1, { title: 'Change 1' })
    })
    act(() => {
      reqId2 = result.current.apply(1, { title: 'Change 2' })
    })

    expect(result.current.items[0].title).toBe('Change 2')

    act(() => {
      result.current.rollback(reqId2!)
    })
    expect(result.current.items[0].title).toBe('Change 1')

    act(() => {
      result.current.rollback(reqId1!)
    })
    expect(result.current.items[0].title).toBe('First')
  })

  it('setItems() replaces all items and clears pending', () => {
    const { result } = renderHook(() => useOptimistic<Item>(initial))

    act(() => {
      result.current.apply(1, { title: 'Changed' })
    })

    const newItems: Item[] = [{ id: 10, title: 'Fresh', done: false }]
    act(() => {
      result.current.setItems(newItems)
    })

    expect(result.current.items).toEqual(newItems)
  })
})
