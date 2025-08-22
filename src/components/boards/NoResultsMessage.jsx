'use client'

export function NoResultsMessage({ searchQuery }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        No boards found matching "{searchQuery}"
      </p>
    </div>
  )
}
