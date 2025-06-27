'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import DOMPurify from 'dompurify'
import markdownProcessor from '../lib/async-markdown'

interface VirtualizedDocumentProps {
  content: string;
  className?: string;
  onRenderComplete?: () => void;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
}

/**
 * A virtualized document component that efficiently renders large markdown documents
 * using windowing techniques to maintain smooth scrolling and rendering
 */
export default function VirtualizedDocument({
  content,
  className = '',
  onRenderComplete,
  readOnly = true,
  onContentChange,
}: VirtualizedDocumentProps) {
  const [processedContent, setProcessedContent] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(true)
  const [height, setHeight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<List>(null)
  
  // Estimate line height for virtual list
  const lineHeight = 24 // Base estimate, will adjust with content
  
  // Split content into chunks for virtualization
  const chunkSize = 10 // Number of lines per chunk
  
  // Process content in chunks to avoid blocking the main thread
  useEffect(() => {
    if (!content) {
      setProcessedContent([])
      setIsRendering(false)
      if (onRenderComplete) onRenderComplete()
      return
    }
    
    setIsRendering(true)
    
    // Break content into lines and then chunks
    const lines = content.split('\n')
    const chunks: string[] = []
    
    // Pre-process chunks
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize).join('\n')
      chunks.push(chunk)
    }
    
    let processedChunks: string[] = []
    let currentIndex = 0
    
    // Process chunks progressively
    const processNextChunk = async () => {
      if (currentIndex >= chunks.length) {
        setProcessedContent(processedChunks)
        setIsRendering(false)
        if (onRenderComplete) onRenderComplete()
        return
      }
      
      try {
        // Process next chunk
        const html = await markdownProcessor.parse(chunks[currentIndex])
        processedChunks.push(html)
        
        // Update state every few chunks to show progress
        if (currentIndex % 5 === 0 || currentIndex === chunks.length - 1) {
          setProcessedContent([...processedChunks])
        }
        
        currentIndex++
        
        // Continue processing with a small delay to allow UI updates
        setTimeout(processNextChunk, 0)
      } catch (error) {
        console.error('Error processing content chunk:', error)
        processedChunks.push(`<div class="text-red-500">Error rendering content</div>`)
        currentIndex++
        setTimeout(processNextChunk, 0)
      }
    }
    
    // Start processing
    processNextChunk()
    
    // Cleanup
    return () => {
      currentIndex = chunks.length // Stop processing
    }
  }, [content, onRenderComplete])
  
  // Update height when window resizes
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setHeight(containerRef.current.clientHeight)
      }
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    
    return () => window.removeEventListener('resize', updateHeight)
  }, [])
  
  // Row renderer for virtualized list
  const Row = useMemo(() => ({ index, style }: { index: number, style: React.CSSProperties }) => {
    return (
      <div style={style} className="py-1">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: processedContent[index] || '' }}
        />
      </div>
    )
  }, [processedContent])
  
  return (
    <div 
      ref={containerRef} 
      className={`virtualized-document-container ${className}`}
      style={{ height: '100%', minHeight: '300px' }}
    >
      {isRendering && processedContent.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Rendering document...</div>
        </div>
      )}
      
      {height > 0 && processedContent.length > 0 && (
        <List
          ref={listRef}
          height={height}
          width="100%"
          itemCount={processedContent.length}
          itemSize={lineHeight * chunkSize} // Estimate height per chunk
          overscanCount={2} // Render extra items for smoother scrolling
        >
          {Row}
        </List>
      )}
    </div>
  )
}
