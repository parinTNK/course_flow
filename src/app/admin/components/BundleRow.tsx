import React from "react";
import Image from "next/image";
import { BundleWithDetails } from "@/types/bundle";

interface BundleRowProps {
  bundle: BundleWithDetails;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}

export const BundleRow: React.FC<BundleRowProps> = ({
  bundle,
  index,
  onEdit,
  onDelete,
  formatDate,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
        <div className="truncate" title={bundle.name}>
          {bundle.name}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatPrice(bundle.price)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
        <div className="truncate" title={bundle.description}>
          {bundle.description || "Lorem ipsum dolor sit amet, co..."}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatDate(bundle.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <div className="flex items-center justify-start space-x-3 ml-1">
          <button
            onClick={() => {
              console.log("🗑️ Delete clicked for bundle:", bundle.id);
              onDelete(bundle.id);
            }}
            className="text-blue-600 hover:text-blue-800 transition cursor-pointer"
            aria-label="Delete bundle"
          >
            <Image
              src="/delete.svg"
              alt="Delete"
              width={19}
              height={19}
              className="inline-block"
            />
          </button>
          <button
            onClick={() => {
              console.log("✏️ Edit clicked for bundle:", bundle.id);
              onEdit(bundle.id);
            }}
            className="text-blue-600 hover:text-blue-800 transition cursor-pointer"
            aria-label="Edit bundle"
          >
            <Image
              src="/edit.svg"
              alt="Edit"
              width={19}
              height={19}
              className="inline-block"
            />
          </button>
        </div>
      </td>
    </tr>
  );
};
