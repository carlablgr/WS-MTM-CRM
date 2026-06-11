"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderMenu({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="block w-full btn-primary text-center text-sm justify-center"
      >
        New Order
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-cream-dark shadow-lg z-10">
          <button
            type="button"
            onClick={() => router.push(`/orders/new?customerId=${customerId}`)}
            className="block w-full text-left px-4 py-2 text-sm text-green hover:bg-cream-dark"
          >
            Made to Measure (MTM)
          </button>
          <button
            type="button"
            onClick={() => router.push(`/mto-orders/new?customerId=${customerId}`)}
            className="block w-full text-left px-4 py-2 text-sm text-green hover:bg-cream-dark border-t border-cream-dark"
          >
            Made to Order (MTO)
          </button>
        </div>
      )}
    </div>
  );
}
