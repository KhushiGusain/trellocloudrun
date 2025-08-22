'use client'

import { useState } from 'react'

function getActivityText(activity) {
  switch (activity.type) {
    case 'card.created':
      return (
        <>
          added <span className="text-blue-500 font-medium break-words">"{activity.data.card_title}"</span> to <span className="text-blue-500 font-medium break-words">"{activity.data.list_title || 'Unknown List'}"</span>
        </>
      )
    case 'card.updated':
      return (
        <>
          updated <span className="text-blue-500 font-medium break-words">"{activity.data.card_title}"</span>
        </>
      )
    case 'card.moved':
      return (
        <>
          moved <span className="text-blue-500 font-medium break-words">"{activity.data.card_title}"</span> to <span className="text-blue-500 font-medium break-words">"{activity.data.to_list_title || 'Unknown List'}"</span>
        </>
      )
    case 'card.deleted':
      return (
        <>
          deleted <span className="text-blue-500 font-medium break-words">"{activity.data.card_title}"</span>
        </>
      )
    case 'list.created':
      return (
        <>
          created <span className="text-blue-500 font-medium break-words">"{activity.data.list_title}"</span> list
        </>
      )
    case 'list.renamed':
      return (
        <>
          renamed list from <span className="text-blue-500 font-medium break-words">"{activity.data.old_title || 'Untitled'}"</span> to <span className="text-blue-500 font-medium break-words">"{activity.data.new_title || 'Untitled'}"</span>
        </>
      )
    case 'list.deleted':
      return (
        <>
          deleted <span className="text-blue-500 font-medium break-words">"{activity.data.list_title}"</span> list
        </>
      )
    default:
      return <span>performed an action</span>
  }
}

function formatTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
  
  return date.toLocaleDateString()
}

export default function ActivitySidebar({ isCollapsed, onToggleCollapse, activities = [] }) {
  const [showAllActivities, setShowAllActivities] = useState(false)

  const toggleShowAllActivities = () => {
    setShowAllActivities(!showAllActivities)
  }

  if (isCollapsed) {
    return (
      <div className="bg-white rounded-l-2xl shadow-lg transition-all duration-300 ease-in-out w-16 mr-2">
        <div className="p-4">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-l-2xl shadow-lg transition-all duration-300 ease-in-out w-80 mr-2">
      <div className="h-full flex flex-col">
        <div className="p-4 pb-3 flex items-center justify-between">
          <h3 className="text-[var(--color-text-primary)] font-semibold text-sm">Activity</h3>
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 rounded flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--color-text-secondary)] text-sm">No activity yet</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {(activity.actor?.display_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm text-[var(--color-text-primary)] break-words leading-relaxed">
                      <span className="font-medium">{activity.actor?.display_name || 'Unknown'}</span>{' '}
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {formatTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
