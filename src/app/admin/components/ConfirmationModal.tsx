"use client";

import { ReactNode, useRef, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
  requireCourseName?: boolean;
  courseName?: string;
  customModalSize?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation",
  message,
  confirmText = "Yes, I want to delete",
  cancelText = "No, keep it",
  confirmButtonClass = "bg-white border border-orange-500 text-orange-500 hover:bg-orange-50",
  cancelButtonClass = "bg-blue-600 text-white hover:bg-blue-700",
  requireCourseName = false,
  courseName = "",
  customModalSize,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl overflow-hidden ${ 
         customModalSize ?? "max-w-md w-full"
        }`}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-medium text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
          {requireCourseName && courseName && (
            <div className="mt-4">
              <p className="text-sm text-red-600 mb-2">
                Additional confirmation information would go here
              </p>
            </div>
          )}
        </div>
        <div className="pb-6 px-6 border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            style={{backgroundColor: '#2563eb'}}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 ${cancelButtonClass}`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
