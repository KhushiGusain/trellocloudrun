'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Input, Modal, AvatarWithPresence } from '@/components/ui'
import Sidebar from '@/components/layout/Sidebar'

export default function MembersPage() {
  const { user, loading } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [isAdding, setIsAdding] = useState(false)

  // see if current user owns the workspace
  const isWorkspaceOwner = currentWorkspace?.created_by === user?.id
  
  console.log('Members page - Workspace:', currentWorkspace?.name, 'created_by:', currentWorkspace?.created_by, 'user.id:', user?.id, 'isWorkspaceOwner:', isWorkspaceOwner)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const fetchMembers = async () => {
    if (!currentWorkspace) return
    
    try {
      setError(null)
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setMembers(data || [])
    } catch (error) {
      setError(error.message)
      console.error('Error fetching members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentWorkspace) {
      setIsLoading(true)
      fetchMembers()
    }
  }, [currentWorkspace])

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !currentWorkspace) return

    setIsAdding(true)
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const newMember = await response.json()
      setMembers(prev => [...prev, newMember])
      setNewMemberEmail('')
      setNewMemberRole('member')
      setIsAddModalOpen(false)
    } catch (error) {
      alert(error.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      setMembers(prev => prev.filter(member => member.id !== memberId))
    } catch (error) {
      alert(error.message)
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const updatedMember = await response.json()
      setMembers(prev => prev.map(member => 
        member.id === memberId ? updatedMember : member
      ))
    } catch (error) {
      alert(error.message)
    }
  }

  if (loading || isLoading) {
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
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">

            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Workspace Members
                  </h1>
                  {!isWorkspaceOwner && (
                    <div className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium">View Only</span>
                    </div>
                  )}
                </div>
                {currentWorkspace && (
                  <p className="text-[var(--color-text-secondary)]">
                    {isWorkspaceOwner ? 'Manage' : 'View'} members in <span className="font-medium">{currentWorkspace.name}</span> workspace
                    {!isWorkspaceOwner && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Member
                      </span>
                    )}
                  </p>
                )}
              </div>
              {isWorkspaceOwner && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Add Member
                </Button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
                {error.includes('database setup') && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800 text-sm">
                      <strong>Setup Required:</strong> Please run the SQL migration from{' '}
                      <code className="bg-blue-100 px-1 rounded">src/lib/sql-migrations.md</code>{' '}
                      in your Supabase SQL editor to enable the members feature.
                    </p>
                  </div>
                )}
              </div>
            )}


            <div className={`rounded-lg shadow-sm border border-gray-200 ${
              !isWorkspaceOwner ? 'bg-gray-50' : 'bg-white'
            }`}>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Members ({members.length})
                  </h2>
                  {!isWorkspaceOwner && (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm">View Only</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {members.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                      No members yet
                    </h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      {isWorkspaceOwner 
                        ? 'Add team members to collaborate on boards in this workspace.'
                        : 'No other members in this workspace yet.'
                      }
                    </p>
                    {isWorkspaceOwner && (
                      <Button onClick={() => setIsAddModalOpen(true)}>
                        Add First Member
                      </Button>
                    )}
                  </div>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className={`px-6 py-4 flex items-center justify-between ${
                      !isWorkspaceOwner ? 'bg-white' : ''
                    }`}>
                      <div className="flex items-center space-x-3">
                        <AvatarWithPresence userId={member.user?.id} presenceSize="md">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {member.user?.display_name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </AvatarWithPresence>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {member.user?.display_name || 'User'}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {member.user?.email}
                          </p>
                        </div>
                        {!isWorkspaceOwner && (
                          <div className="flex items-center space-x-1 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {isWorkspaceOwner ? (
                          <>
                            {member.role === 'owner' ? (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                                Owner
                              </span>
                            ) : (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                            
                            {member.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove member"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-200">
                              {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>


      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
              Email Address *
            </label>
            <Input
              type="email"
              placeholder="Enter member's email..."
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
              Role
            </label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!newMemberEmail.trim() || isAdding}
            >
              {isAdding ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
