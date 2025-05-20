import NavBar from "@/components/nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div>
        <NavBar />
        {children}
      </div>
  );
}
