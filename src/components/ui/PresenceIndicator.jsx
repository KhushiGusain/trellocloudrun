'use client'

import { usePresence } from '@/contexts/PresenceContext'

export function PresenceIndicator({ userId, size = 'sm', showTooltip = true }) {
  const { isUserOnline, getLastSeen } = usePresence()
  const online = isUserOnline(userId)
  const lastSeen = getLastSeen(userId)

  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const indicator = (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-white ${
        online ? 'bg-green-500' : 'bg-gray-400'
      } shadow-sm`}
      title={showTooltip ? (online ? 'Online' : `Last seen ${lastSeen || 'unknown'}`) : undefined}
    />
  )

  if (showTooltip) {
    return (
      <div className="relative group">
        {indicator}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {online ? 'Online' : `Last seen ${lastSeen || 'unknown'}`}
        </div>
      </div>
    )
  }

  return indicator
}

export function AvatarWithPresence({ 
  children, 
  userId, 
  presenceSize = 'sm', 
  className = '',
  showTooltip = true 
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute -bottom-0.5 -right-0.5">
        <PresenceIndicator 
          userId={userId} 
          size={presenceSize} 
          showTooltip={showTooltip}
        />
      </div>
    </div>
  )
}
