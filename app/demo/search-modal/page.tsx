'use client'

import { useState } from 'react'
import SearchModal from '../../../components/SearchModal'
import type { Note } from '../../../lib/supabase'

// Mock data for demo
const mockNotes = [
  {
    id: '1',
    user_id: 'demo',
    title: 'Getting Started with React Hooks',
    content: 'React Hooks are a powerful feature that allows you to use state and other React features without writing a class component. The most commonly used hooks are useState and useEffect. These hooks make it easier to share stateful logic between components and make your code more readable.',
    parent_id: null,
    is_folder: false,
    sort_order: 1,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2', 
    user_id: 'demo',
    title: 'TypeScript Best Practices',
    content: 'TypeScript provides static type checking for JavaScript. Here are some best practices: 1. Use interfaces for object shapes, 2. Leverage union types for flexibility, 3. Use generics for reusable components, 4. Always enable strict mode in tsconfig.json for better type safety.',
    parent_id: null,
    is_folder: false,
    sort_order: 2,
    created_at: '2024-01-16T09:30:00Z',
    updated_at: '2024-01-16T09:30:00Z'
  },
  {
    id: '3',
    user_id: 'demo', 
    title: 'Advanced Search Implementation',
    content: 'Implementing a sophisticated search feature requires several components: 1. Full-text search with highlighting, 2. Fuzzy matching for typos, 3. Search result ranking, 4. Recent search history, 5. Advanced filtering options. The key is to balance performance with user experience.',
    parent_id: null,
    is_folder: false,
    sort_order: 3,
    created_at: '2024-01-17T14:20:00Z',
    updated_at: '2024-01-17T14:20:00Z'
  },
  {
    id: '4',
    user_id: 'demo',
    title: 'UI/UX Design Principles', 
    content: 'Great user interface design follows these principles: 1. Clarity - make it obvious what users can do, 2. Consistency - use familiar patterns, 3. Feedback - provide clear responses to user actions, 4. Efficiency - help users accomplish tasks quickly, 5. Accessibility - ensure everyone can use your product.',
    parent_id: null,
    is_folder: false,
    sort_order: 4,
    created_at: '2024-01-18T11:45:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  },
  {
    id: '5',
    user_id: 'demo',
    title: 'Performance Optimization Tips',
    content: 'Web performance is crucial for user experience. Key optimization strategies include: 1. Code splitting and lazy loading, 2. Image optimization and compression, 3. Caching strategies, 4. Minimizing JavaScript bundle size, 5. Using CDNs for static assets, 6. Database query optimization.',
    parent_id: null,
    is_folder: false,
    sort_order: 5,
    created_at: '2024-01-19T16:10:00Z',
    updated_at: '2024-01-19T16:10:00Z'
  }
]

export default function SearchModalDemo() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🔍 Enhanced Search Modal Demo
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Experience the new and improved search interface for better note discovery
          </p>
          
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-2xl shadow-blue-500/25"
          >
            Open Search Modal ✨
          </button>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Lightning Fast Search</h3>
            <p className="text-gray-600 text-sm">
              Instant search results with intelligent ranking and fuzzy matching for typos.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Highlighting</h3>
            <p className="text-gray-600 text-sm">
              See exactly where your search terms appear with intelligent text highlighting.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-3">⌨️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Keyboard Navigation</h3>
            <p className="text-gray-600 text-sm">
              Full keyboard support with arrow keys, Enter to select, and Escape to close.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Recent Searches</h3>
            <p className="text-gray-600 text-sm">
              Quick access to your recent search queries for faster note discovery.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Search Analytics</h3>
            <p className="text-gray-600 text-sm">
              See search stats including number of results and search time.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Beautiful UI</h3>
            <p className="text-gray-600 text-sm">
              Modern, clean interface with smooth animations and glass morphism effects.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How to Use</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🔥 Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Open Search</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-700">Ctrl + K</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Navigate Results</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-700">↑ ↓</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Select Note</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-700">Enter</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Close Modal</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-700">Esc</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Search Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Type specific keywords for better results</li>
                <li>• Search works on both titles and content</li>
                <li>• Fuzzy matching handles typos automatically</li>
                <li>• Recent searches are saved for quick access</li>
                <li>• Results are ranked by relevance and recency</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Selected Note Display */}
        {selectedNote && (
          <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Note:</h3>
            <div className="bg-white/40 rounded-xl p-4">
              <h4 className="font-medium text-gray-800 mb-2">{selectedNote.title}</h4>
              <p className="text-gray-600 text-sm line-clamp-3">{selectedNote.content}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        notes={mockNotes}
        onSelectNote={(note: Note) => {
          setSelectedNote(note)
          console.log('Selected note:', note)
        }}
      />
    </div>
  )
}
