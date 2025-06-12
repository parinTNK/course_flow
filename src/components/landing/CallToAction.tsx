"use client";

import React from "react";
import Image from "next/image";
import { ButtonT } from "../ui/ButtonT";

const CallToAction = () => {
  return (
    <section className="bg-gradient-to-r from-[#1E4FF5] to-[#71afff] w-full lg:max-h-[500px]">
      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row justify-between px-6 lg:px-20 gap-10 text-center lg:text-left">
        
        {/* Left: Text and Button */}
        <div className="flex-1 mt-[64px] lg:mt-[125px]">
          <h2 className="text-[24px] lg:text-[36px] font-medium text-white mb-10">
            Want to start learning?
          </h2>
          <a href="/register">
            <ButtonT
              variant="Secondary"
              className="w-[200px] h-[60px] text-lg font-bold text-[var(--orange-500)] border-2 border-[var(--orange-500)] rounded-xl hover:bg-[var(--orange-500)] hover:text-white flex items-center justify-center whitespace-nowrap mx-auto lg:mx-0"
            >
              Register here
            </ButtonT>
          </a>
        </div>

        {/* Right: Illustration */}
<div className="flex-1 max-w-[500px] w-full flex items-end justify-center lg:justify-end mb-20 lg:mb-1 lg:mt-10">
  <Image
    src="/img/Learning.png"
    alt="Learning"
    width={592}
    height={448}
    className="w-[303px] h-[234px] lg:w-[592px] lg:h-[448px]"
    priority
  />
</div>

      </div>
    </section>
  );
};


export default CallToAction;
