import { useState, useMemo } from 'react'
import type { Note } from '../lib/supabase'
import type { SearchFilters } from '../components/AdvancedSearchFilters'

export interface SearchOptions {
  searchTitle: boolean
  searchContent: boolean
  caseSensitive: boolean
  exactMatch: boolean
}

export interface SearchResult {
  filteredNotes: Note[]
  totalCount: number
  matchCount: number
  query: string
}

const getDateFilterPredicate = (dateRange: SearchFilters['dateRange']) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (dateRange) {
    case 'today':
      return (note: Note) => new Date(note.updated_at) >= today
    case 'week':
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      return (note: Note) => new Date(note.updated_at) >= weekAgo
    case 'month':
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      return (note: Note) => new Date(note.updated_at) >= monthAgo
    case 'year':
      const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      return (note: Note) => new Date(note.updated_at) >= yearAgo
    default:
      return () => true
  }
}

const getSortComparator = (sortBy: SearchFilters['sortBy'], sortOrder: SearchFilters['sortOrder']) => {
  const multiplier = sortOrder === 'asc' ? 1 : -1
  
  switch (sortBy) {
    case 'title':
      return (a: Note, b: Note) => {
        const titleA = (a.title || 'Untitled').toLowerCase()
        const titleB = (b.title || 'Untitled').toLowerCase()
        return titleA.localeCompare(titleB) * multiplier
      }
    case 'created':
      return (a: Note, b: Note) => {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * multiplier
      }
    case 'updated':
    default:
      return (a: Note, b: Note) => {
        return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * multiplier
      }
  }
}

export function useNoteSearch(
  notes: Note[], 
  options: SearchOptions = {
    searchTitle: true,
    searchContent: true,
    caseSensitive: false,
    exactMatch: false
  },
  filters: SearchFilters = {
    dateRange: 'all',
    tags: [],
    sortBy: 'updated',
    sortOrder: 'desc'
  }
) {
  const [searchQuery, setSearchQuery] = useState('')

  const searchResult = useMemo((): SearchResult => {
    let filteredNotes = [...notes]

    // Apply text search filter
    if (searchQuery.trim()) {
      const query = options.caseSensitive ? searchQuery : searchQuery.toLowerCase()
      filteredNotes = filteredNotes.filter(note => {
        let titleMatch = false
        let contentMatch = false

        // Search in title
        if (options.searchTitle && note.title) {
          const title = options.caseSensitive ? note.title : note.title.toLowerCase()
          titleMatch = options.exactMatch 
            ? title === query
            : title.includes(query)
        }

        // Search in content
        if (options.searchContent && note.content) {
          const content = options.caseSensitive ? note.content : note.content.toLowerCase()
          contentMatch = options.exactMatch
            ? content === query
            : content.includes(query)
        }

        return titleMatch || contentMatch
      })
    }

    // Apply date range filter
    const dateFilter = getDateFilterPredicate(filters.dateRange)
    filteredNotes = filteredNotes.filter(dateFilter)

    // Apply tag filter (if tags are available in note object - would need to be implemented)
    // This would require notes to have tags property or a separate lookup
    // For now, skipping tag filtering as it requires additional data structure

    // Apply sorting
    const sortComparator = getSortComparator(filters.sortBy, filters.sortOrder)
    filteredNotes.sort(sortComparator)

    return {
      filteredNotes,
      totalCount: notes.length,
      matchCount: filteredNotes.length,
      query: searchQuery
    }
  }, [notes, searchQuery, options, filters])

  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text
    
    const searchQuery = options.caseSensitive ? query : query.toLowerCase()
    const searchText = options.caseSensitive ? text : text.toLowerCase()
    
    if (!searchText.includes(searchQuery)) return text
    
    // Simple highlighting - can be enhanced with better regex
    const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, options.caseSensitive ? 'g' : 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>')
  }

  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResult,
    highlightText,
    clearSearch
  }
}
