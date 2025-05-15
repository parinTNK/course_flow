"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

export default function QRCodePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`/api/course/${courseId}`);
        setAmount(res.data.price);
      } catch (err: any) {
        setError("Failed to fetch course price");
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);


  useEffect(() => {
    const createQR = async () => {
      if (!amount) return;
      setError(null);
      try {
        const res = await axios.post("/api/payment/qr", {
          amount,
          courseId,
        });
        setQrImage(res.data.qr_image);
        setChargeId(res.data.charge.id);
        setStatus(res.data.charge.status);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to create QR payment"
        );
      }
    };
    if (amount) createQR();
  }, [amount, courseId]);

  useEffect(() => {
    if (!chargeId) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/payment/qr-status?chargeId=${chargeId}`);
        setStatus(res.data.status);
        if (res.data.status === "successful") {
          clearInterval(interval);
          router.push(`/payment/${courseId}/order-completed`);
        }
        if (res.data.status === "failed") {
          clearInterval(interval);
          router.push(`/payment/${courseId}/order-failed`);
        }
      } catch (err) {
      }
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

  if (!qrImage || !amount || !chargeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div>Generating QR code...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-2 md:px-0">
      <div className="w-full max-w-md md:max-w-lg mx-auto">
        <button
          className="text-sm text-blue-600 mb-4 flex items-center gap-1 hover:underline"
          onClick={() => router.back()}
        >
          &larr; Back
        </button>
        <div className="bg-white rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-1">Scan QR code</h2>
          <div className="text-gray-400 text-sm mb-2">
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
