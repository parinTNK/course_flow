import React from "react";
import PromoRow from "./PromoRow";
import type { PromoCode } from "@/types/promoCode";


interface PromoCodesTableProps {
  promoCodes: PromoCode[];
  isLoading: boolean;
  onEditPromoCode: (id: string) => void;
  onDeletePromoCode: (promo: PromoCode) => void;
}

const PromoCodesTable: React.FC<PromoCodesTableProps> = ({
  promoCodes,
  isLoading,
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
    "PROMO CODE",
    "MINIMUM PURCHASE (THB)",
    "DISCOUNT TYPE",
    "COURSE INCLUDED",
    "UPDATED AT",
    "ACTION",
  ];

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
            {promoCodes.map((promo) => (
              <PromoRow
                key={promo.id}
                promo={promo}
                onEdit={onEditPromoCode}
                onDelete={() => onDeletePromoCode(promo)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromoCodesTable;