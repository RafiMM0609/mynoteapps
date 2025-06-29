'use client'

import { useState } from 'react'
import MobileOptimizedEditor from '../../../components/MobileOptimizedEditor'
import MarkdownPreview from '../../../components/MarkdownPreview'

export default function MobileListBehaviorDemo() {
  const [content, setContent] = useState(`# Demo Mobile List Behavior

Coba test perilaku Enter pada list di mobile:

## Bullet List
- Item pertama
- Item kedua  
- Item ketiga (tekan Enter di sini untuk lanjut, tekan Enter 2x untuk keluar dari list)

## Numbered List  
1. Item pertama
2. Item kedua
3. Item ketiga (tekan Enter di sini untuk lanjut, tekan Enter 2x untuk keluar dari list)

## Mixed List
- Item utama 1
  1. Sub item 1
  2. Sub item 2 (tekan Enter 2x untuk keluar dari numbered sub-list)
- Item utama 2
  - Sub bullet 1
  - Sub bullet 2 (tekan Enter 2x untuk keluar dari bullet sub-list)

## Testing Instructions

### Mobile Behavior (Enhanced):
1. Buat bullet atau numbered list
2. **Tekan Enter sekali** - akan melanjutkan list dengan item baru
3. **Tekan Enter dua kali dalam 500ms** - akan keluar dari list
4. Visual hint akan muncul: "Press Enter again to exit list"
5. Untuk list kosong, tekan Enter sekali langsung keluar

### Desktop Behavior (Referensi):
1. Sama seperti mobile tapi tanpa timing detection
2. Enter pada empty list item langsung keluar
3. Enter pada list item berisi akan lanjut ke item baru
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
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaveSuccess(true)
    setHasChanges(false)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleCancel = () => {
    // Reset or navigate back
    console.log('Cancel clicked')
  }

  const renderPreview = (content: string) => {
    return (
      <MarkdownPreview 
        content={content}
        availableNotes={[]}
        className="mobile-preview-content"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📱 Mobile List Behavior Demo
            </h1>
            <p className="text-gray-600">
              Test perilaku Enter pada list yang sudah disesuaikan antara mobile dan desktop
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-8 bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">🧪 Cara Testing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">📱 Mobile</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Buat list (bullet atau numbered)</li>
                  <li>2. Tekan Enter sekali → lanjut item baru</li>
                  <li>3. Tekan Enter 2x dalam 500ms → keluar list</li>
                  <li>4. Lihat hint visual yang muncul</li>
                  <li>5. Empty list item → Enter sekali keluar</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">🖥️ Desktop</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Buat list (bullet atau numbered)</li>
                  <li>2. Tekan Enter sekali → lanjut item baru</li>
                  <li>3. Empty list item → Enter sekali keluar</li>
                  <li>4. Konsisten dengan behavior umum</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Editor Demo */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">Mobile Optimized Editor</h3>
              <p className="text-sm text-gray-600">Editor yang menggunakan textarea dengan enhanced list behavior</p>
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
                title="Mobile List Behavior Test"
              />
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-green-900 mb-3">✅ Improvements Implemented</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Consistent Enter behavior mobile ↔ desktop
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Double-tap detection untuk exit list pada mobile
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Visual feedback hint untuk mobile users
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Auto-increment numbered lists
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Empty list item detection
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">🔧 Technical Details</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Regex detection untuk list patterns
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Timing-based double-tap logic (500ms)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Mobile device detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  CSS transitions untuk smooth UX
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Cross-platform compatibility
                </li>
              </ul>
            </div>
          </div>

          {/* Browser Support */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">🌐 Browser Support</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div>Chrome Mobile</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div>Safari iOS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div>Firefox Mobile</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div>Edge Mobile</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
