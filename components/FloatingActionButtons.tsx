'use client'

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FloatingActionButtonsProps {
  onSave: () => void
  onCancel: () => void
  hasChanges: boolean
  isSaving?: boolean
  saveSuccess?: boolean
  disabled?: boolean
}

export default function FloatingActionButtons({
  onSave,
  onCancel,
  hasChanges,
  isSaving = false,
  saveSuccess = false,
  disabled = false
}: FloatingActionButtonsProps) {
  // Only show FABs if there are changes or we're in a critical save state
  if (!hasChanges && !isSaving && !saveSuccess) {
    return null
  }

  return (
    <div className="fab-save-container">
      {/* Save FAB - Only show the blue save button for better aesthetics */}
      <button
        onClick={onSave}
        disabled={!hasChanges || isSaving || disabled}
        className={`fab-save ${isSaving ? 'btn-loading' : ''}`}
        aria-label={isSaving ? 'Saving...' : 'Save note'}
      >
        <CheckIcon className="w-6 h-6" />
        <span className="fab-tooltip">
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
        </span>
        
        {hasChanges && !isSaving && (
          <div className={`fab-status-indicator ${saveSuccess ? 'saved' : ''}`}></div>
        )}
      </button>
    </div>
  )
}
