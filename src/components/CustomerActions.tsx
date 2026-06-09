"use client";

import Link from "next/link";

export default function CustomerActions({ customerId }: { customerId: string }) {
  return (
    <div className="flex gap-2">
      <Link href={`/customers/${customerId}/edit`} className="btn-secondary text-sm">
        Edit
      </Link>
    </div>
  );
}
