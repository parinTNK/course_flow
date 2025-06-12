import React, { useState, useEffect } from 'react';

export interface PromoCode {
  id: string;
  code: string;
  min_purchase_amount?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
}

interface PromoCodeSectionProps {
  selectedPromoCodeId?: string | null;
  courseId?: string | null;
  mode?: 'create' | 'edit';
  onChange?: (promoCodeId: string | null) => void;
  onMinPurchaseChange?: (minPurchase: number | null) => void;
  coursePrice?: number;
}

export const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
  selectedPromoCodeId = null,
  courseId = null,
  mode = 'create',
  onChange,
  onMinPurchaseChange,
  coursePrice = 0
}) => {
  const [isActive, setIsActive] = useState(!!selectedPromoCodeId);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

  useEffect(() => {
    fetchPromoCodes();
  }, [courseId, mode]);

  useEffect(() => {
    if (selectedPromoCodeId && promoCodes.length > 0) {
      const promo = promoCodes.find(p => p.id === selectedPromoCodeId);
      setSelectedPromo(promo || null);
      setIsActive(true);
      
      const selectedPromoCodes = promoCodes.filter(p => p.id === selectedPromoCodeId);
      const maxMinPurchase = selectedPromoCodes.length > 0 
        ? Math.max(...selectedPromoCodes.map(p => p.min_purchase_amount || 0))
        : null;
      
      onMinPurchaseChange?.(maxMinPurchase);
    } else {
      setSelectedPromo(null);
      setIsActive(false);
      onMinPurchaseChange?.(null);
    }
  }, [selectedPromoCodeId, promoCodes, onMinPurchaseChange]);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: mode
      });
      
      if (courseId && mode === 'edit') {
        params.append('courseId', courseId);
      }

      const response = await fetch(`/api/admin/promo-codes-for-course?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      } else {
        console.error('Failed to fetch promo codes');
        setPromoCodes([]);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setPromoCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    
    if (!newIsActive) {
      setSelectedPromo(null);
      onChange?.(null);
      onMinPurchaseChange?.(null);
    }
  };

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promoCodeId = e.target.value;
    
    if (promoCodeId) {
      const promo = promoCodes.find(p => p.id === promoCodeId);
      setSelectedPromo(promo || null);
      onChange?.(promoCodeId);
      
      onMinPurchaseChange?.(promo?.min_purchase_amount || null);
    } else {
      setSelectedPromo(null);
      onChange?.(null);
      onMinPurchaseChange?.(null);
    }
  };

  return (
    <div>
      <div className="space-y-4 bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="promo-code-active"
            className="w-5 h-5 text-blue-600 rounded"
            checked={isActive}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="promo-code-active" className="ml-2 text-sm font-medium">
            Apply Promo code
          </label>
        </div>

        {/* Warning message for existing courses with promocode minimum higher than current price */}
        {isActive && selectedPromo && selectedPromo.min_purchase_amount && 
         coursePrice > 0 && coursePrice < selectedPromo.min_purchase_amount && mode === 'edit' && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-sm">
            <strong>Warning:</strong> Current course price ({coursePrice.toLocaleString()} THB) is below the minimum purchase amount required for this promocode ({selectedPromo.min_purchase_amount.toLocaleString()} THB). Please adjust the course price to at least {selectedPromo.min_purchase_amount.toLocaleString()} THB.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="set-promo" className="block text-sm font-medium">
              Set promo code
            </label>
            <select
              id="set-promo"
              className={`w-full px-4 py-2 border rounded-md ${isActive ? 'bg-white' : 'bg-gray-200'}`}
              disabled={!isActive || loading}
              value={selectedPromo?.id || ''}
              onChange={handlePromoCodeChange}
            >
              <option value="">
                {loading ? 'Loading...' : 'Select a promo code'}
              </option>
              {promoCodes.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.code}
                </option>
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
              value={selectedPromo?.min_purchase_amount?.toLocaleString() || ''}
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
                  disabled
                  readOnly
                  checked={selectedPromo?.discount_type === 'Fixed amount'}
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
                value={
                  selectedPromo?.discount_type === 'Fixed amount' 
                    ? selectedPromo?.discount_value?.toLocaleString() || ''
                    : ''
                }
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="discount-percent"
                  name="discount-type"
                  className="w-4 h-4"
                  disabled
                  readOnly
                  checked={selectedPromo?.discount_type === 'Percent'}
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
                value={
                  selectedPromo?.discount_type === 'Percent' 
                    ? `${selectedPromo?.discount_value || ''}%`
                    : ''
                }
              />
            </div>
            {selectedPromo && selectedPromo.discount_value != null && selectedPromo.discount_type && coursePrice > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Price after discount:</span>
                </div>
                <input
                  type="text"
                  className="w-32 px-2 py-1 border rounded-md bg-gray-200"
                  disabled
                  value={(() => {
                    let priceAfterDiscount = 0;
                    if (selectedPromo.discount_type === 'Fixed amount') {
                      priceAfterDiscount = coursePrice - selectedPromo.discount_value;
                    } else if (selectedPromo.discount_type === 'Percent') {
                      priceAfterDiscount = coursePrice * (1 - selectedPromo.discount_value / 100);
                    }
                    return priceAfterDiscount <= 0
                      ? 'Free'
                      : `${priceAfterDiscount.toLocaleString()} THB`;
                  })()}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};