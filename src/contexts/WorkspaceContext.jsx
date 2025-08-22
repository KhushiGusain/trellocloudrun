'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext({})

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)

  const createWorkspace = async (name) => {
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      
      if (response.ok) {
        const newWorkspace = await response.json()
        setWorkspaces(prev => [...prev, newWorkspace])
        return newWorkspace
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw error
    }
  }

  const fetchWorkspaces = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
        

        if (data.length === 0) {
          console.log('No workspaces found, creating Personal workspace...')
          try {
            const newWorkspace = await createWorkspace('Personal')
            setWorkspaces([newWorkspace])
            setCurrentWorkspace(newWorkspace)
          } catch (error) {
            console.error('Error creating default workspace:', error)

          }
        } else {

          if (!currentWorkspace) {
            setCurrentWorkspace(data[0])
          }
        }
      } else {
        console.error('Failed to fetch workspaces:', response.status)
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchWorkspace = (workspace) => {
    console.log('WorkspaceContext: Switching workspace from', currentWorkspace?.name, 'to', workspace?.name)
    setCurrentWorkspace(workspace)
  }

  const deleteWorkspace = async (workspaceId) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {

        setWorkspaces(prev => prev.filter(w => w.id !== workspaceId))
        

        if (currentWorkspace?.id === workspaceId) {
          const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId)
          if (remainingWorkspaces.length > 0) {
            setCurrentWorkspace(remainingWorkspaces[0])
          } else {

            try {
              const newWorkspace = await createWorkspace('Personal')
              setCurrentWorkspace(newWorkspace)
            } catch (error) {
              console.error('Error creating replacement workspace:', error)
            }
          }
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete workspace')
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
      throw error
    }
  }

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    } else {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setLoading(false)
    }
  }, [user])

  const value = {
    workspaces,
    currentWorkspace,
    loading,
    createWorkspace,
    switchWorkspace,
    deleteWorkspace,
    refreshWorkspaces: fetchWorkspaces
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
