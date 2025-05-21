"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth";
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
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";

const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, fetchUser } = useAuth();
  const router = useRouter();

  // Check user role on first load and logout if admin
  useEffect(() => {
    if (user?.role === "admin") {
      (async () => {
        await signOut();
        document.cookie = "redirecting=; max-age=0; path=/;";
        window.location.href = "/login";
      })();
    }
  }, [user]);

  const menuItems = [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: BookText, label: "My Courses", href: "/my-courses" },
    { icon: ClipboardCheck, label: "My Assignments", href: "/my-assignments" },
    { icon: Star, label: "My Wishlist", href: "/wishlist" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      document.cookie = "redirecting=; max-age=0; path=/;";
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayName = user?.full_name || "User";
  const avatarUrl = user?.profile_picture || "/img/defaultProfileImage.png";

  return (
    <nav className="bg-white fixed w-full h-[88px] z-20 top-0 start-0 border-b border-gray-200 shadow-sm">
      {/* Desktop */}
      <div className=" h-full hidden sm:flex items-center justify-between lg:mx-[120px] mx-6 px-6">
        <Link
          href="/"
          className="text-2xl font-extrabold text-transparent bg-linear1"
          style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
        >
          CourseFlow
        </Link>

        <div className="flex items-center space-x-6">
          <Link
            href="/our-courses"
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
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-1">
                    <span className="text-base font-medium text-[#3B3F66]">
                      {displayName}
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
                    onClick={() => router.push(href)}
                    className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89] cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#8DADE0]" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-2 border-t text-[#E4E6ED]" />
                <DropdownMenuItem
                  className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89] cursor-pointer"
                  onClick={handleLogout}
                >
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
            href="/our-courses"
            className="text-sm font-bold text-[#1A1A66] hover:text-[#0033CC] transition !important"
          >
            Our Courses
          </Link>

          {!user ? (
            <Link href="/login">
              <button
                className="font-sans whitespace-nowrap w-[74px] h-[37px] bg-[var(--blue-500)] hover:bg-blue-700 rounded-[12px] font-bold px-[32px] py-[18px] cursor-pointer flex items-center justify-center text-white text-sm"
              >
                Log in
              </button>
            </Link>
          ) : (
            <DropdownMenu onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={displayName} />
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
                    onClick={() => router.push(href)}
                    className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89] cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#8DADE0]" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-2 border-t text-[#E4E6ED]" />
                <DropdownMenuItem
                  className="px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 text-[#646D89]"
                  onClick={handleLogout}
                >
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
