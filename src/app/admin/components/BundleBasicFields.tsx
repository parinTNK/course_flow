import React from "react";

interface CreateBundleData {
  name: string;
  price: string;
  description: string;
  detail: string;
  course_ids: string[];
}

interface BundleBasicFieldsProps {
  formData: CreateBundleData;
  onInputChange: (field: keyof CreateBundleData, value: string) => void;
}

export const BundleBasicFields: React.FC<BundleBasicFieldsProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <>
      {/* Bundle Package Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bundle Package Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onInputChange("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter bundle name"
        />
      </div>

      {/* Price */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => onInputChange("price", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0.00"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onInputChange("description", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Brief description of the bundle"
        />
      </div>

      {/* Detail */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detail
        </label>
        <textarea
          value={formData.detail}
          onChange={(e) => onInputChange("detail", e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Detailed description of what's included in this bundle"
        />
      </div>
    </>
  );
};
