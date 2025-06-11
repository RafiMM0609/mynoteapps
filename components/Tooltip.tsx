'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  disabled?: boolean
}

export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  disabled = false 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      
      // Check if tooltip goes off screen and adjust position
      let newPosition = position
      
      if (position === 'top' && rect.top - tooltipRect.height < 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && rect.bottom + tooltipRect.height > window.innerHeight - 10) {
        newPosition = 'top'
      } else if (position === 'left' && rect.left - tooltipRect.width < 10) {
        newPosition = 'right'  
      } else if (position === 'right' && rect.right + tooltipRect.width > window.innerWidth - 10) {
        newPosition = 'left'
      }
      
      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  if (disabled) {
    return <>{children}</>
  }

  const getPositionClasses = () => {
    const base = 'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none whitespace-nowrap'
    
    switch (actualPosition) {
      case 'top':
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'bottom':
        return `${base} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left':
        return `${base} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right':
        return `${base} left-full top-1/2 transform -translate-y-1/2 ml-2`
      default:
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
    }
  }

  const getArrowClasses = () => {
    const base = 'absolute w-0 h-0 border-solid border-gray-900'
    
    switch (actualPosition) {
      case 'top':
        return `${base} border-t-4 border-x-4 border-t-gray-900 border-x-transparent top-full left-1/2 transform -translate-x-1/2`
      case 'bottom':
        return `${base} border-b-4 border-x-4 border-b-gray-900 border-x-transparent bottom-full left-1/2 transform -translate-x-1/2`
      case 'left':
        return `${base} border-l-4 border-y-4 border-l-gray-900 border-y-transparent right-full top-1/2 transform -translate-y-1/2`
      case 'right':
        return `${base} border-r-4 border-y-4 border-r-gray-900 border-y-transparent left-full top-1/2 transform -translate-y-1/2`
      default:
        return `${base} border-t-4 border-x-4 border-t-gray-900 border-x-transparent top-full left-1/2 transform -translate-x-1/2`
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={getPositionClasses()}
          role="tooltip"
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  )
}
