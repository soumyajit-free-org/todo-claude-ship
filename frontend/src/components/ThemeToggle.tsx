import { useTheme } from '../context/theme'

const options = [
  {
    value: 'system' as const,
    label: 'System theme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="12" height="9" rx="1" />
        <path d="M5 14h6M8 12v2" />
      </svg>
    ),
  },
  {
    value: 'light' as const,
    label: 'Light theme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: 'dark' as const,
    label: 'Dark theme',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 8.5a5.5 5.5 0 1 1-7-7 4.5 4.5 0 0 0 7 7z" />
      </svg>
    ),
  },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`theme-toggle-btn${theme === opt.value ? ' active' : ''}`}
          aria-pressed={theme === opt.value}
          aria-label={opt.label}
          onClick={() => setTheme(opt.value)}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
