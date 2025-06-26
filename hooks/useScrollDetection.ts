'use client'

import { useState, useEffect, useRef } from 'react'

interface UseScrollDetectionProps {
  threshold?: number
}

export function useScrollDetection({ threshold = 100 }: UseScrollDetectionProps = {}) {
  const [isScrolledPastThreshold, setIsScrolledPastThreshold] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [lastScrollY, setLastScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      // Get the scrollable content container, not the main container
      const scrollableContent = document.querySelector('.scrollable-editor-content') as HTMLElement
      const container = scrollableContent || containerRef.current
      
      if (!container) return

      const scrollY = container.scrollTop
      const direction = scrollY > lastScrollY ? 'down' : 'up'
      
      setScrollDirection(direction)
      setLastScrollY(scrollY)
      setIsScrolledPastThreshold(scrollY > threshold)
    }

    // Try multiple scroll containers
    const scrollableContent = document.querySelector('.scrollable-editor-content')
    const container = scrollableContent || containerRef.current || window
    
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [threshold, lastScrollY])

  return {
    isScrolledPastThreshold,
    scrollDirection,
    containerRef
  }
}

export function useHeaderVisibility() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Since we're using fixed positioning, header should always be visible
    // But we'll keep intersection observer as backup for edge cases
    let observer: IntersectionObserver | null = null
    
    // Fallback check for browsers that don't support fixed positioning properly
    const checkHeaderVisibility = () => {
      const header = headerRef.current
      if (!header) return

      const rect = header.getBoundingClientRect()
      const isVisible = rect.top >= 0 && rect.top <= 100 // Header should be at top
      setIsHeaderVisible(isVisible)
    }

    // Primary: Use intersection observer when available
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          setIsHeaderVisible(entry.isIntersecting && entry.intersectionRatio > 0.5)
        },
        {
          threshold: [0, 0.5, 1],
          rootMargin: '0px 0px 0px 0px'
        }
      )

      const header = headerRef.current
      if (header) {
        observer.observe(header)
      }
    }

    // Fallback: Check on scroll for browsers with issues
    const checkOnScroll = () => {
      checkHeaderVisibility()
    }

    window.addEventListener('scroll', checkOnScroll, { passive: true })
    window.addEventListener('resize', checkHeaderVisibility, { passive: true })

    // Initial check
    checkHeaderVisibility()

    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('scroll', checkOnScroll)
      window.removeEventListener('resize', checkHeaderVisibility)
    }
  }, [])

  return {
    isHeaderVisible,
    headerRef
  }
}
