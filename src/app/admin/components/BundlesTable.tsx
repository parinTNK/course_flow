import React from "react";
import { BundleWithDetails } from "@/types/bundle";
import { BundleRow } from "./BundleRow";

interface BundlesTableProps {
  bundles: BundleWithDetails[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
  isLoading: boolean;
  currentPage: number;
}

export const BundlesTable: React.FC<BundlesTableProps> = ({
  bundles,
  onEdit,
  onDelete,
  formatDate,
  isLoading,
  currentPage,
}) => {
  const tableHeaderClasses =
    "px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider";
  const bundlesPerPage = 10;

  // แสดง Loading state
  if (isLoading) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading bundles...</span>
        </div>
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        No bundles found.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead style={{ backgroundColor: "#e8eaef" }}>
            <tr>
              {[
                "Bundle name",
                "Price",
                "Description",
                "Created date",
                "Action",
              ].map((header, idx) => (
                <th
                  key={idx}
                  className={`${tableHeaderClasses} ${
                    header === "Action" ? "text-center" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bundles.map((bundle, index) => (
              <BundleRow
                key={bundle.id}
                bundle={bundle}
                index={(currentPage - 1) * bundlesPerPage + index + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
