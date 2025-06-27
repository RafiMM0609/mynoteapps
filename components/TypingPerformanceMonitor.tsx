'use client'

import { useState, useEffect } from 'react'
import { useTypingPerformance } from '../hooks/useTypingPerformance'

interface TypingPerformanceMonitorProps {
  onLagDetected?: (isLagging: boolean) => void
  showDebugInfo?: boolean
}

/**
 * Component to monitor typing performance and display performance status
 * This component will automatically detect input lag and trigger optimizations
 */
export default function TypingPerformanceMonitor({
  onLagDetected,
  showDebugInfo = false
}: TypingPerformanceMonitorProps) {
  const [visible, setVisible] = useState(false)
  
  const {
    isLagging,
    avgLatency,
    optimizationsApplied,
    forceOptimizations
  } = useTypingPerformance({
    threshold: 120, // Detect lag at 120ms
    sampleSize: 15, // Use 15 samples for more accurate measurement
  })
  
  // Notify parent component when lag is detected
  useEffect(() => {
    if (onLagDetected) {
      onLagDetected(isLagging)
    }
  }, [isLagging, onLagDetected])
  
  // Only show monitor when debug is enabled or performance issues detected
  useEffect(() => {
    setVisible(showDebugInfo || isLagging)
  }, [showDebugInfo, isLagging])
  
  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs p-3 bg-gray-800/90 text-white text-xs rounded-lg shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Editor Performance</h3>
        {showDebugInfo && (
          <button 
            onClick={() => setVisible(false)}
            className="p-1 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span>Input latency:</span>
          <span className={`${isLagging ? 'text-red-400' : 'text-green-400'}`}>
            {avgLatency}ms
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <span className={`flex items-center ${isLagging ? 'text-red-400' : 'text-green-400'}`}>
            <span className={`inline-block w-2 h-2 mr-1.5 rounded-full ${isLagging ? 'bg-red-500' : 'bg-green-500'}`} />
            {isLagging ? 'Lagging' : 'Normal'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Optimizations:</span>
          <span className={optimizationsApplied ? 'text-green-400' : 'text-gray-400'}>
            {optimizationsApplied ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        {!optimizationsApplied && isLagging && (
          <button
            onClick={forceOptimizations}
            className="w-full mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-center"
          >
            Enable optimizations
          </button>
        )}
      </div>
    </div>
  )
}
