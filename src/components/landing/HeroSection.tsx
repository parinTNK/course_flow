
import React from "react";
import Image from "next/image";
import { ButtonT } from "../ui/ButtonT";


function HeroSection() {
  return (
    <section className="relative bg-[#EAF1FF] w-full max-h-[700px] overflow-hidden mt-[40px] md:mt-[88px]">
      {/* Background SVG */}
      <div
        className="
          absolute -bottom-[80px] md:bottom-0 -right-[40px] md:left-[320px]
          w-[550px] h-[500px]
          sm:w-[800px] sm:h-[650px]
          md:w-[1200px] md:h-[700px]
          transition-all duration-700 ease-in-out
          z-0
        "
      >
        <Image
          src="/img/HeroBG.png"
          alt="Hero Background"
          fill
          className="object-cover object-right select-none"
          priority
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-[1111px] mx-[16px]  md:mx-[160px] py-[80px] flex flex-col md:flex-row items-center justify-between gap-[48px]">
        {/* Left Text Content */}
        <div className="text-left max-w-[643px] ">
          <h1 className="text-[36px] md:text-[66px] font-medium text-[#1A1A1A] leading-tight animate-fade-right animate-once animate-ease-in-out">
            Best Virtual <br className="hidden sm:block" />
            Classroom&nbsp;Software
          </h1>

          <p className="text-[#6B7280] mt-[16px] sm:mt-[24px] text-[16px] sm:text-[18px]">
            Welcome to Schooler! The one-stop online class management system that caters to all your educational needs!
          </p>
          <div className="mt-[32px] sm:mt-[48px]">
            <a href="/our-courses">
              <ButtonT
                variant="primary"
                className="text-[16px] font-bold px-[32px] py-[16px] w-[200px] h-[60px] flex items-center justify-center"
              >
                Explore Courses
              </ButtonT>
            </a>
          </div>
        </div>

        {/* Right Illustration */}
        <div
          className="
            w-[280px] h-[280px]
            sm:w-[380px] sm:h-[380px]
            md:w-[452px] md:h-[448px]
            transition-all duration-700 ease-in-out
            

          "
        >
          <Image
            src="/img/49663577_9292940.png"
            alt="Virtual Classroom Illustration"
            width={452}
            height={448}
            className="w-full h-full object-contain animate-fade-left animate-once animate-ease-in-out"
            priority
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
