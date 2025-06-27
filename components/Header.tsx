'use client'

import { useState, useEffect } from 'react'
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  SparklesIcon,
  HeartIcon,
  SunIcon
} from '@heroicons/react/24/outline'

interface HeaderProps {
  user?: {
    email: string
  }
  onLogout?: () => void
  onSidebarToggle?: () => void
  isSidebarOpen?: boolean
}

export default function Header({ user, onLogout, onSidebarToggle, isSidebarOpen }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showUserMenu])

  return (
    <header className="glass sticky top-0 z-50 px-3 lg:px-4 py-1.5 lg:py-3 mx-2 lg:mx-4 mt-1 lg:mt-4 mb-2 lg:mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left side - Logo & Sidebar Toggle */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 lg:p-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 hover:scale-105 shadow-lg touch-target"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="relative">
              <SparklesIcon className="h-6 w-6 lg:h-8 lg:w-8 text-primary-600 animate-glow" />
              <HeartIcon className="h-3 w-3 lg:h-4 lg:w-4 text-pink-500 absolute -top-1 -right-1 animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Kagita Notes
              </h1>
              <p className="text-xs text-gray-600 font-medium hidden sm:block">Where Ideas Come to Life ✨</p>
            </div>
          </div>
        </div>

        {/* Right side - User Menu */}
        {user && (
          <div className="relative user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 lg:space-x-3 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-300 hover:scale-105 shadow-md touch-target"
              aria-label="User menu"
            >
              <div className="flex items-center space-x-1 lg:space-x-2">
                <SunIcon className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500 animate-float" />
                <span className="text-xs lg:text-sm font-medium text-gray-700 hidden sm:inline">
                  Hi, {user.email.split('@')[0]}! 👋
                </span>
              </div>
              <UserCircleIcon className="h-7 w-7 lg:h-8 lg:w-8 text-primary-600" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 lg:w-48 glass rounded-xl shadow-xl z-50 animate-scale-in user-dropdown">
                <div className="p-2">
                  <div className="px-3 py-3 text-sm text-gray-700 border-b border-white/20">
                    <div className="font-medium">{user.email.split('@')[0]}</div>
                    <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout?.()
                      setShowUserMenu(false)
                    }}
                    className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 mt-1 touch-target flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
