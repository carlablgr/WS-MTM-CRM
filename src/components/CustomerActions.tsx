"use client";

import Link from "next/link";
import DeleteButton from "./DeleteButton";

export default function CustomerActions({ customerId }: { customerId: string }) {
  return (
    <div className="flex gap-2">
      <Link href={`/customers/${customerId}/edit`} className="btn-secondary text-sm">
        Edit
      </Link>
      <DeleteButton
        endpoint={`/api/customers/${customerId}`}
        label="Delete Customer"
        confirmMessage="Are you sure you want to delete this customer? This will also delete all their orders, appointments, reminders and forms. This cannot be undone."
        redirectTo="/customers"
      />
    </div>
  );
}
