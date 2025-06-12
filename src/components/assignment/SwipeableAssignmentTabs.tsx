"use client";

import React, { useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "inprogress", label: "In Progress" },
  { key: "submitted", label: "Submitted" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Props = {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
};

export default function SwipeableAssignmentTabs({
  tab,
  setTab,
}: Props) {
  const swiperRef = useRef<any>(null);
  const currentIndex = TABS.findIndex((t) => t.key === tab);

  // Sync Swiper position when tab changes externally
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper && swiperRef.current.swiper.activeIndex !== currentIndex) {
      swiperRef.current.swiper.slideTo(currentIndex);
    }
  }, [currentIndex]);

  return (
    <div className="w-full max-w-3xl mx-auto overflow-x-auto">
      <Swiper
        ref={swiperRef}
        slidesPerView="auto"
        spaceBetween={16}
        onSlideChange={(swiper) => {
          const newTab = TABS[swiper.activeIndex].key;
          if (tab !== newTab) {
            setTab(newTab);
          }
        }}
        initialSlide={currentIndex}
        className="!overflow-visible"
        style={{ maxWidth: "100%" }}
      >
        {TABS.map((t) => (
          <SwiperSlide
            key={t.key}
            style={{ width: "auto" }}
            className="!w-auto"
          >
            <button
              className={`px-4 py-2 text-base font-medium whitespace-nowrap cursor-pointer transition-colors
                ${
                  tab === t.key
                    ? "border-b-2 border-black"
                    : "text-gray-400 border-b-2 border-transparent hover:text-[#0033CC] active:text-black active:border-black"
                }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
