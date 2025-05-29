import React, { useState, useEffect } from 'react';

interface PromoCode {
  id: string;
  code: string;
  min_purchase_amount?: number | null;
  discount_type?: 'fixed' | 'percentage' | null;
  discount_value?: number | null;
}

interface PromoCodeSectionProps {
  initialPromoCodeId?: string | null;
  allPromoCodes: PromoCode[];
  onChange: (selectedPromoCode: PromoCode | null) => void;
  showError?: (title: string, description?: string) => void; // Optional error reporting
}

export const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
  initialPromoCodeId,
  allPromoCodes,
  onChange,
  showError
}) => {
  const [isActive, setIsActive] = useState(!!initialPromoCodeId);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(initialPromoCodeId || null);
  const [selectedPromoDetails, setSelectedPromoDetails] = useState<PromoCode | null>(null);

  useEffect(() => {
    setIsActive(!!initialPromoCodeId);
    setSelectedPromoId(initialPromoCodeId || null);
  }, [initialPromoCodeId]);

  useEffect(() => {
    if (selectedPromoId) {
      const promo = allPromoCodes.find(p => p.id === selectedPromoId);
      setSelectedPromoDetails(promo || null);
      if (isActive && promo) {
        onChange(promo);
      } else if (isActive && !promo && showError) {
        showError('Selected promo code not found in the list.');
        onChange(null); // Clear if not found but was active
      }
    } else {
      setSelectedPromoDetails(null);
      if (isActive) { // If active but no ID, means it was cleared
        onChange(null);
      }
    }
  }, [selectedPromoId, allPromoCodes, isActive, onChange, showError]);

  const handleCheckboxChange = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    if (!newIsActive) {
      setSelectedPromoId(null); // Clear selection when deactivating
      setSelectedPromoDetails(null);
      onChange(null); // Notify parent that promo is deactivated
    } else if (selectedPromoId) {
      // If activating and a promo was already selected, re-notify parent
      const promo = allPromoCodes.find(p => p.id === selectedPromoId);
      onChange(promo || null);
    } else {
      // Activating but no promo selected yet
      onChange(null);
    }
  };

  const handlePromoSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelectedId = e.target.value;
    if (newSelectedId === '') {
      setSelectedPromoId(null);
      setSelectedPromoDetails(null);
      onChange(null);
    } else {
      setSelectedPromoId(newSelectedId);
      // Details and onChange will be updated by the useEffect hook
    }
  };

  return (
    <div>
      <div className="space-y-4 bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="promo-code-active" // Changed id to be more specific
            className="w-5 h-5 text-blue-600 rounded"
            checked={isActive}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="promo-code-active" className="ml-2 text-sm font-medium">
            Apply Promo code
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="set-promo" className="block text-sm font-medium">
              Set promo code
            </label>
            <select
              id="set-promo"
              className={`w-full px-4 py-2 border rounded-md ${isActive ? 'bg-white' : 'bg-gray-200'}`}
              disabled={!isActive}
              value={selectedPromoId || ''}
              onChange={handlePromoSelectChange}
            >
              <option value="">Select a promo code</option>
              {allPromoCodes.map(promo => (
                <option key={promo.id} value={promo.id}>{promo.code}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="min-purchase" className="block text-sm font-medium">
              Minimum purchase amount (THB)
            </label>
            <input
              type="text"
              id="min-purchase"
              placeholder="-"
              className="w-full px-4 py-2 border rounded-md bg-gray-200"
              disabled
              value={selectedPromoDetails?.min_purchase_amount?.toString() || ''}
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="block text-sm font-medium">
            Discount type
          </label>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="discount-thb"
                  name="discount-type"
                  className="w-4 h-4"
                  disabled // Always disabled as it's informational
                  checked={selectedPromoDetails?.discount_type === 'fixed'}
                  readOnly
                />
                <label htmlFor="discount-thb" className="ml-2 text-sm">
                  Discount (THB)
                </label>
              </div>
              <input
                type="text"
                placeholder="-"
                className="w-24 px-2 py-1 border rounded-md bg-gray-200"
                disabled
                value={selectedPromoDetails?.discount_type === 'fixed' ? selectedPromoDetails.discount_value?.toString() || '' : ''}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="discount-percent"
                  name="discount-type" // Same name to ensure only one can be conceptually selected
                  className="w-4 h-4"
                  disabled // Always disabled
                  checked={selectedPromoDetails?.discount_type === 'percentage'}
                  readOnly
                />
                <label htmlFor="discount-percent" className="ml-2 text-sm">
                  Discount (%)
                </label>
              </div>
              <input
                type="text"
                placeholder="-"
                className="w-24 px-2 py-1 border rounded-md bg-gray-200"
                disabled
                value={selectedPromoDetails?.discount_type === 'percentage' ? selectedPromoDetails.discount_percentage?.toString() || '' : ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};