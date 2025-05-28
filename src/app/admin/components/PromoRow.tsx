import React from "react";
import Image from "next/image";
import type { PromoCode } from "@/types/promoCode";
import { formatCourseNames } from "../utils/formatCourseName";

interface PromoRowProps {
  promo: PromoCode;
  onEdit: (id: string) => void;
  onDelete: () => void;
}

const PromoRow: React.FC<PromoRowProps> = ({
  promo,
  onEdit,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {promo.code}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {promo.min_purchase_amount?.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {promo.discount_type}
      </td>
      {/* --- Courses Included --- */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {formatCourseNames(promo.is_all_courses, promo.course_names, 20)}
      </td>
      {/* --- End --- */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {promo.created_at
          ? new Date(promo.created_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button
          onClick={onDelete}
          className="text-blue-600 hover:text-blue-800 mr-3 transition"
          aria-label="Delete promo code"
        >
          <Image
            src="/delete.svg"
            alt="Delete"
            width={18}
            height={18}
            className="inline-block"
          />
        </button>
        <button
          onClick={() => onEdit(promo.id)}
          className="text-blue-600 hover:text-blue-800 transition"
          aria-label="Edit promo code"
        >
          <Image
            src="/edit.svg"
            alt="Edit"
            width={18}
            height={18}
            className="inline-block"
          />
        </button>
      </td>
    </tr>
  );
};

export default PromoRow;
