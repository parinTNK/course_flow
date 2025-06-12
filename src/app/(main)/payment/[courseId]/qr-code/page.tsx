"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../../../admin/components/LoadingSpinner";
import { useCheckPurchased } from "@/hooks/useCheckPurchased";
import { useCustomToast } from "@/components/ui/CustomToast";

export default function QRCodePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const searchParams = useSearchParams();

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState<string>("");

  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const alreadyPurchased = useCheckPurchased(courseId);
  const { success: toastSuccess, error: toastError } = useCustomToast();

  useEffect(() => {
    setAmount(Number(searchParams.get("amount")));
    setPromoCode(searchParams.get("promoCode") || "");
  }, [searchParams]);

  useEffect(() => {
    const createQR = async () => {
      if (alreadyPurchased === true || alreadyPurchased === null) return;
      if (!amount) return;
      setError(null);
      try {
        const res = await axios.post("/api/payment/qr", {
          courseId: courseId,
          userId: user?.user_id,
          userName: user?.full_name,
          promoCode: promoCode,
          expectedAmount: amount,
        });
        setQrImage(res.data.qr_image);
        setChargeId(res.data.charge.id);
        setStatus(res.data.charge.status);
      } catch (err: any) {
        if (err.response && err.response.status === 409) {
          toastError(
            err.response.data.message +
              ` (Correct price: ${err.response.data.correctAmount} THB)`
          );
          router.replace(`/payment/${courseId}`);
          return;
        }
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to create QR payment"
        );
      }
    };
    if (amount) createQR();
  }, [amount, alreadyPurchased]);

  useEffect(() => {
    if (!chargeId) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `/api/payment/qr-status?chargeId=${chargeId}`
        );
        setStatus(res.data.status);
        if (res.data.status === "successful") {
          clearInterval(interval);
          setIsPaymentCompleted(true);
          router.push(`/payment/${courseId}/order-completed`);
        }
        if (res.data.status === "failed") {
          clearInterval(interval);
          router.push(`/payment/${courseId}/order-failed`);
        }
      } catch (err) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [chargeId, courseId, router]);

  const handleSaveQR = () => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = "qr-code.png";
    link.click();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  useEffect(() => {
    if (alreadyPurchased === true && !isPaymentCompleted) {
      toastSuccess("You have already purchased this course");
      router.replace(`/course-detail/${courseId}`);
    }
  }, [alreadyPurchased, courseId, router, isPaymentCompleted]);

  if (!qrImage || !amount || !chargeId || alreadyPurchased === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Generating QR code..." className="" size="md" />
      </div>
    );
  }

  return (
    <div className="my-40 flex flex-col items-center justify-center px-2 md:px-0">
      <div className="w-full max-w-md md:max-w-lg mx-auto">
        <button
          className="text-[16px] text-[#2F5FAC] mb-8 flex items-center gap-2 hover:underline cursor-pointer font-semibold"
          onClick={() => router.replace(`/payment/${courseId}`)}
        >
          &larr; Back
        </button>
        <div className="bg-white rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-1">
            Scan QR code
          </h2>
          <div className="text-gray-400 text-sm mb-2 text-center">
            Reference no. {chargeId}
          </div>
          <div className="text-2xl md:text-3xl font-semibold text-[#F47E20] mb-4">
            THB {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <img
            src={qrImage}
            alt="QR PromptPay"
            className="w-48 h-48 md:w-64 md:h-64 mb-6 border border-gray-200 rounded"
          />
          <button
            className="w-full md:w-2/3 bg-[#2F5FAC] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
            onClick={handleSaveQR}
          >
            Save QR image
          </button>
        </div>
      </div>
    </div>
  );
}
