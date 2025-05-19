import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}