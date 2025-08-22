'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import {
  BoardSearch,
  BoardsHeader,
  BoardsGrid,
  EmptyState,
  CreateBoardModal,
  DeleteBoardModal,
  NoResultsMessage
} from '@/components/boards'
import { useBoards } from '@/hooks/useBoards'
import Sidebar from '@/components/layout/Sidebar'

export default function BoardsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const {
    boards,
    isLoading: boardsLoading,
    error,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    boardToDelete,
    setBoardToDelete,
    newBoardData,
    setNewBoardData,
    isCreating,
    isDeleting,
    handleCreateBoard,
    handleDeleteBoard,
    confirmDeleteBoard,
    fetchBoards
  } = useBoards()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBoardClick = (boardId) => {
    router.push(`/boards/${boardId}`)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
  }

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false)
  }

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false)
    setBoardToDelete(null)
  }

  if (loading || boardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-app-background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
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

  return (
    <div className="min-h-screen h-screen bg-[var(--color-app-background)] flex">
      <Sidebar 
        boards={boards} 
        onRefreshBoards={fetchBoards}
        isLoadingBoards={boardsLoading}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <BoardsHeader />
            <BoardSearch searchQuery={searchQuery} onSearchChange={handleSearchChange} />
            
            <div className="relative">
              {filteredBoards.length === 0 && searchQuery && (
                <NoResultsMessage searchQuery={searchQuery} />
              )}
              
              {filteredBoards.length === 0 && !searchQuery && !boardsLoading && (
                <EmptyState onCreateBoard={() => setIsCreateModalOpen(true)} />
              )}
              
              {filteredBoards.length > 0 && (
                <BoardsGrid
                  boards={filteredBoards}
                  onBoardClick={handleBoardClick}
                  onDeleteBoard={handleDeleteBoard}
                  onCreateBoard={() => setIsCreateModalOpen(true)}
                />
              )}
            </div>
          </div>
        </main>
      </div>


      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        boardData={newBoardData}
        onBoardDataChange={setNewBoardData}
        onCreateBoard={handleCreateBoard}
        isCreating={isCreating}
      />

      <DeleteBoardModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        boardToDelete={boardToDelete}
        onConfirmDelete={confirmDeleteBoard}
        isDeleting={isDeleting}
      />
    </div>
  )
}
