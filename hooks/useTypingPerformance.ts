'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A hook to monitor typing performance and detect input lag
 * 
 * @param options Configuration options
 * @returns Performance metrics and optimization state
 */
export function useTypingPerformance(options: {
  threshold?: number;  // Lag threshold in ms (default: 100ms)
  sampleSize?: number; // Number of events to sample (default: 10)
  enabled?: boolean;   // Whether monitoring is enabled (default: true)
} = {}) {
  const {
    threshold = 100,
    sampleSize = 10,
    enabled = false,
  } = options
  
  const [isLagging, setIsLagging] = useState(false)
  const [avgLatency, setAvgLatency] = useState(0)
  const [optimizationsApplied, setOptimizationsApplied] = useState(false)
  
  const measurements = useRef<number[]>([])
  const lastKeyTime = useRef<number | null>(null)
  const measurementTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // Record input latency for each keypress
  const measureInputLatency = useCallback((event: KeyboardEvent) => {
    const now = performance.now()
    
    if (lastKeyTime.current !== null) {
      const latency = now - lastKeyTime.current
      
      // Only record reasonable values (filter out user pauses)
      if (latency < 1000) {
        measurements.current.push(latency)
        
        // Keep only the most recent measurements
        if (measurements.current.length > sampleSize) {
          measurements.current.shift()
        }
        
        // Calculate average latency from recent measurements
        if (measurements.current.length >= 5) {
          const avgLatency = measurements.current.reduce((sum, val) => sum + val, 0) / measurements.current.length
          setAvgLatency(Math.round(avgLatency))
          
          // Determine if we're experiencing lag
          setIsLagging(avgLatency > threshold)
          
          // Auto-apply optimizations if lag is detected
          if (avgLatency > threshold && !optimizationsApplied) {
            setOptimizationsApplied(true)
          }
        }
      }
    }
    
    lastKeyTime.current = now
    
    // Reset timer for the next expected keystroke
    if (measurementTimeout.current) {
      clearTimeout(measurementTimeout.current)
    }
    
    // Reset the measurement if no typing happens for 2 seconds
    measurementTimeout.current = setTimeout(() => {
      lastKeyTime.current = null
    }, 2000)
  }, [threshold, sampleSize, optimizationsApplied])
  
  // Setup and cleanup event listeners
  useEffect(() => {
    if (!enabled) return
    
    document.addEventListener('keydown', measureInputLatency)
    
    return () => {
      document.removeEventListener('keydown', measureInputLatency)
      if (measurementTimeout.current) {
        clearTimeout(measurementTimeout.current)
      }
    }
  }, [enabled, measureInputLatency])
  
  // Force optimizations in low-memory or slower devices
  useEffect(() => {
    // Check for low memory devices or slower CPUs
    const isLowSpecDevice = () => {
      // Mobile device detection
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // Check for RAM if available
      // @ts-ignore - navigator.deviceMemory is not in standard TS definitions
      const lowMemory = typeof navigator.deviceMemory !== 'undefined' && navigator.deviceMemory < 4
      
      // Check for slower CPUs via hardware concurrency
      const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
      
      return isMobile || lowMemory || lowCPU
    }
    
    if (isLowSpecDevice() && !optimizationsApplied) {
      setOptimizationsApplied(true)
    }
  }, [optimizationsApplied])
  
  return {
    isLagging,
    avgLatency,
    optimizationsApplied,
    forceOptimizations: () => setOptimizationsApplied(true),
    resetOptimizations: () => setOptimizationsApplied(false),
  }
}
