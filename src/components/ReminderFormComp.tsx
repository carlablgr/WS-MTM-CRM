"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REMINDER_TYPES = [
  { value: "FOLLOW_UP_WITH_CUSTOMER", label: "Follow Up with Customer" },
  { value: "CHASE_ANTHONY", label: "Chase Tailor" },
  { value: "FITTING_TO_BOOK", label: "Fitting to Book" },
  { value: "BALANCE_PAYMENT_DUE", label: "Balance Payment Due" },
  { value: "ORDER_READY_TO_COLLECT", label: "Order Ready to Collect" },
  { value: "CUSTOM", label: "Custom" },
];

interface Customer { id: string; firstName: string; lastName: string }
interface Order { id: string; garmentType: string; customerId: string }

export default function ReminderFormComp({
  customers,
  orders,
  defaultCustomerId,
  defaultOrderId,
}: {
  customers: Customer[];
  orders: Order[];
  defaultCustomerId?: string;
  defaultOrderId?: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customerId: defaultCustomerId ?? "",
    orderFormId: defaultOrderId ?? "",
    dueDate: today,
    type: "FOLLOW_UP_WITH_CUSTOMER",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const filteredOrders = orders.filter((o) => !form.customerId || o.customerId === form.customerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/reminders");
    router.refresh();
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div className="bg-white border border-cream-dark p-6 space-y-4">
        <div className="field">
          <label className="label">Type *</label>
          <select required className="select" value={form.type} onChange={set("type")}>
            {REMINDER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Due Date *</label>
          <input required type="date" className="input" value={form.dueDate} onChange={set("dueDate")} />
        </div>

        <div className="field">
          <label className="label">Customer (optional)</label>
          <select className="select" value={form.customerId} onChange={set("customerId")}>
            <option value="">— None —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>
            ))}
          </select>
        </div>

        {filteredOrders.length > 0 && (
          <div className="field">
            <label className="label">Linked Order (optional)</label>
            <select className="select" value={form.orderFormId} onChange={set("orderFormId")}>
              <option value="">— None —</option>
              {filteredOrders.map((o) => (
                <option key={o.id} value={o.id}>{o.garmentType.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label className="label">Description</label>
          <textarea rows={3} className="textarea" placeholder="Additional details…" value={form.description} onChange={set("description")} />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Create Reminder"}
      </button>
    </form>
  );
}
