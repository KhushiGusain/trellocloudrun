'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'

const PresenceContext = createContext({})

export const usePresence = () => {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider')
  }
  return context
}

export function PresenceProvider({ children }) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [userPresence, setUserPresence] = useState({})

  useEffect(() => {
    if (!user) return


    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })


    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = new Set()
        const presence = {}
        
        Object.keys(state).forEach(userId => {
          const userState = state[userId][0]
          users.add(userId)
          presence[userId] = {
            ...userState,
            lastSeen: new Date().toISOString()
          }
        })
        
        setOnlineUsers(users)
        setUserPresence(presence)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => new Set([...prev, key]))
        setUserPresence(prev => ({
          ...prev,
          [key]: {
            ...newPresences[0],
            lastSeen: new Date().toISOString()
          }
        }))
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
        setUserPresence(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            lastSeen: new Date().toISOString(),
            isOnline: false
          }
        }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {

          await channel.track({
            userId: user.id,
            email: user.email,
            displayName: user.user_metadata?.name || 'User',
            isOnline: true,
            joinedAt: new Date().toISOString()
          })
        }
      })


    return () => {
      channel.unsubscribe()
    }
  }, [user])


  const updateActivity = () => {
    if (user && onlineUsers.has(user.id)) {
      setUserPresence(prev => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          lastActivity: new Date().toISOString()
        }
      }))
    }
  }


  useEffect(() => {
    const handleActivity = () => updateActivity()
    

    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)
    
    return () => {
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [user])

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId)
  }

  const getUserPresence = (userId) => {
    return userPresence[userId] || null
  }

  const getLastSeen = (userId) => {
    const presence = userPresence[userId]
    if (!presence?.lastSeen) return null
    
    const lastSeen = new Date(presence.lastSeen)
    const now = new Date()
    const diffMs = now - lastSeen
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const value = {
    onlineUsers,
    userPresence,
    isUserOnline,
    getUserPresence,
    getLastSeen,
    updateActivity
  }

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  )
}
