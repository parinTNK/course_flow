'use client'
import { usePathname } from 'next/navigation'
import NavBar from '@/components/nav'
import Footer from '@/components/footer'
import { Toaster } from 'sonner'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const page = pathname === '/profile' || '/payment'

  return (
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        { !page && <NavBar /> }
        {children}
        <Toaster position="bottom-right" richColors />
        { !page && <Footer /> }
      </div>
  )
}
