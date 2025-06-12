import React from "react";
import ConfirmModal from "@/components/ConfirmModal";

type Props = {
  isOpen: boolean;
  bundleName?: string;
  isWishlisted: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function BundleWishlistModal({
  isOpen,
  bundleName,
  isWishlisted,
  onClose,
  onConfirm,
}: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Wishlist Confirmation"
      message={
        isWishlisted
          ? `Do you want to remove ${bundleName} from your Wishlist?`
          : `Do you want to add ${bundleName} to your Wishlist?`
      }
      confirmText={isWishlisted ? "Remove" : "Add"}
      cancelText="Cancel"
      confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      cancelButtonClass="border border-orange-500 text-orange-500 hover:bg-orange-50"
    />
  );
}
