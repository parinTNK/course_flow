"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NavBarProps = {
  navigate?: (to: string) => void;
};

const Footer: React.FC<NavBarProps> = ({ navigate }) => {
  const router = useRouter();

  const handleFoot = (to: string) => {
    if (navigate) {
      navigate(to);
    } else {
      router.push(to); // fallback
    }
  };

  return (
    <footer className="bg-[#112B55] text-white px-[16px] sm:px-[80px] lg:px-[160px] h-[17rem] sm:h-[10rem] py-8">
      <div className="max-w-screen-xl mx-auto h-full flex flex-col sm:flex-row justify-between items-start sm:items-center text-center sm:text-left gap-8">
        {/* Left: Logo */}
        <span
          className="text-2xl font-extrabold bg-gradient-to-r from-[#95BEFF] to-[#0040E5] bg-clip-text text-transparent cursor-pointer"
          style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
          onClick={() => handleFoot("/")}
        >
          CourseFlow
        </span>

        {/* Center: Navigation Links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <span
            className="text-[#C0C9E3] text-base hover:text-white transition cursor-pointer"
            onClick={() => handleFoot("/our-courses")}
          >
            All Courses
          </span>
          <span
            className="text-[#C0C9E3] text-base hover:text-white transition cursor-pointer"
            onClick={() => handleFoot("/course-bundle")}
          >
            Bundle Package
          </span>
        </div>

        {/* Right: Social Icons */}
        <div className="flex gap-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/fb.svg" alt="Facebook" className="w-12 h-12" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/ig.svg" alt="Instagram" className="w-12 h-12" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/tw.svg" alt="Twitter" className="w-12 h-12" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
