import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Walker Slater — Made to Measure",
  description: "Made-to-measure tailoring CRM for Walker Slater Covent Garden Ladieswear",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <div className="no-print">
            <Sidebar />
          </div>
          <main className="flex-1 min-w-0 bg-cream print:bg-white">
            <div className="mx-auto max-w-6xl px-8 py-10 print:max-w-none print:p-0">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
