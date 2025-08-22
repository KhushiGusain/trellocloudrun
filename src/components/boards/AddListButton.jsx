'use client'

import { useState } from 'react'

export default function AddListButton({ showAddList, setShowAddList, newListTitle, setNewListTitle, createList, isActivitySidebarCollapsed = false }) {
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListTitle.trim() || isCreating) return

    const listTitle = newListTitle.trim()
    setIsCreating(true)

    try {
      await createList(listTitle)
      setNewListTitle('')
      setShowAddList(false)
    } catch (error) {
      console.error('Error creating list:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    if (isCreating) return
    setNewListTitle('')
    setShowAddList(false)
  }

  if (showAddList) {
    return (
      <div className={`${isActivitySidebarCollapsed ? 'w-72' : 'w-64'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
        <div className="bg-white rounded-lg shadow-md border-2 border-[var(--color-primary)] p-4">
          <input
            type="text"
            placeholder="Enter list title..."
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateList(e)
              if (e.key === 'Escape') handleCancel()
            }}
            disabled={isCreating}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-3 truncate disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateList}
              disabled={!newListTitle.trim() || isCreating}
              className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                'Add list'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isCreating}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isActivitySidebarCollapsed ? 'w-72' : 'w-64'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
      <div 
        className="bg-white rounded-lg shadow-md border-2 border-dashed border-[var(--color-primary)] p-4 flex items-center justify-center hover:bg-[var(--color-hover)] transition-colors cursor-pointer group"
        onClick={() => setShowAddList(true)}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-[var(--color-primary-hover)] transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-[var(--color-primary)] font-medium text-sm group-hover:text-[var(--color-primary-hover)] transition-colors">Add List</p>
        </div>
      </div>
    </div>
  )
}
