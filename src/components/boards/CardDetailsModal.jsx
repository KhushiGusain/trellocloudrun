'use client'

import { useState, useEffect, useRef } from 'react'
import ModalHeader from './modal/ModalHeader'
import CardTitle from './modal/CardTitle'
import ActionButtons from './modal/ActionButtons'
import DisplayPills from './modal/DisplayPills'
import DescriptionSection from './modal/DescriptionSection'
import CommentsSection from './modal/CommentsSection'

export default function CardDetailsModal({ 
  isOpen, 
  onClose, 
  card, 
  listTitle, 
  onUpdateCard,
  boardId,
  boardLabels = [],
  boardMembers = [],
  getCardComments,
  addCardComment,
  getCardLabels,
  addCardLabel,
  removeCardLabel,
  getCardAssignees,
  addCardAssignee,
  removeCardAssignee,
  onAddBoardLabel,
  onCardUpdate
}) {
  const [description, setDescription] = useState(card?.description || '')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(card?.title || '')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [cardLabels, setCardLabels] = useState([])
  const [cardAssignees, setCardAssignees] = useState([])
  const [dueDate, setDueDate] = useState(card?.due_date || null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [labelTitle, setLabelTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [pendingCardUpdate, setPendingCardUpdate] = useState(null)
  const modalRef = useRef(null)
  const membersDropdownRef = useRef(null)
  const labelsDropdownRef = useRef(null)

  const predefinedColors = [
    { name: 'Red', color: '#ef4444' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Purple', color: '#8b5cf6' },
    { name: 'Pink', color: '#ec4899' },
    { name: 'Gray', color: '#6b7280' }
  ]

  useEffect(() => {
    if (pendingCardUpdate && onCardUpdate && card) {
      onCardUpdate(card.id, pendingCardUpdate)
      setPendingCardUpdate(null)
    }
  }, [pendingCardUpdate, onCardUpdate, card?.id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setActiveDropdown(null)
        return
      }
      
      if (activeDropdown) {
        let dropdownElement = null
        if (activeDropdown === 'members') {
          dropdownElement = membersDropdownRef.current
        } else if (activeDropdown === 'labels') {
          dropdownElement = labelsDropdownRef.current
        }
        
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          const dropdownButton = event.target.closest(`[data-dropdown="${activeDropdown}"]`)
          if (!dropdownButton) {
            setActiveDropdown(null)
          }
        } else if (!dropdownElement) {
          const dropdownButton = event.target.closest(`[data-dropdown="${activeDropdown}"]`)
          if (!dropdownButton) {
            setActiveDropdown(null)
          }
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, activeDropdown])

  useEffect(() => {
    if (isOpen && card) {
      setDescription(card.description || '')
      setTitle(card.title || '')
      setDueDate(card.due_date || null)
      setComments(card.comments || [])
      setCardLabels(card.labels || [])
      setCardAssignees(card.assignees || [])
    }
  }, [isOpen, card?.id, card?.labels, card?.assignees])

  if (!isOpen || !card) return null

  const handleSaveDescription = async () => {
    if (onUpdateCard && !isSavingDescription) {
      setIsSavingDescription(true)
      try {
        await onUpdateCard(card.id, { description: description.trim() })
        setIsEditingDescription(false)
      } catch (error) {
        console.error('Error saving description:', error)
      } finally {
        setIsSavingDescription(false)
      }
    }
  }

  const handleSaveTitle = async () => {
    if (title.trim() && onUpdateCard) {
      try {
        await onUpdateCard(card.id, { title: title.trim() })
        setIsEditingTitle(false)
      } catch (error) {
        console.error('Error saving title:', error)
      }
    }
  }

  const handleSaveDueDate = async (newDate) => {
    if (onUpdateCard) {
      try {
        await onUpdateCard(card.id, { due_date: newDate })
        setDueDate(newDate)
        setIsDatePickerOpen(false)
      } catch (error) {
        console.error('Error saving due date:', error)
      }
    }
  }

  const handleRemoveDueDate = async () => {
    if (onUpdateCard) {
      try {
        await onUpdateCard(card.id, { due_date: null })
        setDueDate(null)
        setIsDatePickerOpen(false)
      } catch (error) {
        console.error('Error removing due date:', error)
      }
    }
  }

  const handleClose = () => {
    setIsEditingDescription(false)
    setIsEditingTitle(false)
    setActiveDropdown(null)
    setIsDatePickerOpen(false)
    setCommentText('')
    setComments([])
    setCardLabels([])
    setCardAssignees([])
    setDueDate(null)
    onClose()
  }

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown)
  }

  const handleAddComment = async () => {
    if (commentText.trim() && !isAddingComment) {
      setIsAddingComment(true)
      const commentTextToAdd = commentText.trim()
      setCommentText('')

      const tempComment = {
        id: `temp_${Date.now()}`,
        body: commentTextToAdd,
        card_id: card.id,
        author_id: 'current_user',
        created_at: new Date().toISOString(),
        author: { display_name: 'You', avatar_url: null }
      }

      const updatedComments = [...comments, tempComment]
      setComments(updatedComments)
      setPendingCardUpdate({ comments: updatedComments })

      try {
        await addCardComment(card.id, commentTextToAdd)
        
        setComments(prevComments => {
          const finalComments = prevComments.map(c => c.id === tempComment.id ? { ...c, id: `real_${Date.now()}` } : c)
          setPendingCardUpdate({ comments: finalComments })
          return finalComments
        })
      } catch (error) {
        setComments(comments)
        setPendingCardUpdate({ comments })
        console.error('Error adding comment:', error)
      } finally {
        setIsAddingComment(false)
      }
    }
  }

  const handleAddLabel = async (colorName, colorValue, customTitle = null) => {
    if (isCreatingLabel) return
    
    if (card.id.startsWith('temp_')) {
      console.error('Cannot add labels to unsaved cards')
      return
    }

    setIsCreatingLabel(true)
    const labelName = customTitle || colorName
    
    let existingLabel = null
    if (!customTitle) {
      existingLabel = boardLabels.find(label => label.color_hex === colorValue)
    }
    
    if (!existingLabel) {
      existingLabel = boardLabels.find(label => label.name === labelName)
    }
    
    if (!existingLabel) {
      const tempBoardLabel = {
        id: `temp_board_${Date.now()}`,
        name: labelName,
        color_hex: colorValue,
        board_id: boardId
      }

      if (onAddBoardLabel) {
        onAddBoardLabel(tempBoardLabel)
      }

      try {
        const response = await fetch(`/api/boards/${boardId}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            name: labelName, 
            color: colorValue 
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (errorData.error && errorData.error.includes('duplicate')) {
            const existingResponse = await fetch(`/api/boards/${boardId}/labels`)
            if (existingResponse.ok) {
              const allLabels = await existingResponse.json()
              existingLabel = allLabels.find(label => label.name === labelName)
            }
          } else {
            throw new Error('Failed to create label')
          }
        } else {
          existingLabel = await response.json()
        }
      } catch (error) {
        console.error('Error creating label:', error)
        setIsCreatingLabel(false)
        return
      }
    }
    
    if (!existingLabel) {
      console.error('Could not find or create label')
      setIsCreatingLabel(false)
      return
    }
    
    const finalLabel = {
      id: existingLabel.id,
      name: existingLabel.name,
      color_hex: existingLabel.color_hex,
      board_id: boardId
    }

    const updatedLabels = [...cardLabels, finalLabel]
    setCardLabels(updatedLabels)
    setPendingCardUpdate({ labels: updatedLabels })
    setActiveDropdown(null)
    setLabelTitle('')
    setSelectedColor(null)

    try {
      await addCardLabel(card.id, existingLabel.id)
    } catch (error) {
      console.error('Error adding label to card:', error)
      console.error('Card ID:', card.id)
      console.error('Label ID:', existingLabel.id)
      setCardLabels(cardLabels)
      setPendingCardUpdate({ labels: cardLabels })
    } finally {
      setIsCreatingLabel(false)
    }
  }

  const handleColorSelect = (colorOption) => {
    setSelectedColor(colorOption)
  }

  const handleCreateLabel = () => {
    if (selectedColor && !isCreatingLabel) {
      const title = labelTitle.trim() || selectedColor.name
      handleAddLabel(selectedColor.name, selectedColor.color, title)
    }
  }

  const handleRemoveLabel = async (labelId) => {
    const originalLabels = cardLabels
    const updatedLabels = cardLabels.filter(label => label.id !== labelId)
    setCardLabels(updatedLabels)
    setPendingCardUpdate({ labels: updatedLabels })

    try {
      await removeCardLabel(card.id, labelId)
    } catch (error) {
      setCardLabels(originalLabels)
      setPendingCardUpdate({ labels: originalLabels })
      console.error('Error removing label:', error)
    }
  }

  const handleAddAssignee = async (userId) => {
    if (card.id.startsWith('temp_')) {
      console.error('Cannot add assignees to unsaved cards')
      return
    }
    
    const user = boardMembers.find(m => m.id === userId)
    const tempAssignee = {
      id: userId,
      display_name: user?.display_name || 'Unknown User',
      avatar_url: user?.avatar_url || null
    }

    const updatedAssignees = [...cardAssignees, tempAssignee]
    setCardAssignees(updatedAssignees)
    setPendingCardUpdate({ assignees: updatedAssignees })
    setActiveDropdown(null)

    try {
      await addCardAssignee(card.id, userId)
    } catch (error) {
      setCardAssignees(cardAssignees)
      setPendingCardUpdate({ assignees: cardAssignees })
      console.error('Error adding assignee:', error)
    }
  }

  const handleRemoveAssignee = async (userId) => {
    const originalAssignees = cardAssignees
    const updatedAssignees = cardAssignees.filter(assignee => assignee.id !== userId)
    setCardAssignees(updatedAssignees)
    setPendingCardUpdate({ assignees: updatedAssignees })

    try {
      await removeCardAssignee(card.id, userId)
    } catch (error) {
      setCardAssignees(originalAssignees)
      setPendingCardUpdate({ assignees: originalAssignees })
      console.error('Error removing assignee:', error)
    }
  }

  const formatTimeAgo = (dateString) => {
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

  return (
    <div 
      className="fixed inset-0 bg-opacity-10 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={() => setActiveDropdown(null)}
    >
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader listTitle={listTitle} onClose={handleClose} />

        <div className="flex h-[calc(70vh-80px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <CardTitle
                title={title}
                isEditingTitle={isEditingTitle}
                onTitleChange={setTitle}
                onSaveTitle={handleSaveTitle}
                onStartEditTitle={setIsEditingTitle}
              />

              <ActionButtons
                activeDropdown={activeDropdown}
                onToggleDropdown={toggleDropdown}
                labelTitle={labelTitle}
                onLabelTitleChange={setLabelTitle}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
                predefinedColors={predefinedColors}
                boardLabels={boardLabels}
                cardLabels={cardLabels}
                onRemoveLabel={handleRemoveLabel}
                onCreateLabel={handleCreateLabel}
                isCreatingLabel={isCreatingLabel}
                onCancelLabels={() => {
                  setSelectedColor(null)
                  setLabelTitle('')
                  setActiveDropdown(null)
                }}
                boardMembers={boardMembers}
                cardAssignees={cardAssignees}
                onAddAssignee={handleAddAssignee}
                onRemoveAssignee={handleRemoveAssignee}
                dueDate={dueDate}
                onSaveDueDate={handleSaveDueDate}
                labelsDropdownRef={labelsDropdownRef}
                membersDropdownRef={membersDropdownRef}
              />

              <DisplayPills
                cardLabels={cardLabels}
                onRemoveLabel={handleRemoveLabel}
                cardAssignees={cardAssignees}
                onRemoveAssignee={handleRemoveAssignee}
                dueDate={dueDate}
                onRemoveDueDate={handleRemoveDueDate}
              />

              <DescriptionSection
                description={description}
                isEditingDescription={isEditingDescription}
                onDescriptionChange={setDescription}
                onSaveDescription={handleSaveDescription}
                onStartEditDescription={setIsEditingDescription}
                onCancelEditDescription={() => setIsEditingDescription(false)}
                originalDescription={card?.description || ''}
                isSavingDescription={isSavingDescription}
              />
            </div>
          </div>

          <CommentsSection
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onAddComment={handleAddComment}
            comments={comments}
            formatTimeAgo={formatTimeAgo}
            isAddingComment={isAddingComment}
          />
        </div>
      </div>
    </div>
  )
}
