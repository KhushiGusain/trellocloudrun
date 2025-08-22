'use client'

import { AvatarWithPresence, PresenceIndicator } from '@/components/ui'
import { usePresence } from '@/contexts/PresenceContext'

export default function MemberDetailsModal({ isOpen, onClose, member }) {
  const { isUserOnline, getLastSeen } = usePresence()

  if (!isOpen || !member) return null

  const online = isUserOnline(member.id)
  const lastSeen = getLastSeen(member.id)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4 shadow-2xl border border-gray-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Member Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Member Avatar with Presence */}
          <AvatarWithPresence userId={member.id} presenceSize="lg">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {member.display_name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </AvatarWithPresence>

          {/* Member Info */}
          <div className="space-y-2">
            <h4 className="text-lg font-medium text-gray-900">
              {member.display_name || 'User'}
            </h4>
            <p className="text-sm text-gray-600">
              {member.email}
            </p>
            
            {/* Role Badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {member.role === 'owner' ? 'Owner' : 'Member'}
            </span>
          </div>

          {/* Status Info */}
          <div className="w-full pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <PresenceIndicator userId={member.id} size="md" showTooltip={false} />
              <span className="text-sm text-gray-600">
                {online ? (
                  <span className="text-green-600 font-medium">Online</span>
                ) : (
                  <span className="text-gray-500">
                    Last seen {lastSeen || 'unknown'}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          {member.role === 'owner' && (
            <div className="w-full text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="text-blue-600">Workspace Owner</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
