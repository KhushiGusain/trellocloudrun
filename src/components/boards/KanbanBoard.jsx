'use client'

import { useState, useEffect } from 'react'
import CardDetailsModal from './CardDetailsModal'
import List from './List'
import AddListButton from './AddListButton'

export default function KanbanBoard({ 
  lists, 
  onListsChange,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onUpdateListsOrder,
  onUpdateCardsOrder,
  onMoveCard,
  boardId,
  boardLabels = [],
  boardMembers = [],
  onGetCardComments,
  onAddCardComment,
  onGetCardLabels,
  onAddCardLabel,
  onRemoveCardLabel,
  onGetCardAssignees,
  onAddCardAssignee,
  onRemoveCardAssignee,
  onAddBoardLabel,
  cardToOpen,
  isActivitySidebarCollapsed = false
}) {
  const [editingListId, setEditingListId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showAddList, setShowAddList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [draggedCard, setDraggedCard] = useState(null)
  const [draggedList, setDraggedList] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (cardToOpen && cardToOpen.card) {
      setSelectedCard(cardToOpen.card)
      setIsModalOpen(true)
    }
  }, [cardToOpen])

  useEffect(() => {
    if (selectedCard && lists.length > 0) {
      const updatedCard = lists
        .flatMap(list => list.cards || [])
        .find(card => card.id === selectedCard.id)
      
      if (updatedCard && JSON.stringify(updatedCard) !== JSON.stringify(selectedCard)) {
        setSelectedCard(updatedCard)
      }
    }
  }, [lists, selectedCard?.id])

  const startEditList = (listId, currentTitle) => {
    setEditingListId(listId)
    setEditingText(currentTitle)
  }

  const saveListTitle = async (listId) => {
    const trimmedText = editingText.trim()
    
    if (!trimmedText) {
      setEditingListId(null)
      setEditingText('')
      return
    }
    
    try {
      await onUpdateList(listId, { title: trimmedText })
      setEditingListId(null)
      setEditingText('')
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const cancelEditList = () => {
    setEditingListId(null)
    setEditingText('')
  }

  const createList = async (title) => {
    if (title && title.trim()) {
      try {
        await onCreateList(title.trim())
        setNewListTitle('')
        setShowAddList(false)
      } catch (error) {
        console.error('Error creating list:', error)
      }
    }
  }

  const deleteList = async (listId) => {
    try {
      await onDeleteList(listId)
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  const reorderList = async (fromIndex, toIndex) => {
    const newLists = [...lists]
    const [movedList] = newLists.splice(fromIndex, 1)
    newLists.splice(toIndex, 0, movedList)
    
    const updatedLists = newLists.map((list, index) => ({
      ...list,
      position: index + 1
    }))
    
    try {
      await onListsChange(updatedLists)
    } catch (error) {
      console.error('Error reordering lists:', error)
    }
  }



  const createCard = async (listId, title) => {
    if (title.trim()) {
      try {
        await onCreateCard(listId, title.trim())
      } catch (error) {
        console.error('Error creating card:', error)
      }
    }
  }

  const deleteCard = async (listId, cardId) => {
    try {
      await onDeleteCard(listId, cardId)
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const moveCard = async (fromListId, toListId, cardId, newPosition) => {
    try {
      await onMoveCard(fromListId, toListId, cardId, newPosition)
    } catch (error) {
      console.error('Error moving card:', error)
    }
  }

  const reorderCard = async (listId, fromIndex, toIndex) => {
    console.log('Reordering card in list:', listId, 'from index:', fromIndex, 'to index:', toIndex)
    
    const updatedLists = lists.map(list => {
      if (list.id !== listId) return list
      
      const newCards = [...list.cards]
      const [movedCard] = newCards.splice(fromIndex, 1)
      newCards.splice(toIndex, 0, movedCard)
      
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: (index + 1) * 1000,
        list_id: listId
      }))
      
      return { ...list, cards: updatedCards }
    })
    
    console.log('Updated lists for reordering:', updatedLists)
    
    try {
      await onUpdateCardsOrder(updatedLists)
    } catch (error) {
      console.error('Error reordering cards:', error)
    }
  }

  const handleDragStart = (e, type, id, listId = null) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id, listId }))
    
    if (type === 'card') {
      setDraggedCard({ id, listId })
      // better drag look
      e.target.style.opacity = '0.6'
      e.target.style.transform = 'rotate(3deg) scale(1.02)'
      e.target.style.zIndex = '1000'
      e.target.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.3)'
      e.target.style.transition = 'all 0.2s ease'
      
      // show drop zones
      document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.style.opacity = '1'
        zone.style.height = '12px'
        zone.style.backgroundColor = '#f8fafc'
        zone.style.border = '1px dashed #cbd5e1'
        zone.style.borderRadius = '4px'
        zone.style.transition = 'all 0.2s ease'
        
        // bigger for empty lists
        if (zone.classList.contains('border-dashed') && zone.querySelector('span')) {
          zone.style.height = '48px' 
          zone.style.opacity = '1'
          zone.style.backgroundColor = '#f1f5f9'
          zone.style.borderColor = '#94a3b8'
        }
      })
    } else if (type === 'list') {
      setDraggedList({ id })
      e.target.style.opacity = '0.6'
      e.target.style.transform = 'rotate(2deg) scale(1.02)'
      e.target.style.zIndex = '1000'
      e.target.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.3)'
      e.target.style.transition = 'all 0.2s ease'
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const dropZone = e.target.closest('.drop-zone') || (e.target.classList.contains('drop-zone') ? e.target : null)
    
    if (dropZone) {
      dropZone.style.backgroundColor = '#dbeafe'
      dropZone.style.borderColor = '#3b82f6'
      dropZone.style.borderWidth = '2px'
      dropZone.style.borderStyle = 'solid'
      dropZone.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)'
      dropZone.style.transform = 'scaleY(1.8)'
      
      if (dropZone.classList.contains('border-dashed') && dropZone.querySelector('span')) {
        dropZone.style.backgroundColor = '#eff6ff'
        dropZone.style.transform = 'scale(1.02)'
      }
    }
  }

  const handleDragLeave = (e) => {
    // only reset when actually leaving
    const relatedTarget = e.relatedTarget
    const dropZone = e.target.closest('.drop-zone') || (e.target.classList.contains('drop-zone') ? e.target : null)
    
    if (dropZone && (!relatedTarget || !dropZone.contains(relatedTarget))) {
      dropZone.style.backgroundColor = '#f8fafc'
      dropZone.style.borderColor = '#cbd5e1'
      dropZone.style.borderWidth = '1px'
      dropZone.style.borderStyle = 'dashed'
      dropZone.style.boxShadow = ''
      dropZone.style.transform = 'scaleY(1)'
      
      // reset empty lists too
      if (dropZone.classList.contains('border-dashed') && dropZone.querySelector('span')) {
        dropZone.style.backgroundColor = '#f1f5f9'
        dropZone.style.borderColor = '#94a3b8'
        dropZone.style.transform = 'scale(1)'
      }
    }
  }

  const handleDrop = (e, type, targetId, targetListId = null, position = null) => {
    e.preventDefault()
    
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.style.opacity = ''
      zone.style.height = ''
      zone.style.backgroundColor = ''
      zone.style.border = ''
      zone.style.borderRadius = ''
      zone.style.borderWidth = ''
      zone.style.borderStyle = ''
      zone.style.borderColor = ''
      zone.style.borderTop = ''
      zone.style.boxShadow = ''
      zone.style.transform = ''
      zone.style.transition = ''
      
      if (zone.classList.contains('border-dashed') && zone.querySelector('span')) {
        zone.style.opacity = '0.3'
      }
    })
    
    try {
      const dragData = e.dataTransfer.getData('text/plain')
      let parsedData = null
      
      if (dragData) {
        try {
          parsedData = JSON.parse(dragData)
        } catch (parseError) {
          console.error('Error parsing drag data:', parseError)
        }
      }
      
      if (type === 'card' && draggedCard) {
        console.log('Dropping card:', draggedCard, 'to list:', targetListId, 'at position:', position)
        
        if (draggedCard.listId === targetListId) {
          const fromIndex = lists.find(l => l.id === draggedCard.listId).cards.findIndex(c => c.id === draggedCard.id)
          const toIndex = position || 0
          console.log('Reordering card from index:', fromIndex, 'to index:', toIndex)
          if (fromIndex !== toIndex) {
            reorderCard(draggedCard.listId, fromIndex, toIndex)
          }
        } else {
          console.log('Moving card to different list')
          moveCard(draggedCard.listId, targetListId, draggedCard.id, position || 0)
        }
      } else if (type === 'list' && draggedList) {
        const fromIndex = lists.findIndex(l => l.id === draggedList.id)
        const toIndex = lists.findIndex(l => l.id === targetId)
        if (fromIndex !== toIndex) {
          reorderList(fromIndex, toIndex)
        }
      }
    } catch (error) {
      console.error('Error in drag and drop:', error)
    }
    
    setDraggedCard(null)
    setDraggedList(null)
    
    if (e.target.style) {
      e.target.style.opacity = '1'
      e.target.style.transform = 'none'
      e.target.style.zIndex = 'auto'
    }
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    e.target.style.transform = 'none'
    e.target.style.zIndex = 'auto'
    e.target.style.boxShadow = ''
    e.target.style.transition = ''
    
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.style.opacity = ''
      zone.style.height = ''
      zone.style.backgroundColor = ''
      zone.style.border = ''
      zone.style.borderRadius = ''
      zone.style.borderWidth = ''
      zone.style.borderStyle = ''
      zone.style.borderColor = ''
      zone.style.borderTop = ''
      zone.style.boxShadow = ''
      zone.style.transform = ''
      zone.style.transition = ''
      
      if (zone.classList.contains('border-dashed') && zone.querySelector('span')) {
        zone.style.opacity = '0.3'
      }
    })
    
    setDraggedCard(null)
    setDraggedList(null)
  }

  const openCardModal = (card, listTitle) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const closeCardModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
  }

  const updateCard = async (cardId, updates) => {
    try {
      const updatedCard = await onUpdateCard(cardId, updates)
      
      const updatedLists = lists.map(list => ({
        ...list,
        cards: list.cards.map(card => 
          card.id === cardId ? { ...card, ...updatedCard } : card
        )
      }))
      
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard({ ...selectedCard, ...updatedCard })
      }
      
      onListsChange(updatedLists)
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const updateCardData = (cardId, updates) => {
    const updatedLists = lists.map(list => ({
      ...list,
      cards: list.cards.map(card => {
        if (card.id === cardId) {
          const updatedCard = { ...card }
          
          if (updates.labels) {
            updatedCard.labels = updates.labels
          }
          if (updates.comments) {
            updatedCard.comments = updates.comments
          }
          if (updates.assignees) {
            updatedCard.assignees = updates.assignees
          }
          if (updates.description !== undefined) {
            updatedCard.description = updates.description
          }
          if (updates.title !== undefined) {
            updatedCard.title = updates.title
          }
          if (updates.due_date !== undefined) {
            updatedCard.due_date = updates.due_date
          }
          
          return updatedCard
        }
        return card
      })
    }))
    
    if (selectedCard && selectedCard.id === cardId) {
      const updatedSelectedCard = { ...selectedCard }
      
      if (updates.labels) {
        updatedSelectedCard.labels = updates.labels
      }
      if (updates.comments) {
        updatedSelectedCard.comments = updates.comments
      }
      if (updates.assignees) {
        updatedSelectedCard.assignees = updates.assignees
      }
      if (updates.description !== undefined) {
        updatedSelectedCard.description = updates.description
      }
      if (updates.title !== undefined) {
        updatedSelectedCard.title = updates.title
      }
      if (updates.due_date !== undefined) {
        updatedSelectedCard.due_date = updates.due_date
      }
      
      setSelectedCard(updatedSelectedCard)
    }
    
    onListsChange(updatedLists)
  }

  return (
    <div className="flex-1 p-4 bg-[var(--color-app-background)] overflow-x-auto custom-scrollbar">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
      
      <div className="flex flex-col space-y-4">

        <div className="flex space-x-3 min-w-max pb-2">
          {lists.map((list, listIndex) => (
            <List
              key={list.id}
              list={list}
              listIndex={listIndex}
              editingListId={editingListId}
              editingText={editingText}
              setEditingText={setEditingText}
              onStartEditList={startEditList}
              onSaveListTitle={saveListTitle}
              onCancelEditList={cancelEditList}
              onDeleteList={deleteList}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onCreateCard={createCard}
              onOpenCardModal={openCardModal}
              onDeleteCard={deleteCard}
              isActivitySidebarCollapsed={isActivitySidebarCollapsed}
            />
          ))}
        </div>

        <div className="flex justify-start">
          <AddListButton
            showAddList={showAddList}
            setShowAddList={setShowAddList}
            newListTitle={newListTitle}
            setNewListTitle={setNewListTitle}
            createList={createList}
          />
        </div>
      </div>
      
      <CardDetailsModal
        isOpen={isModalOpen}
        onClose={closeCardModal}
        card={selectedCard}
        listTitle={selectedCard ? lists.find(list => list.cards.some(card => card.id === selectedCard.id))?.title : ''}
        onUpdateCard={updateCard}
        boardId={boardId}
        boardLabels={boardLabels || []}
        boardMembers={boardMembers || []}
        getCardComments={onGetCardComments}
        addCardComment={onAddCardComment}
        getCardLabels={onGetCardLabels}
        addCardLabel={onAddCardLabel}
        removeCardLabel={onRemoveCardLabel}
        getCardAssignees={onGetCardAssignees}
        addCardAssignee={onAddCardAssignee}
        removeCardAssignee={onRemoveCardAssignee}
        onAddBoardLabel={onAddBoardLabel}
        onCardUpdate={updateCardData}
      />
    </div>
  )
}
