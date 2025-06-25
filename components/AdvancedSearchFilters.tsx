'use client'

import { useState } from 'react'
import { CalendarIcon, TagIcon, FunnelIcon } from '@heroicons/react/24/outline'

export interface SearchFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  tags: string[]
  sortBy: 'updated' | 'created' | 'title' | 'relevance'
  sortOrder: 'asc' | 'desc'
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableTags?: Array<{ id: string; name: string; color: string }>
  isVisible?: boolean
}

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  isVisible = false
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(isVisible)

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleTagToggle = (tagId: string) => {
    const updatedTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId]
    
    handleFilterChange('tags', updatedTags)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      tags: [],
      sortBy: 'updated',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.dateRange !== 'all' || filters.tags.length > 0 || filters.sortBy !== 'updated'

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Advanced Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Active
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <FunnelIcon className="h-4 w-4 mr-2" />
          Advanced Filters
        </h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range Filter */}
        <div>
          <label className="flex items-center text-xs font-medium text-gray-700 mb-2">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="updated">Last updated</option>
              <option value="created">Date created</option>
              <option value="title">Title</option>
              <option value="relevance">Relevance</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div>
            <label className="flex items-center text-xs font-medium text-gray-700 mb-2">
              <TagIcon className="h-3 w-3 mr-1" />
              Tags ({filters.tags.length} selected)
            </label>
            <div className="max-h-24 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
              {availableTags.map(tag => (
                <label key={tag.id} className="flex items-center text-xs mb-1 last:mb-0">
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {filters.dateRange}
              </span>
            )}
            {filters.tags.map(tagId => {
              const tag = availableTags.find(t => t.id === tagId)
              return tag ? (
                <span key={tagId} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
              ) : null
            })}
            {filters.sortBy !== 'updated' && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Sort: {filters.sortBy} {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
