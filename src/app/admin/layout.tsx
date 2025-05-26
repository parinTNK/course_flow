import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div>
        <main>{children}</main>
        <Toaster position="bottom-right" richColors />
      </div>
  )
}