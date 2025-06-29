'use client'

import { useState } from 'react'
import MobileOptimizedEditor from '../../../components/MobileOptimizedEditor'
import MarkdownPreview from '../../../components/MarkdownPreview'

export default function NumberedListFixDemo() {
  const [content, setContent] = useState(`# Demo Numbered List Fix

Test perilaku Enter pada numbered list yang sudah diperbaiki:

## Test Case 1: Sequential numbering
1. Item pertama
2. Item kedua (tekan Enter di sini untuk test)

## Test Case 2: Non-sequential numbers  
1. Item pertama
5. Item kelima (tekan Enter di sini - harusnya jadi 6)

## Test Case 3: Nested lists
1. Item utama 1
   1. Sub item 1
   2. Sub item 2 (tekan Enter di sini untuk test)
2. Item utama 2

## Test Case 4: Mixed indent levels
1. Level 1
   a. Level 2 different marker
      1. Level 3 numbered (tekan Enter di sini)

## Instructions:
- Tekan Enter pada akhir item numbered list 
- Seharusnya melanjutkan dengan nomor berikutnya yang benar
- Tekan Enter 2x dalam 500ms untuk keluar dari list
`)

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setHasChanges(false)
      setTimeout(() => setSaveSuccess(false), 1000)
    }, 1000)
  }

  const handleCancel = () => {
    setHasChanges(false)
  }

  const renderPreview = (content: string) => (
    <MarkdownPreview 
      content={content} 
      availableNotes={[]}
      className="enhanced-lists"
    />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔢 Numbered List Fix Demo
          </h1>
          <p className="text-gray-600">
            Test perbaikan untuk masalah numbered list pada mobile editor
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4">🧪 Cara Testing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">✅ Yang Diperbaiki</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Increment nomor yang benar berdasarkan konteks</li>
                <li>• Deteksi level indent untuk nested lists</li>
                <li>• Handling untuk numbered list yang tidak sequential</li>
                <li>• Cursor positioning yang akurat</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Test Cases</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. Sequential: 1, 2, 3...</li>
                <li>2. Non-sequential: 1, 5, 6...</li>
                <li>3. Nested: multi-level numbering</li>
                <li>4. Mixed: bullets + numbers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Editor Demo */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <h3 className="font-semibold text-gray-800 ml-4">Mobile Optimized Editor with Numbered List Fix</h3>
            </div>
          </div>
          
          <div className="h-96">
            <MobileOptimizedEditor
              content={content}
              onChange={handleChange}
              onSave={handleSave}
              onCancel={handleCancel}
              hasChanges={hasChanges}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              renderPreview={renderPreview}
              title="Numbered List Fix Test"
            />
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-bold text-green-900 mb-3">✅ Improvements Applied</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Smart number detection by context scanning
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Proper handling of nested numbered lists
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Support for non-sequential numbering
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Accurate cursor positioning after insertion
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-3">🔧 Technical Details</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Regex pattern untuk multi-level detection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Backward scanning untuk context discovery
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Indent level comparison logic
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Smart number increment calculation
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Notes */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">📋 Implementation Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Before Fix:</strong>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Simple increment dari current marker</li>
                <li>• Tidak mempertimbangkan konteks list</li>
                <li>• Masalah pada nested dan non-sequential</li>
              </ul>
            </div>
            <div>
              <strong>After Fix:</strong>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Context-aware number detection</li>
                <li>• Proper indent level handling</li>
                <li>• Support untuk complex list structures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
