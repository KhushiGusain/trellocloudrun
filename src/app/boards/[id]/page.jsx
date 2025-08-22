'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, use, useState, useRef, useCallback } from 'react'
import { Button, AvatarWithPresence } from '@/components/ui'
import KanbanBoard from '@/components/boards/KanbanBoard'
import ActivitySidebar from '@/components/boards/ActivitySidebar'
import BoardMembersModal from '@/components/boards/BoardMembersModal'
import MemberDetailsModal from '@/components/boards/MemberDetailsModal'
import useBoard from '@/hooks/useBoard'
import Sidebar from '@/components/layout/Sidebar'
import { useBoards } from '@/hooks/useBoards'

export default function BoardPage({ params }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { id } = use(params)
  const [isActivitySidebarCollapsed, setIsActivitySidebarCollapsed] = useState(false)
  const [boardMembers, setBoardMembers] = useState([])
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedDueDate, setSelectedDueDate] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const searchRef = useRef(null)
  const [cardToOpen, setCardToOpen] = useState(null)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null)
  const [isMemberDetailsModalOpen, setIsMemberDetailsModalOpen] = useState(false)
  const [isBoardNavigating, setIsBoardNavigating] = useState(false)
  
  // grab boards for the sidebar
  const { boards, fetchBoards, isLoading: boardsLoading } = useBoards()
  
  const {
    board,
    lists,
    labels,
    activities,
    userRole,
    loading: boardLoading,
    error: boardError,
    refetch,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    updateListsOrder,
    updateCardsOrder,
    moveCard,
    updateBoard,
    addBoardLabel,
    getCardComments,
    addCardComment,
    getCardLabels,
    addCardLabel,
    removeCardLabel,
    getCardAssignees,
    addCardAssignee,
    removeCardAssignee,
    getBoardMembers,
    onCardUpdate
  } = useBoard(id)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const refreshFilterData = useCallback(async () => {
    try {
      const members = await getBoardMembers()
      setBoardMembers(members)
    } catch (error) {
      console.error('Error refreshing filter data:', error)
    }
  }, [getBoardMembers])

  useEffect(() => {
    if (board) {
      refreshFilterData()
    }
  }, [board])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (cardToOpen) {
      const timer = setTimeout(() => {
        setCardToOpen(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [cardToOpen])

  // clear loading state when board loads
  useEffect(() => {
    if (!boardLoading && board) {
      setIsBoardNavigating(false)
    }
  }, [boardLoading, board])

  const toggleActivitySidebar = () => {
    setIsActivitySidebarCollapsed(!isActivitySidebarCollapsed)
  }

  const handleListsChange = (newLists) => {
    updateListsOrder(newLists)
  }

  const handleBoardUpdate = async (updates) => {
    try {
      await updateBoard(updates)
    } catch (error) {
      console.error('Error updating board:', error)
    }
  }

  const handleTitleEdit = () => {
    setTitleValue(board?.title || '')
    setIsEditingTitle(true)
  }

  const handleMemberClick = (member) => {
    setSelectedMemberDetails(member)
    setIsMemberDetailsModalOpen(true)
  }

  const handleCloseMemberDetails = () => {
    setIsMemberDetailsModalOpen(false)
    setSelectedMemberDetails(null)
  }

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== board?.title) {
      try {
        await updateBoard({ title: titleValue.trim() })
      } catch (error) {
        console.error('Error updating board title:', error)
      }
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setTitleValue('')
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setSelectedResultIndex(-1)
    if (query.trim()) {
      const results = []
      lists.forEach(list => {
        list.cards.forEach(card => {
          if (card.title.toLowerCase().includes(query.toLowerCase())) {
            results.push({ ...card, listTitle: list.title })
          }
        })
      })
      setSearchResults(results)
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const handleSearchResultClick = (card) => {
    setShowSearchResults(false)
    setSearchQuery('')
    const list = lists.find(l => l.cards.some(c => c.id === card.id))
    if (list) {
      const cardWithListInfo = { ...card, list_id: list.id }
      setCardToOpen({ card: cardWithListInfo, listTitle: list.title })
    }
  }

  const handleFilterChange = (type, value) => {
    if (type === 'member') setSelectedMember(value)
    if (type === 'dueDate') setSelectedDueDate(value)
  }

  const clearFilters = () => {
    setSelectedMember('')
    setSelectedDueDate('')
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }



  const getFilteredLists = () => {
    if (!selectedMember && !selectedDueDate) {
      return lists
    }

    return lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => {
        let memberMatch = true
        if (selectedMember) {
          if (selectedMember === 'unassigned') {
            memberMatch = !card.assignees || card.assignees.length === 0
          } else {
            memberMatch = card.assignees && card.assignees.some(assignee => assignee.id === selectedMember)
          }
        }
        const dueDateMatch = !selectedDueDate || checkDueDateFilter(card.due_date, selectedDueDate)
        return memberMatch && dueDateMatch
      })
    }))
  }

  const checkDueDateFilter = (dueDate, filter) => {
    if (!dueDate) return filter === 'no-due'
    const today = new Date()
    const cardDate = new Date(dueDate)
    const diffTime = cardDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    switch (filter) {
      case 'overdue': return diffDays < 0
      case 'today': return diffDays === 0
      case 'week': return diffDays >= 0 && diffDays <= 7
      case 'month': return diffDays >= 0 && diffDays <= 30
      default: return true
    }
  }

  if (loading || boardLoading || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-app-background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading board...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-app-background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (boardError) {    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-app-background)]">
        <div className="text-center">
          <div className="text-[var(--color-error)] mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Error Loading Board</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">{boardError}</p>
          <Button onClick={() => router.push('/boards')} className="bg-[var(--color-primary)] text-white">
            Back to Boards
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-screen bg-[var(--color-app-background)] flex">
      <Sidebar 
        boards={boards || []} 
        currentBoardId={id}
        onRefreshBoards={fetchBoards}
        isLoadingBoards={boardsLoading}
        onBoardNavigating={setIsBoardNavigating}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 pl-2 relative">

        <header className="bg-white rounded-b-2xl shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      onBlur={handleTitleSave}
                      className="text-2xl font-bold text-[var(--color-text-primary)] bg-transparent border-b-2 border-[var(--color-primary)] focus:outline-none px-1"
                      autoFocus
                    />
                  </div>
                ) : (
                  <h1 
                    className="text-2xl font-bold text-[var(--color-text-primary)] hover:underline cursor-pointer"
                    onClick={handleTitleEdit}
                  >
                    {board.title}
                  </h1>
                )}
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-hover)] text-[var(--color-primary)]">
                  {board?.visibility === 'workspace' ? 'Workspace' : 'Private'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {board?.visibility === 'workspace' ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-[var(--color-text-secondary)] font-medium">Team</span>
                    <div className="flex -space-x-2">
                      {boardMembers.slice(0, 5).map((member, index) => (
                        <AvatarWithPresence 
                          key={member.id}
                          userId={member.id} 
                          presenceSize="sm"
                          className="cursor-pointer hover:scale-105 transition-transform"
                        >
                          <div 
                            className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white shadow-sm"
                            title={`${member.display_name} - Click for details`}
                            onClick={() => handleMemberClick(member)}
                          >
                            <span className="text-white text-sm font-semibold">
                              {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </AvatarWithPresence>
                      ))}
                    </div>
                    {boardMembers.length > 5 && (
                      <span 
                        className="text-sm text-[var(--color-text-secondary)] ml-2 cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                        onClick={() => setIsMembersModalOpen(true)}
                      >
                        +{boardMembers.length - 5} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-[var(--color-text-secondary)] font-medium">Owner</span>
                    <AvatarWithPresence 
                      userId={board?.created_by?.id} 
                      presenceSize="sm"
                      className="cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div 
                        className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white shadow-sm"
                        title={`${board?.created_by?.display_name} - Click for details`}
                        onClick={() => handleMemberClick(board?.created_by)}
                      >
                        <span className="text-white text-sm font-semibold">
                          {board?.created_by?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </AvatarWithPresence>
                  </div>
                )}
                
                {board?.visibility === 'workspace' && (
                  <button 
                    onClick={() => setIsMembersModalOpen(true)}
                    className="px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-hover)] transition-colors font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Invite</span>
                  </button>
                )}
              </div>
            </div>


            <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSelectedResultIndex(prev => 
                      prev < searchResults.length - 1 ? prev + 1 : 0
                    )
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSelectedResultIndex(prev => 
                      prev > 0 ? prev - 1 : searchResults.length - 1
                    )
                  } else if (e.key === 'Enter' && selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
                    e.preventDefault()
                    handleSearchResultClick(searchResults[selectedResultIndex])
                  } else if (e.key === 'Escape') {
                    setShowSearchResults(false)
                    setSearchQuery('')
                  }
                }}
                className="w-64 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((card, index) => (
                      <div
                        key={card.id}
                        onClick={() => handleSearchResultClick(card)}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                          index === selectedResultIndex 
                            ? 'bg-[var(--color-hover)] border-[var(--color-primary)]' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {card.title}
                            </div>
                            <div className="text-sm text-[var(--color-text-secondary)]">in {card.listTitle}</div>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            {card.assignees && card.assignees.length > 0 && (
                              <div className="flex -space-x-1">
                                {card.assignees.slice(0, 3).map((assignee) => (
                                  <div
                                    key={assignee.id}
                                    className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border border-white"
                                    title={assignee.display_name}
                                  >
                                    <span className="text-xs text-white font-medium">
                                      {assignee.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                ))}
                                {card.assignees.length > 3 && (
                                  <span className="text-xs text-[var(--color-text-secondary)] ml-1">+{card.assignees.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <div className="text-[var(--color-text-secondary)] mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">No cards found</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select 
                  value={selectedMember}
                  onChange={(e) => handleFilterChange('member', e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer appearance-none pr-8"
                >
                  <option value="">All Members</option>
                  <option value="unassigned">Unassigned</option>
                  {boardMembers?.map(member => (
                    <option key={member.id} value={member.id}>{member.display_name}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              <div className="relative">
                <select 
                  value={selectedDueDate}
                  onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer appearance-none pr-8"
                >
                  <option value="">Due Date</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due today</option>
                  <option value="week">Due this week</option>
                  <option value="month">Due this month</option>
                  <option value="no-due">No due date</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              <button 
                onClick={clearFilters}
                className="px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 rounded transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
            </div>
          </div>
        </header>


        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <KanbanBoard
              lists={getFilteredLists()}
              onListsChange={handleListsChange}
              onCreateList={createList}
              onUpdateList={updateList}
              onDeleteList={deleteList}
              onCreateCard={createCard}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              onUpdateListsOrder={updateListsOrder}
              onUpdateCardsOrder={updateCardsOrder}
              onMoveCard={moveCard}
              boardId={id}
              boardLabels={labels}
              boardMembers={boardMembers}
              onGetCardComments={getCardComments}
              onAddCardComment={addCardComment}
              onGetCardLabels={getCardLabels}
              onAddCardLabel={addCardLabel}
              onRemoveCardLabel={removeCardLabel}
              onGetCardAssignees={getCardAssignees}
              onAddCardAssignee={addCardAssignee}
              onRemoveCardAssignee={removeCardAssignee}
              onAddBoardLabel={addBoardLabel}
              cardToOpen={cardToOpen}
              isActivitySidebarCollapsed={isActivitySidebarCollapsed}
            />
          </div>
          
          <ActivitySidebar 
            isCollapsed={isActivitySidebarCollapsed} 
            onToggleCollapse={toggleActivitySidebar}
            activities={activities}
          />
        </div>


        {isBoardNavigating && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-b-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-[var(--color-text-secondary)]">Loading board...</p>
            </div>
          </div>
        )}
      </div>

      <BoardMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        boardId={id}
        currentUser={user}
        onMemberUpdate={refreshFilterData}
      />

      <MemberDetailsModal
        isOpen={isMemberDetailsModalOpen}
        onClose={handleCloseMemberDetails}
        member={selectedMemberDetails}
      />
    </div>
  )
}
