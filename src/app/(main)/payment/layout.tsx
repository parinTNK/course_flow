import NavBar from "@/components/nav"
import Footer from "@/components/footer"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className="h-screen flex flex-col">
          <NavBar />
          <main className="flex-grow">{children}</main>
          <Footer />
      </div>
  )
}