"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoBookOutline } from "react-icons/io5";
import { MdOutlineAssignmentTurnedIn } from "react-icons/md";
import { RiCoupon3Line } from "react-icons/ri";
import { TbLogout } from "react-icons/tb";
import { signOut } from "@/lib/auth";
import { useCustomToast } from "@/components/ui/CustomToast";
import { TbPackage } from "react-icons/tb";

type SidebarItemDef = {
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useCustomToast();

  const sidebarItems: SidebarItemDef[] = [
    {
      id: "course",
      name: "Course",
      path: "/admin/dashboard",
      icon: IoBookOutline,
    },
    {
      id: "assignment",
      name: "Assignment",
      path: "/admin/dashboard/assignments",
      icon: MdOutlineAssignmentTurnedIn,
    },
    {
      id: "promo",
      name: "Promo code",
      path: "/admin/dashboard/promo-codes",
      icon: RiCoupon3Line,
    },
    {
      id: "bundle",
      name: "Bundle",
      path: "/admin/dashboard/bundle",
      icon: TbPackage,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(
        "Logout successful",
        "You have been logged out successfully"
      );
      router.push("/admin/login");
    } catch (error) {
      console.error("ไม่สามารถออกจากระบบได้:", error);
      toast.error(
        "Logout failed",
        "There was an error logging out. Please try again."
      );
    }
  };

  return (
    <div className="bg-white w-[240px] h-screen shadow-md flex flex-col border-3 border-gray-200 border-b-0 border-t-0">
      <div className="p-6 pb-12 flex flex-col items-center ">
        <div className="max-w-screen-xl h-full hidden sm:flex items-center justify-between lg:mx-[120px] mx-6 px-6">
          <Link
            href="/"
            className="text-2xl font-extrabold text-transparent bg-linear1"
            style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
          >
            CourseFlow
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-1">Admin Panel Control</p>
      </div>

      <nav className="flex flex-col py-4 flex-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              href={item.path}
              key={item.id}
              passHref
              legacyBehavior={false}
            >
              <div
                className={`flex items-center px-5 py-3 mx-3 my-0.5 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold" // Active style
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 mr-3 ${
                    isActive ? "text-blue-700" : "text-[var(--blue-300)]"
                  }`}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="mb-100">
        <button
          onClick={handleLogout}
          className={`flex items-center px-5 py-3 mx-3 my-0.5 rounded-md cursor-pointer transition-colors duration-150 ease-in-out text-gray-600 hover:bg-gray-100 hover:text-gray-800`}
        >
          <TbLogout className={`w-5 h-5 mr-3 text-[var(--blue-300)]`} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
