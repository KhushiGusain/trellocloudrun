'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'

export default function Sidebar({ boards = [], currentBoardId, onRefreshBoards, isLoadingBoards = false, onBoardNavigating }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const isBoards = pathname === '/boards'
  const isMembers = pathname === '/members'
  const isCurrentBoard = (boardId) => currentBoardId === boardId

  const handleBoardClick = (boardId) => {
    if (onBoardNavigating) {
      onBoardNavigating(true)
    }
    router.push(`/boards/${boardId}`)
  }

  const handleBoardsClick = () => {
    router.push('/boards')
  }

  const handleMembersClick = () => {
    router.push('/members')
  }

  const handleProfileClick = () => {
    console.log('Profile page not implemented yet')
  }

  const handleSignOut = () => {
    signOut()
    setIsProfileMenuOpen(false)
  }

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('.profile-menu')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileMenuOpen])

  return (
    <div className="w-64 h-full bg-[var(--color-sidebar-background)] flex flex-col rounded-r-2xl shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Mini-Trello
        </h1>
      </div>

      <div className="px-4 pb-4">
        <WorkspaceSwitcher />
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                Boards
              </h3>
              <button 
                onClick={onRefreshBoards}
                disabled={isLoadingBoards}
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Refresh boards"
              >
                {isLoadingBoards ? (
                  <div className="w-3 h-3 border border-[var(--color-text-secondary)] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
            
            <button
              onClick={handleBoardsClick}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                isBoards 
                  ? 'bg-[var(--color-hover)] text-[var(--color-sidebar-active)] font-medium' 
                  : 'text-[var(--color-sidebar-inactive)] hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-sm">All Boards</span>
            </button>


            <div className="ml-2 mt-2 space-y-1">
              {isLoadingBoards ? (

                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`loading-${index}`} className="w-full flex items-center space-x-3 px-3 py-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-sm flex-shrink-0 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                  </div>
                ))
              ) : (
                <>
                  {boards.slice(0, 8).map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleBoardClick(board.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isCurrentBoard(board.id)
                          ? 'bg-[var(--color-hover)] text-[var(--color-sidebar-active)] font-medium'
                          : 'text-[var(--color-sidebar-inactive)] hover:bg-gray-50'
                      }`}
                      title={board.title}
                    >
                      <div className="w-3 h-3 bg-blue-500 rounded-sm flex-shrink-0"></div>
                      <span className="text-sm truncate">{board.title}</span>
                    </button>
                  ))}
                  
                  {boards.length > 8 && (
                    <button
                      onClick={handleBoardsClick}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-[var(--color-text-secondary)] hover:bg-gray-50"
                    >
                      <span className="text-sm">+ {boards.length - 8} more boards</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>


          <button
            onClick={handleMembersClick}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
              isMembers
                ? 'bg-[var(--color-hover)] text-[var(--color-sidebar-active)] font-medium'
                : 'text-[var(--color-sidebar-inactive)] hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-sm">Members</span>
          </button>
        </nav>
      </div>


      <div className="p-4 mt-auto">
        <div className="relative profile-menu">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-[var(--color-sidebar-inactive)] hover:bg-gray-50"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {(user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user?.user_metadata?.name || 'User'}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                {user?.email}
              </div>
            </div>
            <svg 
              className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>


          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-2">
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-50 transition-colors cursor-pointer flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile & Settings</span>
              </button>
              <div className="border-t border-[var(--color-border)] my-1"></div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
