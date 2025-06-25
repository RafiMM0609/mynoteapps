import { createContext, useContext, useReducer, type ReactNode } from 'react'

// Types
interface TreeState {
  expandedNodes: Set<string>
  selectedNodeId: string | null
  expandedStateVersion: number
}

type TreeAction = 
  | { type: 'TOGGLE_NODE'; nodeId: string }
  | { type: 'EXPAND_NODE'; nodeId: string }
  | { type: 'COLLAPSE_NODE'; nodeId: string }
  | { type: 'SELECT_NODE'; nodeId: string }
  | { type: 'BATCH_EXPAND'; nodeIds: string[] }
  | { type: 'RESET_STATE' }

// Reducer for optimized state management
function treeStateReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case 'TOGGLE_NODE': {
      const newExpanded = new Set(state.expandedNodes)
      if (newExpanded.has(action.nodeId)) {
        newExpanded.delete(action.nodeId)
      } else {
        newExpanded.add(action.nodeId)
      }
      return {
        ...state,
        expandedNodes: newExpanded,
        expandedStateVersion: state.expandedStateVersion + 1
      }
    }
    
    case 'EXPAND_NODE': {
      if (state.expandedNodes.has(action.nodeId)) return state
      const newExpanded = new Set(state.expandedNodes)
      newExpanded.add(action.nodeId)
      return {
        ...state,
        expandedNodes: newExpanded,
        expandedStateVersion: state.expandedStateVersion + 1
      }
    }
    
    case 'COLLAPSE_NODE': {
      if (!state.expandedNodes.has(action.nodeId)) return state
      const newExpanded = new Set(state.expandedNodes)
      newExpanded.delete(action.nodeId)
      return {
        ...state,
        expandedNodes: newExpanded,
        expandedStateVersion: state.expandedStateVersion + 1
      }
    }
    
    case 'SELECT_NODE': {
      if (state.selectedNodeId === action.nodeId) return state
      return {
        ...state,
        selectedNodeId: action.nodeId
      }
    }
    
    case 'BATCH_EXPAND': {
      const newExpanded = new Set(state.expandedNodes)
      let hasChanges = false
      action.nodeIds.forEach(nodeId => {
        if (!newExpanded.has(nodeId)) {
          newExpanded.add(nodeId)
          hasChanges = true
        }
      })
      
      if (!hasChanges) return state
      return {
        ...state,
        expandedNodes: newExpanded,
        expandedStateVersion: state.expandedStateVersion + 1
      }
    }
    
    case 'RESET_STATE':
      return {
        expandedNodes: new Set(),
        selectedNodeId: null,
        expandedStateVersion: 0
      }
    
    default:
      return state
  }
}

// Context
interface TreeContextValue {
  state: TreeState
  dispatch: React.Dispatch<TreeAction>
  isExpanded: (nodeId: string) => boolean
  toggleNode: (nodeId: string) => void
  expandNode: (nodeId: string) => void
  collapseNode: (nodeId: string) => void
  selectNode: (nodeId: string) => void
  expandMultiple: (nodeIds: string[]) => void
}

const TreeContext = createContext<TreeContextValue | null>(null)

// Custom hook
export function useTreeState() {
  const context = useContext(TreeContext)
  if (!context) {
    throw new Error('useTreeState must be used within TreeStateProvider')
  }
  return context
}

// Performance monitoring hook
export function useTreePerformance() {
  const { state } = useTreeState()
  
  return {
    totalExpandedNodes: state.expandedNodes.size,
    stateVersion: state.expandedStateVersion,
    memoryUsage: state.expandedNodes.size * 50, // Rough estimate in bytes
  }
}

// Export types and reducer for external use
export type { TreeState, TreeAction, TreeContextValue }
export { treeStateReducer, TreeContext }
