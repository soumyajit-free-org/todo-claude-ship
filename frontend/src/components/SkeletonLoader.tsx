export default function SkeletonLoader({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading tasks">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-circle" />
          <div className="skeleton-lines">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  )
}
