// components/payment/OrderSummary.tsx
import React from "react";

interface OrderSummaryProps {
  courseName?: string;
  price?: number;
  promoCode: string;
  promoApplied: boolean;
  promoError: string | null;
  promoResult: any;
  discount: number;
  total: number;
  paymentMethod: string;
  onPromoCodeChange: (v: string) => void;
  onApplyPromo: () => void;
  isPromoDisabled: boolean;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  courseName,
  price,
  promoCode,
  promoApplied,
  promoError,
  promoResult,
  discount,
  total,
  paymentMethod,
  onPromoCodeChange,
  onApplyPromo,
  isPromoDisabled,
  isSubmitting,
  onPlaceOrder,
}) => (
  <div className="w-full md:w-[350px]">
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-sm mb-4 text-[#F47E20]">Summary</h2>
      <div className="mb-2">
        <div className="text-[16px] text-[#646D89] mb-2">Subscription</div>
        <div className="text-xl font-medium mb-4">{courseName}</div>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Promo code"
          value={promoCode}
          onChange={(e) => onPromoCodeChange(e.target.value)}
          className="border rounded-md px-3 py-3 text-sm flex-1"
        />
        <button
          className={`px-5 py-3 rounded-md text-sm font-medium cursor-pointer
            ${
              promoCode
                ? "bg-[#2F5FAC] text-white"
                : "bg-[#D6D9E4] text-[#9AA1B9]"
            }`}
          disabled={isPromoDisabled}
          onClick={onApplyPromo}
          type="button"
        >
          Apply
        </button>
      </div>
      {promoError && (
        <div className="text-red-500 text-sm mb-4">{promoError}</div>
      )}
      <div className="flex justify-between text-sm mb-4">
        <span className="">Subtotal</span>
        <span className="text-[#646D89]">
          {price?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>
      {promoApplied && (
        <div className="flex justify-between text-sm mb-4">
          <span className="">Discount</span>
          <span className="text-[#9B2FAC]">
            {discount !== 0 ? <span> - </span> : ""}
            {discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
      <div className="flex justify-between gap-5 text-sm mb-4">
        <span className="">Payment method</span>
        <span className="text-[#646D89]">
          {paymentMethod === "card"
            ? "Credit card / Debit card"
            : "QR Payment"}
        </span>
      </div>
      <div className="my-4" />
      <div className="flex justify-between items-center mb-4">
        <span className="">Total</span>
        <span className="text-xl font-bold text-[#646D89]">
          THB{" "}
          {total.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>
      <button
        className="w-full bg-[#2F5FAC] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
        disabled={isSubmitting}
        onClick={onPlaceOrder}
      >
        {isSubmitting ? "Processing..." : "Place order"}
      </button>
    </div>
  </div>
);

export default OrderSummary;
