import type { Metadata } from "next";
import Topbar from "@/components/frame/Topbar";
import Rail from "@/components/frame/Rail";
import "./globals.css";

export const metadata: Metadata = {
  title: "nexus-shell",
  description: "nexus-shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen flex-col">
          <Topbar />
          <div className="flex min-h-0 flex-1">
            <Rail />
            <main className="min-w-0 flex-1 overflow-y-auto bg-surface-base p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
