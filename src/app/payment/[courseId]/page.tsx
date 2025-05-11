"use client";

import React, { useState, useEffect, useRef,ChangeEvent } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import NavBar from "@/components/nav";
import Footer from "@/components/footer";
import { useRouter } from "next/navigation";
import Script from "next/script";
import axios from "axios";

// -------------------- Types --------------------
type CardForm = {
  cardNumber: string;
  nameOnCard: string;
  expiry: string;
  cvv: string;
};

type Course = {
  id: string;
  name: string;
  price: number;
};


const MOCK_COURSE = {
  id: "123",
  name: "Service Design Essentials Course",
  subtotal: 3559,
  total: 3359,
};

// -------------------- Constants --------------------
const Discount = 200


// -------------------- Utility Functions --------------------
const formatCardNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 16);
  return numbers.replace(/(.{4})/g, "$1-").replace(/-$/, "");
};

const formatExpiry = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 4);
  if (numbers.length < 3) return numbers;
  return numbers.slice(0, 2) + "/" + numbers.slice(2);
};


// -------------------- Main Component --------------------
export default function PaymentPage() {
  // State
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  // Hooks
  const params = useParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

 // React Hook Form
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardForm>({
    mode: "onSubmit",
  });

// Derived
  const courseId = params.courseId as string;
  const total = (course?.price ?? 0) - (promoApplied ? Discount : 0)



  // -------------------- Effects --------------------
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`/api/course/${courseId}`);
        setCourse(res.data);
        console.log(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
          err.message ||
          "Failed to fetch course"
        );
      } 
    };
    fetchCourse();
  }, [courseId]);

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
            resolve(response.id); // token
          }
        }
      );
    });
  };

  // -------------------- Form Submit --------------------
  const onSubmit = async (data: CardForm) => {
    setError(null);
    try {
      if (paymentMethod === "card") {
        const [expMonth, expYear] = data.expiry.split("/");
        const token = await createOmiseToken({
          name: data.nameOnCard,
          number: data.cardNumber.replace(/\s/g, ""),
          expiration_month: expMonth,
          expiration_year: "20" + expYear,
          security_code: data.cvv,
        });

        const res = await axios.post("/api/payment/charge", {
          token,
          amount: course?.price,
          email: "user@email.com",  //wait to get from context
          courseId: course?.id,
          userId: "user-id", //wait to get from context
        });

        const result = res.data

        if (result.success) {
          router.push("/payment/order-completed");
        } else {
          router.push("/payment/order-failed");
        }

      } else {
        // router.push("/payment/order-completed");
      }
    } catch (err: any) {
      router.push("/payment/order-failed");
    }
  }

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive" />
      <NavBar
        user={{
          name: "Max Mayfield",
          avatarUrl: "https://i.pravatar.cc/150?img=45",
        }}
      />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 ">
          <div className="max-w-5xl mx-auto">
            <button
              className="text-sm text-blue-600 mb-8 flex items-center gap-1 hover:underline"
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
                            <label
                              htmlFor="cardNumber"
                              className="block text-sm font-medium mb-1"
                            >
                              Card number
                            </label>
                            <input
                              type="text"
                              placeholder="Card number"
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white ${
                                errors.cardNumber ? "border-red-500" : ""
                              }`}
                              {...register("cardNumber", {
                                required: "Card number is required",
                                pattern: {
                                  value: /^[0-9\s]{13,19}$/,
                                  message: "Invalid card number",
                                },
                              })}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setValue("cardNumber", formatCardNumber(e.target.value));
                              }}
                            />
                            {errors.cardNumber && (
                              <span className="text-xs text-red-500">
                                {errors.cardNumber.message}
                              </span>
                            )}
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
                          <div>
                            <label
                              htmlFor="cardNumber"
                              className="block text-sm font-medium mb-1"
                            >
                              Name on card
                            </label>
                            <input
                              type="text"
                              placeholder="Name on card"
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white ${
                                errors.nameOnCard ? "border-red-500" : ""
                              }`}
                              {...register("nameOnCard", {
                                required: "Name on card is required",
                              })}
                            />
                            {errors.nameOnCard && (
                              <span className="text-xs text-red-500">
                                {errors.nameOnCard.message}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4">
                            <div className="w-1/2">
                              <label
                                htmlFor="cardNumber"
                                className="block text-sm font-medium mb-1"
                              >
                                Expiry date
                              </label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white ${
                                  errors.expiry ? "border-red-500" : ""
                                }`}
                                {...register("expiry", {
                                  required: "Expiry date is required",
                                  pattern: {
                                    value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                                    message: "Invalid expiry date",
                                  },
                                })}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                  setValue("expiry", formatExpiry(e.target.value));
                                }}
                              />
                              {errors.expiry && (
                                <span className="text-xs text-red-500">
                                  {errors.expiry.message}
                                </span>
                              )}
                            </div>
                            <div className="w-1/2">
                              <label
                                htmlFor="cardNumber"
                                className="block text-sm font-medium mb-1"
                              >
                                CVV
                              </label>
                              <input
                                type="text"
                                placeholder="CVV"
                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white ${
                                  errors.cvv ? "border-red-500" : ""
                                }`}
                                {...register("cvv", {
                                  required: "CVV is required",
                                  pattern: {
                                    value: /^[0-9]{3,4}$/,
                                    message: "Invalid CVV",
                                  },
                                })}
                              />
                              {errors.cvv && (
                                <span className="text-xs text-red-500">
                                  {errors.cvv.message}
                                </span>
                              )}
                            </div>
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
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="border rounded-md px-3 py-3 text-sm flex-1"
                          disabled={promoApplied}
                        />
                        <button
                          className="bg-gray-100 text-gray-600 px-5 py-3 rounded-md text-sm font-medium cursor-pointer"
                          disabled={promoApplied || !promoCode}
                          onClick={() => setPromoApplied(true)}
                          type="button"
                        >
                          Apply
                        </button>
                      </div>
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
                          <span className="text-[#646D89]">
                                    {Discount}
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
                      {/* ปุ่ม Place order เดียว ใช้ร่วมกัน */}
                      <button
                        className="w-full bg-[#2F5FAC] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
                        disabled={isSubmitting}
                        onClick={async () => {
                          if (paymentMethod === "card") {
                            // trigger form submit
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
      <Footer />
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