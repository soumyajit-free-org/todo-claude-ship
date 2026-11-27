import type { Todo } from '../types'
import TodoItem from './TodoItem'

interface Props {
  todos: Todo[]
  onChange: (todo: Todo) => void
  onDelete: (id: number) => void
}

export default function TodoList({ todos, onChange, onDelete }: Props) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onChange={onChange} onDelete={onDelete} />
      ))}
    </ul>
  )
}
