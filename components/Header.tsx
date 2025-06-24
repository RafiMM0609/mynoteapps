'use client'

import { useState } from 'react'
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

  return (
    <header className="glass sticky top-0 z-50 px-4 py-3 mx-4 mt-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left side - Logo & Sidebar Toggle */}
        <div className="flex items-center space-x-4">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              {isSidebarOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <SparklesIcon className="h-8 w-8 text-primary-600 animate-glow" />
              <HeartIcon className="h-4 w-4 text-pink-500 absolute -top-1 -right-1 animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                Kagita Notes
              </h1>
              <p className="text-xs text-gray-600 font-medium">Where Ideas Come to Life ✨</p>
            </div>
          </div>
        </div>

        {/* Right side - User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-300 hover:scale-105 shadow-md"
            >
              <div className="flex items-center space-x-2">
                <SunIcon className="h-5 w-5 text-yellow-500 animate-float" />
                <span className="text-sm font-medium text-gray-700">
                  Hi, {user.email.split('@')[0]}! 👋
                </span>
              </div>
              <UserCircleIcon className="h-8 w-8 text-primary-600" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-xl z-50 animate-scale-in">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-gray-600 border-b border-white/20">
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      onLogout?.()
                      setShowUserMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 mt-1"
                  >
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
