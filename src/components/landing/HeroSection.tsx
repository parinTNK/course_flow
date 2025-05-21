
import React, { useMemo } from "react";
import Image from "next/image";
import { ButtonT } from "../ui/ButtonT";

// Helper to determine objectPosition based on window width
function getObjectPosition() {
  if (typeof window !== "undefined" && window.innerWidth >= 1024) {
    return "right";
  }
  return "center";
}

// Background image as a separate component
function HeroBackground() {
  const objectPosition = useMemo(getObjectPosition, []);
  return (
    <div className="absolute right-0 top-0 h-full w-full z-1 pointer-events-none">
      <Image
        src="/img/HeroBG.png"
        alt=""
        fill
        style={{
          objectFit: "cover",
          objectPosition,
        }}
        className="select-none"
        priority
      />
    </div>
  );
}

// Hero image as a separate component
function HeroImage() {
  return (
    <div className="w-full flex justify-center">
      <Image
        src="/img/Hero.png"
        alt="Virtual Classroom"
        width={500}
        height={400}
        className="w-full h-auto max-w-md md:max-w-lg"
        priority
      />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-[#EAF1FF] w-full mt-10 overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Left Content */}
        <div className="w-full md:max-w-xl text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold text-[#1A1A1A] leading-tight">
            Best Virtual <br className="hidden sm:block" />
            Classroom Software
          </h1>
          <p className="text-[#6B7280] mt-6 text-lg">
            Welcome to Schooler! The one-stop online class management system
            that caters to all your educational needs!
          </p>
          <div className="mt-8">
            <a href="/our-courses">
              <ButtonT
                variant="primary"
                className="w-[193px] h-[60px] text-lg font-bold px-8 py-4 flex items-center justify-center whitespace-nowrap"
              >
                Explore Courses
              </ButtonT>
            </a>
          </div>
        </div>
        <HeroImage />
      </div>
    </section>
  );
}

export default HeroSection;
