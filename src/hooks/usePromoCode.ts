// hooks/usePromoCode.ts
import { useState } from "react";
import axios from "axios";

export function usePromoCode() {
  const [promoResult, setPromoResult] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState(false);

  const validatePromo = async (
    promoCode: string,
    courseId: string,
    amount: number
  ) => {
    setPromoError(null);
    setPromoResult(null);
    try {
      const res = await axios.post("/api/promocodes/validate", {
        code: promoCode,
        courseId,
        amount,
      });
      if (res.data.valid) {
        setPromoResult(res.data);
        setPromoApplied(true);
      } else {
        setPromoError(res.data.message);
        setPromoApplied(false);
      }
    } catch (err: any) {
      setPromoError("Error validating promo code");
      setPromoApplied(false);
    }
  };

  const resetPromo = () => {
    setPromoResult(null);
    setPromoError(null);
    setPromoApplied(false);
  };

  return {
    promoResult,
    promoError,
    promoApplied,
    validatePromo,
    resetPromo,
  };
}
