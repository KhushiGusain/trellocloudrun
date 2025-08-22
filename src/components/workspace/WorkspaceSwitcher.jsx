'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, Input, Button } from '@/components/ui'

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace, deleteWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null)

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setIsCreating(true)
    try {
      await createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName('')
      setIsCreateModalOpen(false)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to create workspace:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleWorkspaceSelect = (workspace) => {
    console.log('WorkspaceSwitcher: Switching to workspace:', workspace.name, workspace.id)
    switchWorkspace(workspace)
    setIsDropdownOpen(false)
  }

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone and will delete all boards and data in this workspace.')) {
      return
    }

    try {
      await deleteWorkspace(workspaceId)
      setWorkspaceToDelete(null)
      setIsDropdownOpen(false)
    } catch (error) {
      alert('Failed to delete workspace: ' + error.message)
    }
  }

  return (
    <>
      <div className="relative">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
              </span>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {currentWorkspace?.name || 'My Workspace'}
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-[var(--color-border)] z-50">
            <div className="py-2">
              {workspaces.map((workspace) => {
                const isOwner = workspace.created_by === user?.id
                const canDelete = isOwner && workspaces.length > 1 // need at least one workspace
                
                console.log('Workspace:', workspace.name, 'created_by:', workspace.created_by, 'user.id:', user?.id, 'isOwner:', isOwner)
                return (
                  <div
                    key={workspace.id}
                    className={`flex items-center justify-between hover:bg-gray-50 ${
                      currentWorkspace?.id === workspace.id ? 'bg-blue-50 text-blue-600' : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    <button
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className="flex-1 flex items-center space-x-2 px-3 py-2 text-left cursor-pointer"
                    >
                      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {workspace.name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">{workspace.name}</span>
                      {!isOwner && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          Member
                        </span>
                      )}
                    </button>
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteWorkspace(workspace.id)
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mr-2"
                        title="Delete workspace"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
              
              <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true)
                    setIsDropdownOpen(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 text-[var(--color-text-primary)] cursor-pointer"
                >
                  <div className="w-5 h-5 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs font-bold">+</span>
                  </div>
                  <span className="text-sm">Create workspace</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create new workspace"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
              Workspace name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Company, Marketing, Personal..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsCreateModalOpen(false)} 
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create workspace'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
