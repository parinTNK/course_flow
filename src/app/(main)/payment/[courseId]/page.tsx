"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Script from "next/script";
import axios from "axios";
import { Course, CardForm } from "@/types/payment";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../../admin/components/LoadingSpinner";
import { useCustomToast } from "@/components/ui/CustomToast"

// -------------------- Validate Functions --------------------
const luhnCheck = (num: string) => {
  let arr = (num + "")
    .split("")
    .reverse()
    .map((x) => parseInt(x));
  let lastDigit = arr.shift()!;
  let sum = arr.reduce(
    (acc, val, i) =>
      i % 2 === 0 ? acc + ((val *= 2) > 9 ? val - 9 : val) : acc + val,
    0
  );
  return (sum + lastDigit) % 10 === 0;
};

const formatCardNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 19);
  return numbers.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 4);
  if (numbers.length < 3) return numbers;
  return numbers.slice(0, 2) + "/" + numbers.slice(2);
};

const isExpiryValid = (expiry: string) => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return false;
  const [mm, yy] = expiry.split("/");
  const month = parseInt(mm, 10);
  const year = parseInt("20" + yy, 10);
  const now = new Date();
  const exp = new Date(year, month - 1, 1);
  return exp >= new Date(now.getFullYear(), now.getMonth(), 1);
};

// -------------------- Main Component --------------------
export default function PaymentPage() {
  // State
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card");
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [isFetchingCourse, setIsFetchingCourse] = useState(false);
  const [isFetchingPromo, setIsFetchingPromo] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoResult, setPromoResult] = useState<null | {
    discountType: string;
    discountValue: number;
    discountPercentage: number | null;
    promoCodeId: string;
    message: string;
  }>(null);
  const { user,loading: authLoading } = useAuth();
  const { success, error: toastError } = useCustomToast();
  console.log(authLoading)

  // Hooks
  const params = useParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // React Hook Form
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CardForm>({
    mode: "onSubmit",
  });

  // Derived
  const courseId = params.courseId as string;

  // -------------------- Effects --------------------
  useEffect(() => {
    setIsFetchingCourse(true);
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`/api/course/${courseId}`);
        setCourse(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.error || err.message || "Failed to fetch course"
        );
      }finally {
        setIsFetchingCourse(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // -------------------- Promo Code Validate --------------------
  const handleApplyPromo = async () => {
    setPromoError(null);
    setPromoResult(null);
    setIsFetchingPromo(true);
    if (!promoCode || !course) return;
    try {
      const res = await axios.post("/api/promocodes/validate", {
        code: promoCode,
        courseId: course.id,
        amount: course.price,
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
    }finally {
      setIsFetchingPromo(false);
    }
  };

  // -------------------- Discount Calculation --------------------
  let discount = 0;
  if (promoResult) {
    if (promoResult.discountType === "THB") { //Clean code need to change to constant or enum
      discount = promoResult.discountValue;
    } else if (promoResult.discountType === "percentage") {
      discount =
        course && promoResult.discountPercentage
          ? (course.price * promoResult.discountPercentage) / 100
          : 0;
    }
  }

  const total = (course?.price ?? 0) - discount;

  // -------------------- Omise Token --------------------
  const createOmiseToken = async (cardData: any) => {
    return new Promise<string>((resolve, reject) => {
      if (typeof window === "undefined" || !window.Omise) {
        return reject("Omise.js not loaded");
      }
      window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_KEY as string); //public key
      window.Omise.createToken(
        "card",
        cardData,
        (statusCode: number, response: any) => {
          if (response.object === "error") {
            reject(response.message);
          } else {
            resolve(response.id);
          }
        }
      );
    });
  };

  // Watch and format card number and expiry
  const cardNumber = watch("cardNumber", "");
  const expiry = watch("expiry", "");

  React.useEffect(() => {
    setValue("cardNumber", formatCardNumber(cardNumber));
  }, [cardNumber, setValue]);

  React.useEffect(() => {
    setValue("expiry", formatExpiry(expiry));
  }, [expiry, setValue]);

  // -------------------- Form Submit --------------------
  const onSubmit = async (data: CardForm) => {
    setError(null);

    if (!user) {
      setError("User not found. Please login again.");
      return;
    }

    try {
      const [expMonth, expYear] = data.expiry.split("/");
      const token = await createOmiseToken({
        name: data.nameOnCard,
        number: data.cardNumber.replace(/\s/g, ""),
        expiration_month: expMonth,
        expiration_year: "20" + expYear,
        security_code: data.cvv,
      });

      const res = await axios.post("/api/payment/create", {
        token,
        amount: total,
        courseId: course?.id,
        userId: user?.user_id,
        courseName: course?.name,
        userName: user?.full_name,
        promoCode: promoCode,
      });

      const result = res.data;

      if (result.charge.status === "successful" && (result.charge.paid)) {
        router.push(`/payment/${courseId}/order-completed`);
      } else {
        router.push(`/payment/${courseId}/order-failed`);  //business logic error go to order failed
      }
    } catch (err: any) {
      toastError("Unable to process your request due to a system error. Please try again ", err.message); //system error
    }
  };

  if (authLoading || isFetchingCourse || isFetchingPromo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." className = '' size="md" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">
          Please login to continue.
        </div>
      </div>
    );
  }

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive" />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 ">
          <div className="max-w-5xl mx-auto">
            <button
              className="text-sm text-blue-600 mb-8 flex items-center gap-1 hover:underline cursor-pointer"
              onClick={() => window.history.back()}
            >
              &larr; Back
            </button>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Payment Form */}
              <div className="">
                <h1 className="text-2xl font-semibold mb-10">
                  Enter payment info to start your subscription
                </h1>
                <p className="text-gray-500 mb-6">Select payment method</p>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="space-y-4 ">
                    {/* Card Payment */}
                    <div
                      className={`px-6${
                        paymentMethod === "card"
                          ? " border rounded-xl bg-[#F1F2F6] py-6"
                          : ""
                      }`}
                    >
                      <label className="flex items-center mb-4 cursor-pointer ">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "card"}
                          onChange={() => setPaymentMethod("card")}
                          className="accent-blue-600 mr-2"
                        />
                        <span className="font-medium text-[#424C6B]">
                          Credit card / Debit card
                        </span>
                      </label>
                      <div className="flex flex-row md:pr-15">
                        <form
                          ref={formRef}
                          className="space-y-4 md:px-5 pt-3"
                          onSubmit={handleSubmit(onSubmit)}
                          autoComplete="off"
                        >
                          <div>
                            <InputField
                              label="Card number"
                              placeholder="Card number"
                              className="w-full"
                              error={errors.cardNumber?.message}
                              type="text"
                              maxLength={19 + 3}
                              {...register("cardNumber", {
                                required: "Card number is required",
                                validate: {
                                  isNumber: (v) =>
                                    /^\d{13,19}$/.test(v.replace(/\s/g, "")) ||
                                    "Card number must be 13-19 digits",
                                  luhn: (v) =>
                                    luhnCheck(v.replace(/\s/g, "")) ||
                                    "Invalid card number",
                                },
                              })}
                            />
                            <div className="md:hidden flex flex-row gap-2">
                              <img
                                src="/card-visa.svg"
                                alt="Visa"
                                className="h-12 w-12"
                              />
                              <img
                                src="/card-mastercard.svg"
                                alt="Mastercard"
                                className="h-12 w-12"
                              />
                            </div>
                          </div>
                          <InputField
                            label="Name on card"
                            placeholder="Name on card"
                            className="w-full"
                            error={errors.nameOnCard?.message}
                            type="text"
                            {...register("nameOnCard", {
                              required: "Name on card is required",
                              pattern: {
                                value: /^[A-Za-z\s]+$/,
                                message: "Name must be alphabet only",
                              },
                            })}
                          />

                          <div className="flex gap-4">
                            <InputField
                              label="Expiry date"
                              placeholder="MM/YY"
                              className="w-1/2"
                              error={errors.expiry?.message}
                              type="text"
                              maxLength={5}
                              {...register("expiry", {
                                required: "Expiry date is required",
                                pattern: {
                                  value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                                  message: "Invalid expiry date",
                                },
                                validate: {
                                  notExpired: (v) =>
                                    isExpiryValid(v) || "Card has expired",
                                },
                              })}
                            />
                            <InputField
                              label="CVV"
                              placeholder="CVV"
                              className="w-1/2"
                              error={errors.cvv?.message}
                              type="text"
                              maxLength={4}
                              {...register("cvv", {
                                required: "CVV is required",
                                pattern: {
                                  value: /^[0-9]{3,4}$/,
                                  message: "Invalid CVV",
                                },
                              })}
                            />
                          </div>
                          {error && (
                            <div className="text-red-500 text-sm mb-2">
                              {error}
                            </div>
                          )}
                        </form>
                        <div className="hidden md:flex flex-row gap-2 mt-8">
                          <img
                            src="/card-visa.svg"
                            alt="Visa"
                            className="h-12 w-12"
                          />
                          <img
                            src="/card-mastercard.svg"
                            alt="Mastercard"
                            className="h-12 w-12"
                          />
                        </div>
                      </div>
                    </div>
                    {/* QR Payment */}
                    <div
                      className={`px-6 ${
                        paymentMethod === "qr"
                          ? "border rounded-xl bg-[#F1F2F6] py-6"
                          : ""
                      }`}
                    >
                      <label className="flex items-center cursor-pointer w-full">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "qr"}
                          onChange={() => setPaymentMethod("qr")}
                          className="accent-blue-600 mr-2"
                        />
                        <span className="font-medium text-gray-800">
                          QR Payment
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="w-full md:w-[350px]">
                    <div className="bg-white rounded-xl shadow p-6">
                      <h2 className="text-md font-semibold mb-4 text-[#F47E20]">
                        Summary
                      </h2>
                      <div className="mb-2">
                        <div className="text-md text-[#646D89]">
                          Subscription
                        </div>
                        <div className="text-xl font-medium">
                          {course?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Promo code"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoApplied(false);
                            setPromoResult(null);
                            setPromoError(null);
                          }}
                          className="border rounded-md px-3 py-3 text-sm flex-1"
                        />
                        <button
                          className={`px-5 py-3 rounded-md text-sm font-medium cursor-pointer
                            ${
                              promoCode
                                ? "bg-[#2F5FAC] text-white"
                                : "bg-[#D6D9E4] text-[#9AA1B9]"
                            }`}
                          disabled={promoApplied || !promoCode}
                          onClick={handleApplyPromo}
                          type="button"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && (
                        <div className="text-red-500 text-sm mb-2">
                          {promoError}
                        </div>
                      )}
                      <div className="flex justify-between text-sm mb-1">
                        <span className="">Subtotal</span>
                        <span className="text-[#646D89]">
                          {course?.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {promoApplied && (
                        <div className="flex justify-between text-sm mb-1">
                          <span className="">Discount</span>
                          <span className="text-[#9B2FAC]">
                            {discount !== 0 ? <span> - </span> : ""}
                            {discount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm mb-1">
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
                        onClick={async () => {
                          if (paymentMethod === "card") {
                            if (formRef.current) {
                              formRef.current.requestSubmit();
                            }
                          } else {
                            router.push(`/payment/${courseId}/qr-code`);
                          }
                        }}
                      >
                        {isSubmitting ? "Processing..." : "Place order"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  className?: string;
};

const InputField = React.forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...props }, ref) => (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        ref={ref}
        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white ${
          error ? "border-red-500" : ""
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
);

InputField.displayName = "InputField";
