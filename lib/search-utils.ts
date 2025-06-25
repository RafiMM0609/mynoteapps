// Utility functions for enhanced search functionality

export interface SearchFilter {
  dateRange?: {
    start: Date | null
    end: Date | null
  }
  tags?: string[]
  folders?: string[]
  contentType?: 'all' | 'markdown' | 'text'
}

export interface SearchResult {
  id: string
  title: string
  content: string
  matchScore: number
  matchType: 'title' | 'content' | 'tag' | 'folder'
  matchHighlight: string
  snippet: string
  updated_at: string
  created_at: string
  folder_name?: string
}

export class AdvancedSearch {
  static performSearch(
    query: string, 
    notes: any[], 
    filters?: SearchFilter
  ): SearchResult[] {
    if (!query.trim()) return []

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    const results: SearchResult[] = []

    notes.forEach(note => {
      // Apply date filter first
      if (filters?.dateRange) {
        const noteDate = new Date(note.updated_at)
        if (filters.dateRange.start && noteDate < filters.dateRange.start) return
        if (filters.dateRange.end && noteDate > filters.dateRange.end) return
      }

      let matchScore = 0
      let matchType: SearchResult['matchType'] = 'content'
      let matchHighlight = ''
      let snippet = ''

      // Search in title (highest priority)
      const titleLower = (note.title || '').toLowerCase()
      const titleMatches = searchTerms.filter(term => titleLower.includes(term))
      if (titleMatches.length > 0) {
        matchScore += titleMatches.length * 10
        matchType = 'title'
        matchHighlight = this.highlightText(note.title || '', searchTerms)
        snippet = note.title || ''
      }

      // Search in content
      const contentLower = (note.content || '').toLowerCase()
      const contentMatches = searchTerms.filter(term => contentLower.includes(term))
      if (contentMatches.length > 0) {
        matchScore += contentMatches.length * 5
        if (matchType !== 'title') {
          matchType = 'content'
          const contentSnippet = this.getContentSnippet(note.content || '', searchTerms)
          matchHighlight = contentSnippet.highlighted
          snippet = contentSnippet.plain
        }
      }

      // Exact phrase matching (bonus points)
      if (titleLower.includes(query.toLowerCase()) || contentLower.includes(query.toLowerCase())) {
        matchScore += 15
      }

      // Fuzzy matching for typos
      const fuzzyMatches = this.fuzzyMatch(query.toLowerCase(), titleLower + ' ' + contentLower)
      if (fuzzyMatches && matchScore === 0) {
        matchScore += 2
        matchHighlight = note.title || ''
        snippet = note.title || ''
      }

      if (matchScore > 0) {
        results.push({
          id: note.id,
          title: note.title || '',
          content: note.content || '',
          matchScore,
          matchType,
          matchHighlight: matchHighlight || note.title,
          snippet: snippet || note.title,
          updated_at: note.updated_at,
          created_at: note.created_at,
          folder_name: note.folder_name
        })
      }
    })

    // Sort by relevance and recency
    return results.sort((a, b) => {
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }

  static highlightText(text: string, searchTerms: string[]): string {
    let highlighted = text
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded font-medium">$1</mark>')
    })
    return highlighted
  }

  static getContentSnippet(content: string, searchTerms: string[]): { plain: string, highlighted: string } {
    if (!content) {
      return { plain: '', highlighted: '' }
    }
    
    const words = content.split(/\s+/)
    const maxSnippetLength = 150
    
    // Find the first occurrence of any search term
    let startIndex = 0
    for (let i = 0; i < words.length; i++) {
      if (searchTerms.some(term => words[i].toLowerCase().includes(term))) {
        startIndex = Math.max(0, i - 10) // Get some context before the match
        break
      }
    }

    // Get snippet around the match
    let snippet = words.slice(startIndex, startIndex + 25).join(' ')
    if (snippet.length > maxSnippetLength) {
      snippet = snippet.substring(0, maxSnippetLength) + '...'
    }
    if (startIndex > 0) {
      snippet = '...' + snippet
    }

    return {
      plain: snippet,
      highlighted: this.highlightText(snippet, searchTerms)
    }
  }

  static fuzzyMatch(query: string, text: string): boolean {
    const queryChars = query.toLowerCase().split('')
    const textChars = text.toLowerCase().split('')
    let queryIndex = 0

    for (let i = 0; i < textChars.length && queryIndex < queryChars.length; i++) {
      if (textChars[i] === queryChars[queryIndex]) {
        queryIndex++
      }
    }

    return queryIndex === queryChars.length
  }

  static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  static getRecentSearches(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const searches = localStorage.getItem('recentSearches')
      return searches ? JSON.parse(searches) : []
    } catch {
      return []
    }
  }

  static saveSearch(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return

    try {
      const recent = this.getRecentSearches()
      const filtered = recent.filter(s => s !== query)
      const updated = [query, ...filtered].slice(0, 10) // Keep last 10 searches
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  static clearRecentSearches(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem('recentSearches')
    } catch {
      // Silently fail
    }
  }
}
