import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (q: string) => void
}

export default function SearchBox({ value, onChange }: Props) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocal(value) }, [value])

  const debounce = useCallback(
    (v: string) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => onChange(v), 300)
    },
    [onChange],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as Element).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="search-box">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search tasks… (press /)"
        maxLength={100}
        value={local}
        aria-label="Search tasks"
        onChange={(e) => {
          setLocal(e.target.value)
          debounce(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocal('')
            onChange('')
            inputRef.current?.blur()
          }
        }}
      />
      {local && (
        <button
          type="button"
          className="search-clear btn-ghost"
          aria-label="Clear search"
          onClick={() => { setLocal(''); onChange('') }}
        >
          ×
        </button>
      )}
    </div>
  )
}
