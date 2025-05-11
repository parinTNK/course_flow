"use client";

import { useRouter } from "next/navigation";
import {ButtonT} from "@/components/ui/ButtonT";

export default function PaymentCompletedPage({
  courseId = "123",
}: {
  courseId?: string;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white rounded-2xl shadow-lg px-10 py-10 md:max-w-1/2 mx-4 w-full flex flex-col items-center">
        <div className = "flex flex-col items-center gap-5 mb-6">
            <img src="/payment-completed.svg" alt="payment successfully" className="w-[65px] h-[65px]" />
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                Thank you for subscribing.
                </h2>
                <p className="text-gray-500 mb-8 text-center">
                Your payment is complete. You can start learning the course now.
                </p>
            </div>
        </div>
        <div className="flex md:flex-row flex-col gap-4 justify-center w-full">
          <ButtonT variant="Secondary" className="w-full" onClick={() => router.push(`/courses/${courseId}/learn`)}>View Course detail</ButtonT>
          <ButtonT variant="primary" className="w-full" onClick={() => router.push(`/courses/${courseId}/learn`)}>View Course detail</ButtonT>
        </div>
      </div>
    </div>
  );
}
