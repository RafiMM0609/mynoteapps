'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface TouchPosition {
  x: number
  y: number
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  velocity: number
}

interface MobileOptimizationOptions {
  swipeThreshold?: number
  longPressThreshold?: number
  doubleTapThreshold?: number
  textSelectionTimeout?: number
  enableSwipeGestures?: boolean
  enableDoubleTap?: boolean
  enableLongPress?: boolean
  enableTextSelectionHelper?: boolean
}

export function useMobileOptimization({
  swipeThreshold = 50,
  longPressThreshold = 500,
  doubleTapThreshold = 300,
  textSelectionTimeout = 1000,
  enableSwipeGestures = true,
  enableDoubleTap = true,
  enableLongPress = true,
  enableTextSelectionHelper = true
}: MobileOptimizationOptions = {}) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [touchActive, setTouchActive] = useState(false)
  const [longPressActive, setLongPressActive] = useState(false)
  const [textSelectionActive, setTextSelectionActive] = useState(false)
  const [swipeGesture, setSwipeGesture] = useState<SwipeGesture>({
    direction: null,
    distance: 0,
    velocity: 0
  })
  
  const touchStartRef = useRef<TouchPosition | null>(null)
  const touchStartTimeRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const textSelectionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapTimeRef = useRef<number>(0)
  const touchMoveCountRef = useRef<number>(0)
  const containerRef = useRef<HTMLElement | null>(null)
  
  // Detect mobile/tablet device
  useEffect(() => {
    const checkDeviceType = () => {
      const isMobileCheck = window.innerWidth <= 768 || /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isTabletCheck = window.innerWidth <= 1024 && window.innerWidth > 768 || /iPad|Tablet/i.test(navigator.userAgent)
      
      setIsMobile(isMobileCheck)
      setIsTablet(isTabletCheck)
    }
    
    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
    
    return () => {
      window.removeEventListener('resize', checkDeviceType)
    }
  }, [])
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableSwipeGestures && !enableLongPress && !enableDoubleTap) return
    
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchStartTimeRef.current = Date.now()
    touchMoveCountRef.current = 0
    setTouchActive(true)
    
    // Handle long press
    if (enableLongPress) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      
      longPressTimerRef.current = setTimeout(() => {
        // Only trigger long press if there was minimal movement
        if (touchMoveCountRef.current < 5) {
          setLongPressActive(true)
        }
      }, longPressThreshold)
    }
    
    // Handle double tap
    if (enableDoubleTap) {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapTimeRef.current
      
      if (timeSinceLastTap < doubleTapThreshold) {
        // Double tap detected
        const doubleTapEvent = new CustomEvent('mobile-double-tap', {
          detail: { x: touch.clientX, y: touch.clientY }
        })
        document.dispatchEvent(doubleTapEvent)
      }
      
      lastTapTimeRef.current = now
    }
    
    // Text selection helper
    if (enableTextSelectionHelper) {
      if (textSelectionTimerRef.current) {
        clearTimeout(textSelectionTimerRef.current)
      }
      
      textSelectionTimerRef.current = setTimeout(() => {
        // Only show text selection helper if still touching after threshold
        // and minimal movement occurred
        if (touchActive && touchMoveCountRef.current < 8) {
          setTextSelectionActive(true)
        }
      }, textSelectionTimeout)
    }
  }, [enableSwipeGestures, enableLongPress, enableDoubleTap, enableTextSelectionHelper, longPressThreshold, doubleTapThreshold, textSelectionTimeout, touchActive])
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return
    
    touchMoveCountRef.current++
    
    // Process swipe gestures
    if (enableSwipeGestures && touchStartRef.current) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const timeDelta = Date.now() - touchStartTimeRef.current
      
      // If significant movement, cancel long press and text selection
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
        
        if (textSelectionTimerRef.current) {
          clearTimeout(textSelectionTimerRef.current)
          textSelectionTimerRef.current = null
        }
        
        setTextSelectionActive(false)
      }
      
      // Determine swipe direction and distance
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      if (absX > swipeThreshold || absY > swipeThreshold) {
        let direction: 'left' | 'right' | 'up' | 'down' | null = null
        let distance = 0
        
        if (absX > absY) {
          // Horizontal swipe
          direction = deltaX > 0 ? 'right' : 'left'
          distance = absX
        } else {
          // Vertical swipe
          direction = deltaY > 0 ? 'down' : 'up'
          distance = absY
        }
        
        const velocity = distance / (timeDelta || 1) // Avoid division by zero
        
        setSwipeGesture({
          direction,
          distance,
          velocity
        })
      }
    }
  }, [enableSwipeGestures, swipeThreshold])
  
  const handleTouchEnd = useCallback(() => {
    // Cleanup timers
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    
    if (textSelectionTimerRef.current) {
      clearTimeout(textSelectionTimerRef.current)
      textSelectionTimerRef.current = null
    }
    
    // Reset touch states with slight delay for swipe gesture handling
    setTimeout(() => {
      setTouchActive(false)
      setLongPressActive(false)
      
      // Keep text selection active for a bit longer to allow interaction
      if (textSelectionActive) {
        setTimeout(() => {
          setTextSelectionActive(false)
        }, 500)
      }
      
      // Reset swipe after it's been processed
      setTimeout(() => {
        setSwipeGesture({
          direction: null,
          distance: 0,
          velocity: 0
        })
      }, 100)
    }, 50)
  }, [textSelectionActive])
  
  // Attach event listeners to container
  const attachTouchHandlers = useCallback((element: HTMLElement | null) => {
    if (!element) return
    
    containerRef.current = element
    
    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove)
    element.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])
  
  // Custom text selection helpers
  const enhanceTextSelection = useCallback((element: HTMLElement | null) => {
    if (!element || !isMobile || !enableTextSelectionHelper) return
    
    const handleTextSelectionStart = () => {
      // Add custom selection UI helpers
      element.classList.add('mobile-text-selection-mode')
    }
    
    const handleTextSelectionEnd = () => {
      // Remove custom selection UI helpers
      element.classList.remove('mobile-text-selection-mode')
    }
    
    element.addEventListener('selectstart', handleTextSelectionStart)
    element.addEventListener('selectionchange', handleTextSelectionStart)
    element.addEventListener('select', handleTextSelectionEnd)
    
    return () => {
      element.removeEventListener('selectstart', handleTextSelectionStart)
      element.removeEventListener('selectionchange', handleTextSelectionStart)
      element.removeEventListener('select', handleTextSelectionEnd)
    }
  }, [isMobile, enableTextSelectionHelper])

  // Helper for optimizing floating elements
  const optimizeFloatingElements = useCallback((setVisible: (isVisible: boolean) => void) => {
    if (!isMobile) return

    let lastScrollY = window.scrollY
    let scrollTimer: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollingDown = currentScrollY > lastScrollY
      
      // Hide when scrolling down, show when scrolling up
      setVisible(!scrollingDown)
      
      lastScrollY = currentScrollY
      
      // Show again after scrolling stops
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        setVisible(true)
      }, 1000)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
    }
  }, [isMobile])

  return {
    isMobile,
    isTablet,
    touchActive,
    longPressActive,
    textSelectionActive,
    swipeGesture,
    attachTouchHandlers,
    enhanceTextSelection,
    optimizeFloatingElements,
    containerRef
  }
}
