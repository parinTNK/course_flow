import React from "react";
import PromoRow from "./PromoRow";

export interface PromoCode {
  id: string;
  code: string;
  min_purchase_amount: number;
  discount_type: string;
  discount_value: number | null;
  discount_percentage: number | null;
  created_at: string;
  course_names?: string[]; // เพิ่ม field นี้
}

interface PromoCodesTableProps {
  promoCodes: PromoCode[];
  isLoading: boolean;
  currentPage: number;
  onEditPromoCode: (id: string) => void;
  onDeletePromoCode: (id: string) => void;
}

const PromoCodesTable: React.FC<PromoCodesTableProps> = ({
  promoCodes,
  isLoading,
  currentPage,
  onEditPromoCode,
  onDeletePromoCode,
}) => {
  if (!isLoading && promoCodes.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 bg-white shadow-md rounded-lg">
        No promo codes found.
      </div>
    );
  }

  const tableHeaders = [
    "Promo code",
    "Minimum purchase (THB)",
    "Discount type",
    "Courses Included",
    "Created date",
    "Action",
  ];
  const codesPerPage = 10;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-300">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  className={
                    "px-6 py-3 text-left text-[14px] font-medium text-gray-500 tracking-wider" +
                    (header === "Action" ? " text-center" : "")
                  }
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promoCodes.map((promo, idx) => (
              <PromoRow
                key={promo.id}
                promo={promo}
                index={idx}
                onEdit={onEditPromoCode}
                onDelete={onDeletePromoCode}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromoCodesTable;