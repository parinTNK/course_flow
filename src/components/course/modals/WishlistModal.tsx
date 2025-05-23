import React from "react";
import ConfirmModal from "@/components/ConfirmModal";

type Props = {
  isOpen: boolean;
  courseName?: string;
  isWishlisted: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function WishlistModal({
  isOpen,
  courseName,
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
          ? `Do you want to remove ${courseName} from your Wishlist?`
          : `Do you want to add ${courseName} to your Wishlist?`
      }
      confirmText={isWishlisted ? "Remove" : "Add"}
      cancelText="Cancel"
      confirmButtonClass="bg-blue-600 text-white hover:bg-blue-700"
      cancelButtonClass="border border-orange-500 text-orange-500 hover:bg-orange-50"
    />
  );
}
