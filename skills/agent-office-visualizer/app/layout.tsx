import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw Agent Hub",
  description: "Real-agent office simulation hub"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
