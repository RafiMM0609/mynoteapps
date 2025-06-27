'use client'

import { useState } from 'react'
import MarkdownPreview from '../../../components/MarkdownPreview'

export default function ListExitTestPage() {
  const [testContent] = useState(`# List Exit Test - Desktop vs Mobile

## Testing Instructions

### Desktop Behavior
1. Create a bullet or numbered list
2. Press **Enter twice** - should exit the list
3. Works consistently with standard keyboard

### Mobile Behavior (Enhanced)
1. Create a bullet or numbered list  
2. Press **Enter twice quickly** - will exit the list
3. Visual hint appears: "Press Enter again to exit list"
4. Better touch detection and feedback

## Sample Lists for Testing

### Bullet List
- First item
- Second item
- Third item
- Press Enter twice here to exit

### Numbered List
1. First item
2. Second item  
3. Third item
4. Press Enter twice here to exit

### Mixed List
- Main item 1
  1. Sub item 1
  2. Sub item 2
- Main item 2
  - Sub bullet 1
  - Sub bullet 2

## Technical Improvements

✅ **Mobile Detection**: Accurate device detection
✅ **Double-Tap Logic**: 500ms window for double Enter
✅ **Visual Feedback**: Mobile hint system
✅ **Empty List Detection**: Handles empty list items
✅ **Cross-Platform**: Works on desktop and mobile
✅ **Touch-Friendly**: Better touch targets
✅ **Consistent UX**: Unified behavior across devices

## Implementation Details

The fix includes:
- Enhanced \`handleKeyDown\` logic
- Mobile device detection
- Double-tap timing detection  
- Visual feedback system
- Cross-platform compatibility
- Better list item handling

Try creating lists and testing the exit behavior on both desktop and mobile!
`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📝 List Exit Test - Desktop vs Mobile
              </h1>
              <p className="text-gray-600">
                Test the enhanced list exit behavior for both desktop and mobile devices
              </p>
            </div>
            
            {/* Test Instructions */}
            <div className="mb-8 bg-blue-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">🧪 How to Test</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">🖥️ Desktop</h3>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Create a list (bullet or numbered)</li>
                    <li>2. Press Enter twice quickly</li>
                    <li>3. Should exit list smoothly</li>
                  </ol>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📱 Mobile</h3>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Create a list on mobile</li>
                    <li>2. Press Enter twice within 500ms</li>
                    <li>3. See visual hint and list exit</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Content Preview */}
            <div className="markdown-content">
              <MarkdownPreview 
                content={testContent} 
                availableNotes={[]}
                className="enhanced-lists"
              />
            </div>

            {/* Technical Notes */}
            <div className="mt-8 bg-green-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">⚙️ Technical Improvements</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Detection</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mobile device detection</li>
                    <li>• Touch interface support</li>
                    <li>• User agent checking</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Timing</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 500ms double-tap window</li>
                    <li>• State-based tracking</li>
                    <li>• False positive prevention</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Feedback</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Visual mobile hints</li>
                    <li>• Touch-friendly targets</li>
                    <li>• Better accessibility</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
