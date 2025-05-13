import React from 'react';
import Sidebar from './components/Sidebar';
import { CoursesProvider } from './context/CoursesContext';
import {Toaster} from 'sonner'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CoursesProvider>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50 min-h-screen">
          {children}
          <Toaster position="bottom-right" richColors />
        </main>
      </div>
    </CoursesProvider>
  );
}