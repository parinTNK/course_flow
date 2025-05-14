import React, {useState} from 'react';
// TODO: set validation error
export const PromoCodeSection: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  const handleCheckboxChange = () => {
    setIsActive(!isActive);
  };
  return (
    <div>
      <div className="space-y-4 bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="promo-code"
            className="w-5 h-5 text-blue-600 rounded"
            onChange={handleCheckboxChange}
          />
          <label htmlFor="promo-code" className="ml-2 text-sm font-medium">
            Promo code
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="set-promo" className="block text-sm font-medium">
              Set promo code
            </label>
            <select
              id="set-promo"
              className={`w-full px-4 py-2 border rounded-md ${isActive ? 'bg-white' : ''}`}
              disabled={!isActive}
            >
                {/* //TODO: Map data from the server here */}
              <option value="promo1">Promo Code 1</option>
              <option value="promo2">Promo Code 2</option>
              <option value="promo3">Promo Code 3</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="min-purchase" className="block text-sm font-medium">
              Minimum purchase amount (THB)
            </label>
            <input
              type="text"
              id="min-purchase"
              placeholder="0"
              className="w-full px-4 py-2 border rounded-md"
              disabled
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="block text-sm font-medium">
            Select discount type
          </label>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="discount-thb"
                  name="discount-type"
                  className="w-4 h-4"
                  disabled={!isActive}
                />
                <label htmlFor="discount-thb" className="ml-2 text-sm">
                  Discount (THB)
                </label>
              </div>
              <input
                type="text"
                placeholder=""
                className="w-24 px-2 py-1 border rounded-md"
                disabled
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="discount-percent"
                  name="discount-type"
                  className="w-4 h-4"
                  disabled={!isActive}
                />
                <label htmlFor="discount-percent" className="ml-2 text-sm">
                  Discount (%)
                </label>
              </div>
              <input
                type="text"
                placeholder=""
                className="w-24 px-2 py-1 border rounded-md"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};