"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, reminderTypeLabel } from "@/lib/format";

interface Reminder {
  id: string;
  dueDate: string | Date;
  type: string;
  description?: string | null;
  completed: boolean;
  customer?: { id: string; firstName: string; lastName: string } | null;
  orderForm?: { id: string; garmentType: string } | null;
}

export default function RemindersClient({ reminders: initial }: { reminders: Reminder[] }) {
  const router = useRouter();
  const [reminders, setReminders] = useState(initial);
  const now = new Date();

  async function markComplete(id: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    setReminders((rs) => rs.filter((r) => r.id !== id));
    router.refresh();
  }

  const overdue = reminders.filter((r) => new Date(r.dueDate) < now);
  const upcoming = reminders.filter((r) => new Date(r.dueDate) >= now);

  function ReminderItem({ r }: { r: Reminder }) {
    const isOverdue = new Date(r.dueDate) < now;
    return (
      <div className={`px-6 py-4 flex items-start justify-between gap-4 border-b border-cream-dark last:border-b-0 ${isOverdue ? "bg-amber-50/30" : ""}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green">{reminderTypeLabel(r.type)}</span>
            {isOverdue && <span className="text-xs text-amber-700">Overdue</span>}
          </div>
          {r.description && (
            <div className="text-sm text-green-muted mt-0.5">{r.description}</div>
          )}
          <div className="text-xs text-green-muted mt-1 flex flex-wrap gap-3">
            <span>Due: {formatDate(r.dueDate)}</span>
            {r.customer && (
              <Link href={`/customers/${r.customer.id}`} className="hover:text-gold">
                {r.customer.firstName} {r.customer.lastName}
              </Link>
            )}
            {r.orderForm && (
              <Link href={`/orders/${r.orderForm.id}`} className="hover:text-gold">
                {r.orderForm.garmentType.replace(/_/g, " ")}
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={() => markComplete(r.id)}
          className="shrink-0 text-xs btn-secondary"
        >
          Done ✓
        </button>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="bg-white border border-cream-dark px-8 py-16 text-center">
        <p className="text-green-muted">No pending reminders. All clear.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <div>
          <h2 className="section-title mb-4 text-amber-700">Overdue ({overdue.length})</h2>
          <div className="bg-white border border-amber-200">
            {overdue.map((r) => <ReminderItem key={r.id} r={r} />)}
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <h2 className="section-title mb-4">Upcoming ({upcoming.length})</h2>
          <div className="bg-white border border-cream-dark">
            {upcoming.map((r) => <ReminderItem key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
