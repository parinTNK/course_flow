'use client'

import React from 'react'
import { X } from 'lucide-react'

interface NavigationConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function NavigationConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: NavigationConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-medium text-gray-900">
            Upload in Progress
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">
            Video upload is still in progress. If you leave this page, the upload will be cancelled. Do you want to continue?
          </p>
        </div>

        {/* Actions */}
        <div className="pb-6 px-6 border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
          >
            No, Stay
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md font-medium transition-colors duration-200 bg-white border border-orange-500 text-orange-500 hover:bg-orange-50"
          >
            Yes, Leave
          </button>
        </div>
      </div>
    </div>
  )
}
