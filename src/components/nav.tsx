"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  User,
  LogOut,
  BookText,
  ClipboardCheck,
  Star,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ButtonT } from "@/components/ui/ButtonT";

type UserType = {
  name: string;
  avatarUrl: string;
};

const NavBar = ({ user }: { user?: UserType | null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: BookText, label: "My Courses", href: "/my-courses" },
    { icon: ClipboardCheck, label: "My Assignments", href: "/my-assignments" },
    { icon: Star, label: "My Wishlist", href: "/wishlist" },
  ];

  return (
    <nav className="bg-white fixed w-full h-[88px] z-20 top-0 start-0 border-b border-gray-200 shadow-sm">
      {/* Desktop */}
      <div className="max-w-screen-xl h-full hidden sm:flex items-center justify-between lg:mx-[120px] mx-6 px-6">
        <Link
          href="/"
          className="text-2xl font-extrabold text-transparent bg-linear1"
          style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
        >
          CourseFlow
        </Link>

        <div className="flex items-center space-x-6">
          <Link
            href="/courses"
            className="font-semibold text-[#1A1A66] hover:text-[#0033CC] transition"
          >
            Our Courses
          </Link>

          {!user ? (
            <Link href="/login">
              <ButtonT variant="primary">Log in</ButtonT>
            </Link>
          ) : (
            <DropdownMenu onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 cursor-pointer px-2 py-1 rounded-md transition focus:outline-none">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-1">
                    <span className="text-base font-medium text-[#3B3F66]">
                      {user.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#3B3F66] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="start"
                alignOffset={100}
                sideOffset={-8}
                className="w-52 mt-2 rounded-xl bg-white border border-gray-200 shadow-xl py-2"
              >
                {menuItems.map(({ icon: Icon, label, href }) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => (window.location.href = href)}
                    className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89] cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#8DADE0]" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="my-2 border-t text-[#E4E6ED]" />

                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89]">
                  <LogOut className="w-5 h-5 text-[#8DADE0]" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex justify-between items-center h-full px-6">
        <Link
          href="/"
          className="text-xl font-extrabold text-transparent bg-linear1"
          style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
        >
          CourseFlow
        </Link>

        <div className="flex items-center space-x-4">
          <Link
            href="/courses"
            className="text-sm font-semibold text-[#1A1A66] hover:text-[#0033CC] transition"
          >
            Our Courses
          </Link>

          {!user ? (
            <Link href="/login">
              <ButtonT variant="primary" className="w-[90px] h-[40px] text-sm">
                Log in
              </ButtonT>
            </Link>
          ) : (
            <DropdownMenu onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <ChevronDown
                    className={`w-4 h-4 text-[#3B3F66] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-44 mt-2 rounded-xl bg-white border border-gray-200 shadow-xl py-2">
                {menuItems.map(({ icon: Icon, label, href }) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => (window.location.href = href)}
                    className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89] cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#8DADE0]" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="my-2 border-t text-[#E4E6ED]" />

                <DropdownMenuItem className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89]">
                  <LogOut className="w-5 h-5 text-[#8DADE0]" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
