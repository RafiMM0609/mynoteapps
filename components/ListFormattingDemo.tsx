'use client'

import { useState } from 'react'
import MarkdownPreview from './MarkdownPreview'

const demoContent = `# 🎨 Enhanced List Formatting Demo

## Bullet Lists dengan Styling Modern
- Item pertama dengan bullet styling yang menarik
- Item kedua dengan hover effects yang smooth  
- Item ketiga dengan warna yang konsisten
  - Sub-item dengan bullet berbeda
  - Sub-item dengan hierarchy yang jelas
    - Sub-sub-item dengan styling tertiary

## Numbered Lists yang Enhanced
1. Item pertama dengan numbered circle yang colorful
2. Item kedua dengan background dan typography yang better
3. Item ketiga dengan spacing yang optimal
   a. Sub-item dengan alphabetical numbering
   b. Sub-item dengan styling yang consistent
      i. Sub-sub-item dengan roman numerals
      ii. Hierarchy yang jelas dan readable

## Task Lists / Checklists  
- [ ] Task yang belum selesai dengan checkbox styling modern
- [x] Task yang sudah selesai dengan strikethrough effect
- [ ] Task dengan hover effects yang interactive
- [x] Task completed dengan visual feedback yang clear

## Mixed Content Lists
1. **Bold content** dalam numbered list
2. *Italic content* dengan emphasis  
3. \`Code content\` dalam list items
   - Sub-item dengan **bold text**
   - Sub-item dengan *italic emphasis*
   - Sub-item dengan \`inline code\`

## Alternative Styles Demo
Contoh styling khusus:
- Regular bullet points
- Custom arrow style → 
- Custom star style ★
- Custom check style ✓

## Benefits Summary
✅ **Visual Appeal** - Lebih menarik dan modern  
✅ **User Experience** - Interactive dan responsive
✅ **Readability** - Hierarchy yang jelas
✅ **Consistency** - Design language yang uniform`

export default function ListFormattingDemo() {
  const [showDemo, setShowDemo] = useState(true)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎨 Enhanced List Formatting
        </h1>
        <p className="text-gray-600">
          Professional UI/UX improvements untuk list formatting
        </p>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </button>
      </div>

      {/* Demo Content */}
      {showDemo && (
        <div className="border rounded-lg overflow-hidden">
          {/* Before/After Toggle */}
          <div className="bg-gray-50 p-4 border-b">
            <h3 className="font-semibold text-gray-800 mb-2">
              ✨ Enhanced Styling Applied
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <strong className="text-blue-600">Bullet Lists</strong>
                <p>Colored bullets dengan hover effects</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <strong className="text-green-600">Numbered Lists</strong>  
                <p>Circular numbers dengan backgrounds</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <strong className="text-purple-600">Checklists</strong>
                <p>Modern checkboxes dengan animations</p>
              </div>
            </div>
          </div>

          {/* Rendered Content */}
          <div className="p-6 bg-white">
            <MarkdownPreview 
              content={demoContent}
              availableNotes={[]}
              className="enhanced-lists"
            />
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">🎯 Visual Improvements</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Colored bullet points dengan hierarchy
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Numbered circles dengan contrasting colors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Better spacing dan typography
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Modern checkbox styling
            </li>
          </ul>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="font-bold text-green-900 mb-3">⚡ UX Enhancements</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Smooth hover animations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Interactive feedback effects
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Mobile-friendly touch targets
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Accessibility improvements
            </li>
          </ul>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="font-bold text-gray-900 mb-3">🔧 Implementation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>CSS Features:</strong>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>• CSS Counters untuk custom numbering</li>
              <li>• Pseudo-elements untuk bullets</li>
              <li>• Tailwind utilities untuk consistency</li>
              <li>• Smooth transitions dan animations</li>
            </ul>
          </div>
          <div>
            <strong>Browser Support:</strong>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>• ✅ Chrome/Edge (Latest)</li>
              <li>• ✅ Firefox (Latest)</li>
              <li>• ✅ Safari (Latest)</li>
              <li>• ✅ Mobile browsers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
