import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taha Group Work Space",
  description: "Employee workspace portal — Taha Group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="aurora-bg" />
        <div className="noise-overlay" />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
