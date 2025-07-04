import React from "react";
import ConfirmModal from "@/components/ConfirmModal";

type Props = {
  isOpen: boolean;
  bundleName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function BundlePurchaseModal({
  isOpen,
  bundleName,
  onClose,
  onConfirm,
}: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmation"
      message={`Are you sure you want to purchase ${bundleName} bundle?`}
      confirmText="Yes, I want to purchase"
      cancelText="No, I don't"
      confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      cancelButtonClass="border border-orange-500 text-orange-500 hover:bg-orange-50"
    />
  );
}
