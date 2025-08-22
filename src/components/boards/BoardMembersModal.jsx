'use client'

import { useState, useEffect } from 'react'
import { Button, AvatarWithPresence } from '@/components/ui'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export default function BoardMembersModal({ 
  isOpen, 
  onClose, 
  boardId, 
  currentUser,
  onMemberUpdate 
}) {
  const { currentWorkspace } = useWorkspace()
  const [members, setMembers] = useState([])
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
      fetchWorkspaceMembers()
    }
  }, [isOpen, boardId, currentWorkspace])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/members`)
      if (!response.ok) throw new Error('Failed to fetch members')
      const data = await response.json()
      setMembers(data)
    } catch (err) {
      console.error('Error fetching members:', err)
      setError('Failed to load members')
    }
  }

  const fetchWorkspaceMembers = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      if (!response.ok) throw new Error('Failed to fetch workspace members')
      const data = await response.json()
      setWorkspaceMembers(data)
    } catch (err) {
      console.error('Error fetching workspace members:', err)
      // workspace members are optional so don't error
    }
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite member')
      }

      setSuccess('Member invited successfully')
      setInviteEmail('')
      fetchMembers()
      if (onMemberUpdate) onMemberUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorkspaceMember = async (memberEmail) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member')
      }

      setSuccess('Member added successfully')
      fetchMembers()
      if (onMemberUpdate) onMemberUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this board?`)) {
      return
    }

    try {
      const response = await fetch(`/api/boards/${boardId}/members?member_id=${memberId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      setSuccess('Member removed successfully')
      fetchMembers()
      if (onMemberUpdate) onMemberUpdate()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Board Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !inviteEmail.trim()}
                className="w-full"
              >
                {loading ? 'Inviting...' : 'Invite Member'}
              </Button>
            </form>
          </div>


          {workspaceMembers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Workspace Members</h3>
              <div className="space-y-2">
                {workspaceMembers
                  .filter(wMember => !members.some(bMember => bMember.user?.email === wMember.user?.email))
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <AvatarWithPresence userId={member.user?.id} presenceSize="sm">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {member.user?.display_name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </AvatarWithPresence>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.user?.display_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">{member.user?.email}</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddWorkspaceMember(member.user?.email)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                {workspaceMembers.filter(wMember => !members.some(bMember => bMember.user?.email === wMember.user?.email)).length === 0 && (
                  <p className="text-gray-500 text-center py-3 text-sm">
                    All workspace members are already on this board
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Members</h3>
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No members found</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <AvatarWithPresence userId={member.id} presenceSize="md">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </AvatarWithPresence>
                      <div>
                        <p className="font-medium text-gray-900">{member.display_name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          {member.role === 'owner' ? 'Owner' : 'Editor'}
                        </p>
                      </div>
                    </div>
                    {member.id !== currentUser?.id && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.display_name)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
