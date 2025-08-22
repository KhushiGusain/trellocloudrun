'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export function useBoards() {
  const { currentWorkspace } = useWorkspace()
  const [boards, setBoards] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState(null)
  const [newBoardData, setNewBoardData] = useState({
    title: '',
    visibility: 'workspace',
    backgroundColor: '#3a72ee'
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBoards = async (workspaceId) => {
    try {
      setError(null)
      const url = workspaceId ? `/api/boards?workspace_id=${workspaceId}` : '/api/boards'
      console.log('fetchBoards: Fetching from URL:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('fetchBoards: Received boards:', data?.length || 0, 'boards')
      setBoards(data || [])
    } catch (error) {
      console.error('fetchBoards: Error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentWorkspace) {
      console.log('useBoards: Workspace changed to:', currentWorkspace.name, currentWorkspace.id)
      setIsLoading(true)
      setBoards([])
      setError(null)
      fetchBoards(currentWorkspace.id)
    }
  }, [currentWorkspace])

  const handleCreateBoard = async () => {
    if (!newBoardData.title.trim() || !currentWorkspace) return

    setIsCreating(true)
    setError(null)
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newBoardData.title,
          visibility: newBoardData.visibility,
          backgroundColor: newBoardData.backgroundColor,
          workspace_id: currentWorkspace.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setBoards(prev => [data, ...prev])
      setNewBoardData({ title: '', visibility: 'workspace', backgroundColor: '#3a72ee' })
      setIsCreateModalOpen(false)
    } catch (error) {
      setError(error.message)
      alert(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBoard = (board) => {
    setBoardToDelete(board)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteBoard = async () => {
    if (!boardToDelete) return

    setIsDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/boards/${boardToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      setBoards(prev => prev.filter(board => board.id !== boardToDelete.id))
      setBoardToDelete(null)
      setIsDeleteModalOpen(false)
    } catch (error) {
      setError(error.message)
      alert(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const resetBoardData = () => {
    setNewBoardData({ title: '', visibility: 'workspace', backgroundColor: '#3a72ee' })
  }

  return {
    boards,
    setBoards,
    isLoading,
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
    resetBoardData,
    fetchBoards: () => fetchBoards(currentWorkspace?.id)
  }
}
