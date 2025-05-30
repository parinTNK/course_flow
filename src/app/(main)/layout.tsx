'use client'
import { usePathname } from 'next/navigation'
import NavBar from '@/components/nav'
import Footer from '@/components/footer'
import { Toaster } from 'sonner'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import MyAssignmentsPage from './my-assignments/page'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const profilePage = pathname === '/profile'
  const paymentPage = pathname.startsWith('/payment')
  const myassignmentPage = pathname.startsWith('/my-assignments')
  const coursedetailpage = pathname.startsWith('/course-learning')  

  return (
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        { !profilePage && !paymentPage && !myassignmentPage && !coursedetailpage && <NavBar /> }
          <div className="flex-grow">{children}</div>
        <Toaster position="bottom-right" richColors />
        { !profilePage && !paymentPage && !myassignmentPage && !coursedetailpage && <Footer /> }
      </div>
  )
}
