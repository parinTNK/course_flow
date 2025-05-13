"use client";

import React from "react";
import Image from "next/image";
import { ButtonT } from "../ui/ButtonT";

const HeroSection: React.FC = () => {
  return (
    <section className="bg-[#EAF1FF] w-full mt-20">
      <div className="max-w-screen-xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Left Content */}
        <div className="w-full md:max-w-xltext-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight">
            Best Virtual <br className="hidden sm:block" />
            Classroom Software
          </h1>
          <p className="text-[#6B7280] mt-6 text-lg">
            Welcome to Schooler! The one-stop online class management system
            that caters to all your educational needs!
          </p>

          <div className="mt-8">
            <a href="/courses">
              <ButtonT
                variant="primary"
                className="w-[193px] h-[60px] text-lg font-bold px-8 py-4 flex items-center justify-center whitespace-nowrap"
              >
                Explore Courses
              </ButtonT>
            </a>
          </div>
        </div>

        {/* Right Image */}
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
      </div>
    </section>
  );
};

export default HeroSection;
