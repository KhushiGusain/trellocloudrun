'use client'

import { AvatarWithPresence } from '@/components/ui'

export default function Card({
  card,
  cardIndex,
  listId,
  onDeleteCard,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onOpenCardModal
}) {
  // format due dates nicely
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const today = new Date()
    const diffTime = date - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Overdue', isOverdue: true }
    if (diffDays === 0) return { text: 'Today', isToday: true }
    if (diffDays === 1) return { text: 'Tomorrow', isUpcoming: true }
    if (diffDays <= 7) return { text: `${diffDays} days`, isUpcoming: true }
    
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isNormal: true }
  }

  const dueDateInfo = formatDueDate(card.due_date)

  return (
    <div key={card.id}>
      <div 
        className="h-1 bg-transparent transition-all duration-200 drop-zone opacity-0"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, 'card', null, listId, cardIndex)}
      />
      
      <div 
        className="bg-[var(--color-card-background)] rounded-lg shadow-md border-0 p-3 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        data-card-id={card.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          onDragStart(e, 'card', card.id, listId)
        }}
        onDragOver={(e) => {
          e.stopPropagation()
          onDragOver(e)
        }}
        onDrop={(e) => {
          e.stopPropagation()
          onDrop(e, 'card', card.id, listId, cardIndex)
        }}
        onDragEnd={(e) => {
          e.stopPropagation()
          onDragEnd(e)
        }}
        onClick={() => onOpenCardModal(card, listId)}
      >
        <div className="mb-3">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] leading-relaxed">
            {card.title}
          </h4>
        </div>
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.labels.slice(0, 3).map((label) => (
              <span
                key={label.id}
                className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                style={{ backgroundColor: label.color || 'var(--color-label-blue)' }}
              >
                {label.name}
              </span>
            ))}
            {card.labels.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] bg-gray-100 rounded">
                +{card.labels.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {dueDateInfo && (
              <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                dueDateInfo.isOverdue 
                  ? 'bg-red-50 text-[var(--color-due-overdue)]' 
                  : dueDateInfo.isToday 
                    ? 'bg-orange-50 text-orange-600'
                    : dueDateInfo.isUpcoming
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-50 text-[var(--color-due-normal)]'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{dueDateInfo.text}</span>
              </div>
            )}


            {card.comments && card.comments.length > 0 && (
              <div className="flex items-center space-x-1 text-xs text-[var(--color-text-secondary)]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{card.comments.length}</span>
              </div>
            )}


            {card.checklists && card.checklists.length > 0 && (
              <div className="flex items-center space-x-1 text-xs text-[var(--color-text-secondary)]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>{card.checklists.reduce((acc, checklist) => acc + checklist.items.length, 0)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex -space-x-1">
                {card.assignees.slice(0, 3).map((assignee) => (
                  <AvatarWithPresence
                    key={assignee.id}
                    userId={assignee.id}
                    presenceSize="xs"
                  >
                    <div
                      className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white text-xs text-white font-medium shadow-sm"
                      title={assignee.display_name}
                    >
                      {assignee.display_name.charAt(0).toUpperCase()}
                    </div>
                  </AvatarWithPresence>
                ))}
                {card.assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white text-xs text-gray-600 font-medium shadow-sm">
                    +{card.assignees.length - 3}
                  </div>
                )}
              </div>
            )}


            <button 
              className="text-[var(--color-text-secondary)] hover:text-red-500 p-1 rounded hover:bg-red-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteCard(listId, card.id)
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
