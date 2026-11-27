import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Announcements,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useMemo } from 'react'
import type { Todo } from '../types'
import SortableTodoItem from './SortableTodoItem'

interface Props {
  todos: Todo[]
  onToggle: (todo: Todo) => void
  onEdit: (id: number, data: Partial<Pick<Todo, 'title' | 'description'>>) => void
  onDelete: (id: number) => void
  onReorder?: (activeId: number, overId: number) => void
  dragDisabled?: boolean
}

export default function TodoList({ todos, onToggle, onEdit, onDelete, onReorder, dragDisabled }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder?.(Number(active.id), Number(over.id))
    }
  }

  const getTitle = (id: string | number) => todos.find((t) => t.id === Number(id))?.title ?? 'item'

  const announcements: Announcements = useMemo(() => ({
    onDragStart({ active }) {
      return `Picked up ${getTitle(active.id)}`
    },
    onDragOver({ active }) {
      return `Moving ${getTitle(active.id)}`
    },
    onDragEnd({ active, over }) {
      if (over) {
        const idx = todos.findIndex((t) => t.id === Number(over.id))
        return `Dropped ${getTitle(active.id)} at position ${idx + 1} of ${todos.length}`
      }
      return `Dropped ${getTitle(active.id)}`
    },
    onDragCancel({ active }) {
      return `Cancelled dragging ${getTitle(active.id)}`
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [todos])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="todo-list">
          {todos.map((todo) => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              dragDisabled={dragDisabled}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
