"use client";

import { useRouter,useParams } from "next/navigation";
import {ButtonT} from "@/components/ui/ButtonT";

export default function PaymentFailedPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white rounded-2xl shadow-lg px-10 py-10 md:max-w-1/2 mx-4 w-full flex flex-col items-center">
        <div className = "flex flex-col items-center gap-5 mb-6">
            <img src="/payment-failed.svg" alt="payment failed" className="w-[65px] h-[65px]" />
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                Payment failed.
                </h2>
                <p className="text-gray-500 mb-8 text-center">
                Please check your payment details and try again.
                </p>
            </div>
        </div>
        <div className="flex md:flex-row flex-col justify-center md:w-1/2 w-full">
          <ButtonT variant="primary" className="w-full cursor-pointer" onClick={() => router.push(`/payment/${courseId}`)}>Back to Payment</ButtonT>
        </div>
      </div>
    </div>
  );
}
