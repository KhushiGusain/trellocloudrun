'use client'

import { Button } from '@/components/ui'

export function EmptyState({ onCreateBoard }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--color-hover)] flex items-center justify-center">
        <svg className="w-12 h-12" style={{ color: 'var(--color-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-navy)' }}>
        No boards yet
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Create your first board to get started with organizing your work
      </p>
      <Button onClick={onCreateBoard}>
        Create your first board
      </Button>
    </div>
  )
}
