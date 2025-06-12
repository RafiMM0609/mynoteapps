'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

interface SlashCommand {
  id: string
  label: string
  description: string
  icon: string
  action: () => void
}

interface SlashCommandDropdownProps {
  isVisible: boolean
  position: { x: number; y: number }
  onClose: () => void
  onSelectCommand: (command: string) => void
}

export default function SlashCommandDropdown({ 
  isVisible, 
  position, 
  onClose, 
  onSelectCommand 
}: SlashCommandDropdownProps) {  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const commands: SlashCommand[] = useMemo(() => [
    {
      id: 'h1',
      label: 'Heading 1',
      description: 'Big section heading',
      icon: '📝',
      action: () => onSelectCommand('h1')
    },
    {
      id: 'h2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: '📄',
      action: () => onSelectCommand('h2')
    },
    {
      id: 'h3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: '📋',
      action: () => onSelectCommand('h3')
    },
    {
      id: 'bold',
      label: 'Bold Text',
      description: 'Make text bold',
      icon: '🔤',
      action: () => onSelectCommand('bold')
    },
    {
      id: 'italic',
      label: 'Italic Text',
      description: 'Make text italic',
      icon: '✍️',
      action: () => onSelectCommand('italic')
    },
    {
      id: 'ul',
      label: 'Bullet List',
      description: 'Create a bullet list',
      icon: '📌',
      action: () => onSelectCommand('ul')
    },
    {
      id: 'ol',
      label: 'Numbered List',
      description: 'Create a numbered list',
      icon: '🔢',
      action: () => onSelectCommand('ol')
    },
    {
      id: 'code',
      label: 'Inline Code',
      description: 'Inline code snippet',
      icon: '💻',
      action: () => onSelectCommand('code')
    },
    {
      id: 'pre',
      label: 'Code Block',
      description: 'Multi-line code block',
      icon: '🖥️',
      action: () => onSelectCommand('pre')    }
  ], [onSelectCommand])
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % commands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length)
          break
        case 'Enter':
          e.preventDefault()
          commands[selectedIndex].action()
          onClose()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, selectedIndex, commands, onClose])

  // Auto-scroll to keep selected item visible
  useEffect(() => {
    if (!isVisible || !dropdownRef.current) return

    const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }, [selectedIndex, isVisible])

  // Reset selected index when dropdown opens
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(0)
    }
  }, [isVisible])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }  }, [isVisible, onClose])
  
  if (!isVisible) return null
  // Calculate the best position for the dropdown
  const calculatePosition = () => {
    const dropdownHeight = 360 // Approximate height of the dropdown
    const dropdownWidth = 320 // Match the actual width set in style
    
    let x = position.x
    let y = position.y
    
    // Debug logging
    console.log('Original position:', { x, y })
    console.log('Viewport dimensions:', { width: window.innerWidth, height: window.innerHeight })
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Adjust horizontal position if dropdown would go off screen
    if (x + dropdownWidth > viewportWidth) {
      x = Math.max(20, viewportWidth - dropdownWidth - 20)
    }
    if (x < 20) {
      x = 20
    }
    
    // Calculate available space above and below cursor position
    const spaceAbove = y - 20 // Space available above cursor
    const spaceBelow = viewportHeight - y - 50 // Space available below cursor
    
    console.log('Available space:', { spaceAbove, spaceBelow })
    
    // Position dropdown based on available space
    if (spaceAbove >= 200 && spaceAbove >= spaceBelow) {
      // Position above the cursor if there's enough space
      y = Math.max(20, y - dropdownHeight - 10)
    } else if (spaceBelow >= 200) {
      // Position below the cursor if there's enough space
      y = Math.min(y + 30, viewportHeight - dropdownHeight - 20)
    } else {
      // If neither position has enough space, choose the one with more space
      if (spaceAbove > spaceBelow) {
        y = Math.max(20, y - dropdownHeight - 10)
      } else {
        y = Math.min(y + 30, viewportHeight - dropdownHeight - 20)
      }
    }
    
    console.log('Final position:', { x, y })
    
    return { x, y }
  }

  const finalPosition = calculatePosition()

  return (    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-96 overflow-y-auto backdrop-blur-sm"
      style={{
        left: finalPosition.x,
        top: finalPosition.y,
        width: '320px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideIn 0.2s ease-out',
        border: '1px solid #e5e7eb'
      }}
    >
      <div className="p-4">        <div className="text-xs text-gray-500 mb-3 px-1 font-medium flex items-center">
          <span className="mr-2">⚡</span>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
            Quick Actions
          </span>
          <span className="ml-2 text-gray-400">↑↓ navigate • Enter select • Esc close</span>
        </div>        <div className="space-y-1">
          {commands.map((command, index) => (
            <div
              key={command.id}
              data-index={index}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-sm transform scale-[1.02]'
                  : 'hover:bg-gray-50 hover:shadow-sm border border-transparent'
              }`}
              onClick={() => {
                command.action()
                onClose()
              }}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-3 ${
                index === selectedIndex 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
              }`}>
                {command.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-0.5 truncate">{command.label}</div>
                <div className="text-xs text-gray-500 truncate">{command.description}</div>
              </div>
              {index === selectedIndex && (
                <div className="text-blue-500 text-sm font-medium ml-2">
                  ⏎
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
