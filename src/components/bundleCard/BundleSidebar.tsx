import React from "react";
import Link from "next/link";
import { ButtonT } from "@/components/ui/ButtonT";

type Props = {
  isAuthenticated: boolean;
  isPurchased: boolean;
  isWishlisted: boolean;
  bundleId: string;
  bundleName?: string;
  description?: string;
  price?: number;
  coursesCount?: number;
  totalLearningTime?: number;
  onPurchaseClick: () => void;
  onWishlistClick: () => void;
};

export default function BundleSidebar({
  isAuthenticated,
  isPurchased,
  isWishlisted,
  bundleId,
  bundleName,
  description,
  price,
  coursesCount,
  totalLearningTime,
  onPurchaseClick,
  onWishlistClick,
}: Props) {
  return (
    <div className="sticky top-30 p-6 border rounded-lg bg-white z-10">
      <span className="text-orange-500">Bundle Package</span>
      <h1 className="text-2xl font-bold mb-2">{bundleName || "Bundle Name"}</h1>
      <p className="text-gray-600 mb-4 line-clamp-3 break-words">
        {description || "No description available."}
      </p>

      {/* Bundle Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Courses Included:</span>
          <span className="font-semibold">{coursesCount || 0} Courses</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Learning Time:</span>
          <span className="font-semibold">{totalLearningTime || 0} Hours</span>
        </div>
      </div>

      <p className="text-2xl font-bold mb-6">
        {typeof price === "number"
          ? `THB ${price.toLocaleString()}`
          : "Loading..."}
      </p>

      {isAuthenticated ? (
        isPurchased ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm font-medium mb-2">
              ✅ Bundle Purchased
            </p>
            <p className="text-green-600 text-xs">
              You have access to all courses in this bundle
            </p>
          </div>
        ) : (
          <>
            <ButtonT
              variant="Secondary"
              className="w-full mb-3"
              onClick={onWishlistClick}
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </ButtonT>
            <ButtonT
              variant="primary"
              className="w-full"
              onClick={onPurchaseClick}
              aria-label="Purchase bundle"
            >
              Subscribe This Package
            </ButtonT>
          </>
        )
      ) : (
        <>
          <Link href={`/login?redirect=/bundle-detail/${bundleId}`}>
            <ButtonT variant="Secondary" className="block w-full mb-3 py-2">
              Add to Wishlist
            </ButtonT>
          </Link>
          <Link href={`/login?redirect=/bundle-detail/${bundleId}`}>
            <ButtonT variant="primary" className="block w-full py-2">
              Subscribe This Package
            </ButtonT>
          </Link>
        </>
      )}

      {/* Bundle Benefits */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-3">Bundle Benefits:</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Access to all courses in bundle
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Lifetime access
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Save money compared to individual purchase
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Certificate of completion
          </li>
        </ul>
      </div>
    </div>
  );
}
