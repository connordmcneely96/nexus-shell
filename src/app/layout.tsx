import type { Metadata } from "next";
import Topbar from "@/components/frame/Topbar";
import Rail from "@/components/frame/Rail";
import CommandK from "@/components/frame/CommandK";
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
        <CommandK />
        <div className="flex h-screen flex-col">
          <Topbar />
          <div className="flex min-h-0 flex-1">
            <Rail />
            {/* Stage owns the System Brain column; legacy routes pad themselves */}
            <main className="min-w-0 flex-1 overflow-y-auto bg-surface-base">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
