"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: "M3 12 12 4l9 8M5 10v10h14V10",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: "M16 14a4 4 0 1 0-8 0M4 20a8 8 0 1 1 16 0",
  },
  {
    href: "/pre-consultation",
    label: "Pre-Consultations",
    icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  },
  {
    href: "/orders",
    label: "MTM Orders",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z",
  },
  {
    href: "/mto-orders",
    label: "MTO Orders",
    icon: "M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v3a3 3 0 0 0 3 3h.341A4 4 0 0 0 10 17.659V20H8v2h8v-2h-2v-2.341A4 4 0 0 0 17.659 14H18a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 5h6v2H9zm10 6a1 1 0 0 1-1 1h-1V9h2zM6 12H5a1 1 0 0 1-1-1V9h2z",
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-green text-cream" style={{ minHeight: "100vh" }}>
      {/* Brand */}
      <div className="px-6 py-7 border-b border-green-light">
        <Link href="/" className="block">
          <div className="text-xs uppercase tracking-widest text-gold mb-1">Walker Slater</div>
          <div className="text-sm text-cream/80">Made to Measure</div>
          <div className="text-xs text-cream/50 mt-1">Covent Garden Ladieswear</div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {links.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "text-gold bg-green-light"
                  : "text-cream/70 hover:text-cream hover:bg-green-light/50"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d={link.icon} />
              </svg>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-green-light text-xs text-cream/40">
        38 Great Queen Street, London WC2B 5AA
      </div>
    </aside>
  );
}
