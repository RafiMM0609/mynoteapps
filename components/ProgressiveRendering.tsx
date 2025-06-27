'use client'

import React, { useState, useEffect, useRef } from 'react'
import markdownProcessor from '../lib/async-markdown'

interface ProgressiveRenderingProps {
  content: string
  className?: string
  initialChunkSize?: number
  incrementSize?: number
  maxChunks?: number
  renderPlaceholder?: (remainingChunks: number) => React.ReactNode
}

/**
 * A component that progressively renders large content in chunks
 * to prevent UI freezing and provide a smooth user experience
 */
export default function ProgressiveRendering({
  content,
  className = '',
  initialChunkSize = 5000, // Initial characters to render
  incrementSize = 10000,   // Characters to add in each increment
  maxChunks = 10,          // Maximum chunks to render before forcing virtualization
  renderPlaceholder
}: ProgressiveRenderingProps) {
  const [renderedContent, setRenderedContent] = useState('')
  const [renderedChunks, setRenderedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isLargeDocument, setIsLargeDocument] = useState(false)
  const renderTimerRef = useRef<NodeJS.Timeout | null>(null)
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Initialize rendering and calculate chunks
  useEffect(() => {
    if (!content) {
      setRenderedContent('')
      setIsComplete(true)
      return
    }
    
    // Reset state for new content
    setRenderedContent('')
    setRenderedChunks(0)
    setIsComplete(false)
    
    // Calculate total chunks
    const contentLength = content.length
    const initialChunk = content.substring(0, initialChunkSize)
    const remainingLength = contentLength - initialChunkSize
    const remainingChunks = Math.ceil(remainingLength / incrementSize)
    
    setTotalChunks(remainingChunks + 1)
    setIsLargeDocument(remainingChunks > maxChunks)
    
    // Render initial chunk
    markdownProcessor.parse(initialChunk)
      .then(html => {
        setRenderedContent(html)
        setRenderedChunks(1)
        
        // If this is the entire content, mark as complete
        if (initialChunkSize >= contentLength) {
          setIsComplete(true)
        }
      })
      .catch(err => {
        console.error('Error rendering initial chunk:', err)
        setRenderedContent(`<div class="text-red-500">Error rendering content</div>`)
      })
    
    // Cleanup any pending renders
    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current)
      }
      
      if (intersectionObserverRef.current && loadMoreRef.current) {
        intersectionObserverRef.current.disconnect()
      }
    }
  }, [content, initialChunkSize, incrementSize, maxChunks])
  
  // Setup intersection observer for loading more content when scrolling
  useEffect(() => {
    if (loadMoreRef.current && !isComplete && !isLargeDocument) {
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry.isIntersecting) {
            loadNextChunk()
          }
        },
        { threshold: 0.1 }
      )
      
      intersectionObserverRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect()
      }
    }
  }, [renderedChunks, isComplete, isLargeDocument])
  
  // Load the next chunk of content
  const loadNextChunk = async () => {
    if (isComplete || renderedChunks >= totalChunks) {
      setIsComplete(true)
      return
    }
    
    // Prevent multiple simultaneous renders
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current)
    }
    
    renderTimerRef.current = setTimeout(async () => {
      try {
        const startPos = initialChunkSize + (renderedChunks - 1) * incrementSize
        const endPos = Math.min(startPos + incrementSize, content.length)
        const nextChunk = content.substring(startPos, endPos)
        
        // Process the next chunk
        const nextHtml = await markdownProcessor.parse(nextChunk)
        
        // Append to the already rendered content
        setRenderedContent(prev => `${prev}${nextHtml}`)
        
        // Update progress
        const newChunkCount = renderedChunks + 1
        setRenderedChunks(newChunkCount)
        
        // Check if rendering is complete
        if (newChunkCount >= totalChunks || endPos >= content.length) {
          setIsComplete(true)
        }
      } catch (err) {
        console.error('Error rendering chunk:', err)
      }
    }, 50) // Small delay to allow UI to breathe
  }
  
  // Handle manual loading of more content
  const handleLoadMore = () => {
    loadNextChunk()
  }
  
  // Calculate remaining chunks
  const remainingChunks = totalChunks - renderedChunks
  
  return (
    <div className={`progressive-rendering ${className}`}>
      {/* Rendered content */}
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
      
      {/* Load more indicator or custom placeholder */}
      {!isComplete && (
        <div ref={loadMoreRef} className="py-4">
          {renderPlaceholder ? (
            renderPlaceholder(remainingChunks)
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-sm text-gray-500">
                {isLargeDocument 
                  ? `Large document detected (${(content.length / 1000).toFixed(1)}KB)`
                  : `${Math.round((renderedChunks / totalChunks) * 100)}% rendered`
                }
              </div>
              
              {!isLargeDocument && (
                <div className="w-full max-w-md bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(renderedChunks / totalChunks) * 100}%` }}
                  />
                </div>
              )}
              
              <button
                onClick={handleLoadMore}
                className="px-4 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                {isLargeDocument 
                  ? 'Load more content' 
                  : `Load more (${remainingChunks} chunk${remainingChunks !== 1 ? 's' : ''} remaining)`
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
