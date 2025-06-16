import React from "react";
import { ImageOff } from "lucide-react";

type Props = {
  imageUrl?: string;
  bundleName?: string;
};

export default function BundleImage({ imageUrl, bundleName }: Props) {
  if (!imageUrl) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 text-sm gap-2 mb-6">
        <ImageOff className="w-10 h-10" />
        <span>Image not found</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden mb-6">
      <img
        src={imageUrl}
        alt={bundleName || "Bundle preview"}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
