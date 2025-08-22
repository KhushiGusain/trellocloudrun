'use client'

import { useState } from 'react'

export default function AddCardButton({ listId, onCreateCard }) {
  const [showForm, setShowForm] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cardTitle.trim() || isCreating) return

    const title = cardTitle.trim()
    setIsCreating(true)

    try {
      await onCreateCard(listId, title)
      setCardTitle('')
      setShowForm(false)
    } catch (error) {
      console.error('Error creating card:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    if (isCreating) return
    setCardTitle('')
    setShowForm(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit(e)
    if (e.key === 'Escape') handleCancel()
  }

  if (showForm) {
    return (
      <div>
        <input
          type="text"
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a title for this card..."
          disabled={isCreating}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent truncate mb-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSubmit}
            disabled={!cardTitle.trim() || isCreating}
            className="px-4 cursor-pointer py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              'Add card'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isCreating}
            className="px-4 py-2 cursor-pointer text-gray-500 hover:text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button 
      className="w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-gray-50 py-2 px-3 rounded-lg transition-colors font-medium text-sm cursor-pointer"
      onClick={() => setShowForm(true)}
    >
      + Add a card
    </button>
  )
}
