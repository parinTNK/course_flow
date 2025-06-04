"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../../admin/components/LoadingSpinner";
import { useCustomToast } from "@/components/ui/CustomToast";
import { useCheckPurchased } from "@/hooks/useCheckPurchased";
import { useCourse } from "@/hooks/useCourseNameAndPrice";
import { usePromoCode } from "@/hooks/usePromoCode";
import OrderSummary from "@/components/payment/OrderSummary";
import { CardForm } from "@/types/payment";
import axios from "axios";
import {
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  luhnCheck,
} from "@/utils/paymentUtils";
import InputField from "@/components/payment/InputField";
import { DISCOUNT_TYPE_FIXED,DISCOUNT_TYPE_PERCENT } from "@/types/promoCode";

// -------------------- Main Component --------------------
export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card");
  const [promoCode, setPromoCode] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const { user, loading: authLoading } = useAuth();
  const { success: toastSuccess, error: toastError } = useCustomToast();
  const params = useParams();
  const router = useRouter();

  const courseId = params.courseId as string;
  const alreadyPurchased = useCheckPurchased(courseId);

  // Custom hooks
  const {
    course,
    loading: isFetchingCourse,
    error: courseError,
  } = useCourse(courseId);
  const { promoResult, promoError, promoApplied, validatePromo, resetPromo } =
    usePromoCode();

  // React Hook Form
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CardForm>({ mode: "onSubmit" });

  // Watch and format card number and expiry
  const cardNumber = watch("cardNumber", "");
  const expiry = watch("expiry", "");

  useEffect(() => {
    setValue("cardNumber", formatCardNumber(cardNumber));
  }, [cardNumber, setValue]);

  useEffect(() => {
    setValue("expiry", formatExpiry(expiry));
  }, [expiry, setValue]);

  // Discount calculation
  let discount = 0;
  if (promoResult) {
    if (promoResult.discountType === DISCOUNT_TYPE_FIXED) {
      discount = promoResult.discountValue;
    } else if (promoResult.discountType === DISCOUNT_TYPE_PERCENT) {
      discount =
        course && promoResult.discountPercentage
          ? (course.price * promoResult.discountPercentage) / 100
          : 0;
    }
  }
  const displayDiscount = Math.round(discount * 100) / 100;
  const rawTotal = (course?.price ?? 0) - discount;
  const total = Math.round(rawTotal * 100) / 100;

  // Omise Token
  const createOmiseToken = async (cardData: any) => {
    return new Promise<string>((resolve, reject) => {
      if (typeof window === "undefined" || !window.Omise) {
        return reject("Omise.js not loaded");
      }
      window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_KEY as string);
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

  // Form submit
  const onSubmit = async (data: CardForm) => {
    if (!user) {
      toastError("User not found. Please login again.");
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
        expectedAmount: total,
        promoCode: promoCode,
      });

      const result = res.data;

      if (result.charge.status === "successful" && result.charge.paid) {
        router.push(`/payment/${courseId}/order-completed`);
      } else {
        router.push(`/payment/${courseId}/order-failed`);
      }
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        toastError(
          err.response.data.message +
            ` (Correct price: ${err.response.data.correctAmount} THB)`
        );
        return;
      }
      toastError(
        "Unable to process your request due to a system error. Please try again ",
        err.message
      );
    }
  };

  useEffect(() => {
    if (alreadyPurchased === true) {
      toastSuccess("You have already purchased this course");
      router.replace(`/course-detail/${courseId}`);
    }
  }, [alreadyPurchased, courseId, router, toastSuccess]);

  if (authLoading || isFetchingCourse || alreadyPurchased === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." className="" size="md" />
      </div>
    );
  }

  // Render
  return (
    <div className="flex flex-col mt-14">
      <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive" />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              className="text-[16px] text-[#2F5FAC] mb-8 flex items-center gap-2 hover:underline cursor-pointer font-semibold"
              onClick={() => router.replace(`/course-detail/${courseId}`)}
            >
              &larr; Back
            </button>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Payment Form */}
              <div>
                <h1 className="text-4xl font-semibold mb-10">
                  Enter payment info to start <br /> your subscription
                </h1>
                <p className="text-gray-500 mb-6 text-[16px]">
                  Select payment method
                </p>
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
                          className="space-y-6 md:px-5 pt-3"
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
                  <OrderSummary
                    courseName={course?.name}
                    price={course?.price}
                    promoCode={promoCode}
                    promoApplied={promoApplied}
                    promoError={promoError}
                    promoResult={promoResult}
                    discount={displayDiscount}
                    total={total}
                    paymentMethod={paymentMethod}
                    onPromoCodeChange={(v) => {
                      setPromoCode(v);
                      resetPromo();
                    }}
                    onApplyPromo={() => {
                      if (promoCode && course) {
                        validatePromo(promoCode, course.id, course.price);
                      }
                    }}
                    isPromoDisabled={promoApplied || !promoCode}
                    isSubmitting={isSubmitting}
                    onPlaceOrder={async () => {
                      if (paymentMethod === "card") {
                        if (formRef.current) {
                          formRef.current.requestSubmit();
                        }
                      } else {
                        const params = new URLSearchParams({
                          promoCode: promoCode || "",
                          amount: total.toString(),
                        });
                        router.push(
                          `/payment/${courseId}/qr-code?${params.toString()}`
                        );
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
