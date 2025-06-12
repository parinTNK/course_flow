import React from "react";
import { ButtonT } from "@/components/ui/ButtonT";

interface BundleFormHeaderProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
  hasSelectedCourses: boolean;
}

export const BundleFormHeader: React.FC<BundleFormHeaderProps> = ({
  onCancel,
  onSubmit,
  loading,
  hasSelectedCourses,
}) => {
  return (
    <div className="bg-white px-8 py-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Add Bundle</h1>
          <p className="text-gray-600 mt-1">Create a new bundle package</p>
        </div>
        <div className="flex items-center space-x-4">
          <ButtonT variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </ButtonT>
          <ButtonT
            variant="primary"
            onClick={onSubmit}
            disabled={loading || !hasSelectedCourses}
          >
            {loading ? "Creating..." : "Create"}
          </ButtonT>
        </div>
      </div>
    </div>
  );
};
