'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FloatingActionButtonsProps {
  onSave: () => void
  onCancel: () => void
  hasChanges: boolean
  isSaving?: boolean
  saveSuccess?: boolean
  disabled?: boolean
}

export default function FloatingActionButtons({
  onSave,
  onCancel,
  hasChanges,
  isSaving = false,
  saveSuccess = false,
  disabled = false
}: FloatingActionButtonsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showCancelButton, setShowCancelButton] = useState(false)
  
  // Handle scroll-based visibility for better mobile UX
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY + 10) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY - 10) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }
    
    // Show buttons again after scrolling stops
    const handleScrollEnd = () => {
      let timer: NodeJS.Timeout | null = null
      
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scrollend', handleScrollEnd, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scrollend', handleScrollEnd)
    }
  }, [lastScrollY])
  
  // Show the cancel button when there are changes
  useEffect(() => {
    if (hasChanges) {
      // Wait a moment before showing cancel button to avoid UI jumpiness
      const timer = setTimeout(() => {
        setShowCancelButton(true)
      }, 500)
      
      return () => clearTimeout(timer)
    } else {
      setShowCancelButton(false)
    }
  }, [hasChanges])
  
  // Only show FABs if there are changes or we're in a critical save state
  if (!hasChanges && !isSaving && !saveSuccess) {
    return null
  }

  // Check if we're on a mobile device
  const isMobile = typeof window !== 'undefined' && 
    (window.innerWidth <= 768 || 'ontouchstart' in window || 
     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

  return (
    <div className={`fab-save-container ${isVisible ? 'visible' : 'hidden'} ${isMobile ? 'mobile' : ''}`}>
      {/* Save FAB */}
      <button
        onClick={onSave}
        disabled={!hasChanges || isSaving || disabled}
        className={`fab-save ${isSaving ? 'btn-loading' : ''} ${isMobile ? 'touch-target' : ''}`}
        aria-label={isSaving ? 'Saving...' : 'Save note'}
      >
        <CheckIcon className="w-6 h-6" />
        <span className="fab-tooltip">
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
        </span>
        
        {hasChanges && !isSaving && (
          <div className={`fab-status-indicator ${saveSuccess ? 'saved' : ''}`}></div>
        )}
      </button>
      
      {/* Cancel FAB - Only shown when there are changes and on mobile */}
      {showCancelButton && isMobile && (
        <button
          onClick={onCancel}
          className={`fab-cancel touch-target`}
          aria-label="Cancel changes"
        >
          <XMarkIcon className="w-6 h-6" />
          <span className="fab-tooltip">Cancel</span>
        </button>
      )}
    </div>
  )
}
