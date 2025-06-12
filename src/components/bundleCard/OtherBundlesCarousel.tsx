import React from "react";
import Link from "next/link";
import BundleCard from "@/components/bundleCard/BundleCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Props = {
  bundles: any[];
};

export default function OtherBundlesCarousel({ bundles }: Props) {
  if (!bundles.length) return null;

  return (
    <div className="mb-12">
      <hr />
      <h2 className="text-center text-2xl font-bold my-6">
        Other Interesting Package
      </h2>
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-1 md:-ml-2">
          {bundles.map((bundle) => (
            <CarouselItem key={bundle.id} className="pl-1 md:pl-2 md:basis-1/3">
              <div className="scale-95 px-6">
                <Link href={`/bundle-detail/${bundle.id}`}>
                  <BundleCard bundle={bundle} />
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-4 -translate-y-1/2 bg-white shadow-lg" />
        <CarouselNext className="absolute -right-4 -translate-y-1/2 bg-white shadow-lg" />
      </Carousel>
    </div>
  );
}
