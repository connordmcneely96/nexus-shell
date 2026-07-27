import type { Metadata } from "next";
import Topbar from "@/components/frame/Topbar";
import ShellFrame from "@/components/frame/ShellFrame";
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
          {/* Rail + stage region live in a resizable frame; no blanket scroll
              wrapper — each pane owns its own scroll. */}
          <div className="flex min-h-0 flex-1 bg-surface-base">
            <ShellFrame>{children}</ShellFrame>
          </div>
        </div>
      </body>
    </html>
  );
}
