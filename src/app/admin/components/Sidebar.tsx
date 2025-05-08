"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { IoBookOutline } from "react-icons/io5";
import { MdOutlineAssignmentTurnedIn } from "react-icons/md";
import { RiCoupon3Line } from "react-icons/ri";
import { TbLogout } from "react-icons/tb";

type SidebarItemDef = { 
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
};

export default function Sidebar() {
  const pathname = usePathname(); 

  const sidebarItems: SidebarItemDef[] = [
    {
      id: 'course',
      name: 'Course',
      path: '/admin/dashboard',
      icon: IoBookOutline,
    },
    {
      id: 'assignment',
      name: 'Assignment',
      path: '/admin/assignments', 
      icon: MdOutlineAssignmentTurnedIn,
    },
    {
      id: 'promo',
      name: 'Promo code',
      path: '/admin/promo-codes', 
      icon: RiCoupon3Line,
    },
  ];

  const logoutItem: SidebarItemDef = {
    id: 'logout',
    name: 'Log out',
    path: '/auth/logout', 
    icon: TbLogout,
  };


  return (
    <div className="bg-white w-[240px] h-screen shadow-md flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-semibold text-blue-600">CourseFlow</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Panel Control</p>
      </div>

      <nav className="flex flex-col py-4 flex-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link href={item.path} key={item.id} passHref legacyBehavior={false}>
              <div
                className={`flex items-center px-5 py-3 mx-3 my-0.5 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold' // Active style
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                <item.icon 
                  className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-[var(--blue-300)]'}`} 
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="mb-100">
        <Link href={logoutItem.path} passHref legacyBehavior={false}>
            <div
            className={`flex items-center px-5 py-3 mx-3 my-0.5 rounded-md cursor-pointer transition-colors duration-150 ease-in-out text-gray-600 hover:bg-gray-100 hover:text-gray-800`}
            >
            <logoutItem.icon 
                className={`w-5 h-5 mr-3 text-[var(--blue-300)]`} 
            />
            <span>{logoutItem.name}</span>
            </div>
        </Link>
      </div>
    </div>
  );
}