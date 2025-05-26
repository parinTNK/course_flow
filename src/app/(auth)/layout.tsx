import NavBar from "@/components/nav";
import { Toaster } from "sonner";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <NavBar />
      {children}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
