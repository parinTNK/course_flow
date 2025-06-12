import React, { useState } from 'react';

interface StudentSubscriptionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  courseName: string;
}

const StudentSubscriptionWarningModal: React.FC<StudentSubscriptionWarningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  courseName,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmationValid = confirmationText === courseName;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-medium text-gray-900">This course has active student subscriptions</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            The course <span className="font-bold">{courseName}</span> currently has students enrolled. Are you sure you want to delete this course?
          </p>
          <p className="text-red-600 mt-2 text-sm">
            Deleting this course will permanently remove all related data including student subscriptions.
          </p>
          <div className="mt-4">
            <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-1">
              Please type <span className="font-bold">{courseName}</span> to confirm deletion:
            </label>
            <input
              id="confirmDelete"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Type "${courseName}" to confirm`}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-red-500 text-xs mt-1">
                The text does not match. Please type the exact course name.
              </p>
            )}
          </div>
        </div>
        <div className="pb-6 px-6 border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onProceed}
            disabled={!isConfirmationValid}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              isConfirmationValid 
                ? "bg-orange-500 text-white hover:bg-orange-600" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Delete Course
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSubscriptionWarningModal;
