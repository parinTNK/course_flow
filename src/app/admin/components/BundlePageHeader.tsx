import React from "react";
import SearchBar from "@/app/admin/components/SearchBar";
import { ButtonT } from "@/components/ui/ButtonT";

interface BundlePageHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddBundle: () => void;
}

export const BundlePageHeader: React.FC<BundlePageHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onAddBundle,
}) => {
  return (
    <div className="bg-white px-8 py-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">
          Bundle Packages
        </h1>

        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="w-80">
            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search..."
              className="w-full"
              debounceDelay={300}
            />
          </div>

          {/* Add Button */}
          <ButtonT
            variant="primary"
            className="w-auto px-6 py-2 whitespace-nowrap"
            onClick={onAddBundle}
          >
            + Add Bundle
          </ButtonT>
        </div>
      </div>
    </div>
  );
};
