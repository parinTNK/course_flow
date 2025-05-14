"use client";

import React from "react";
import Image from "next/image";
import { ButtonT } from "../ui/ButtonT";

const CallToAction = () => {
  return (
    <section className="bg-gradient-to-r from-[#1E4FF5] to-[#2F80ED] w-full py-16">
      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 gap-10 text-center lg:text-left">
        
        {/* Left: Text and Button */}
        <div className="flex-1">
          <h2 className="text-3xl lg:text-5xl font-semibold text-white mb-6">
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
        <div className="flex-1 max-w-[500px] w-full">
          <Image
            src="/img/Learning.png"
            alt="Learning"
            width={500}
            height={500}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
