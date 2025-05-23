import React from "react";
import ConfirmModal from "@/components/ConfirmModal";

type Props = {
  isOpen: boolean;
  courseName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function SubscribeModal({
  isOpen,
  courseName,
  onClose,
  onConfirm,
}: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmation"
      message={`Are you sure you want to subscribe to ${courseName} course?`}
      confirmText="Yes, I want to subscribe"
      cancelText="No, I don't"
      confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      cancelButtonClass="border border-orange-500 text-orange-500 hover:bg-orange-50"
/>
  );
}
