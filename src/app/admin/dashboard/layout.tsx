import React from "react";
import Sidebar from "../components/Sidebar";
import { CoursesProvider } from "../context/CoursesContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CoursesProvider>
      <div className="flex">
        <div className='fixed'>
        <Sidebar />
        </div>
        <main className="flex-1 bg-gray-50 min-h-screen ml-[240px]">
          {children}
        </main>
      </div>
    </CoursesProvider>
  );
}
