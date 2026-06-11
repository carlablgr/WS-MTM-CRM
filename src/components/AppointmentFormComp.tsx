"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StaffMemberSelect from "./StaffMemberSelect";

const APPOINTMENT_TYPES = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "MADE_TO_MEASURE", label: "Made to Measure" },
  { value: "FITTING", label: "Fitting" },
  { value: "SECOND_FITTING", label: "Second Fitting" },
  { value: "FINAL_FITTING", label: "Final Fitting" },
];

const APPOINTMENT_STATUSES = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

interface Customer { id: string; firstName: string; lastName: string }
interface Order { id: string; garmentType: string; customerId: string }
interface ExistingAppt {
  id: string;
  customerId: string;
  orderFormId?: string | null;
  appointmentDate: string | Date;
  appointmentType: string;
  location: string;
  conductedBy: string;
  notes?: string | null;
  reminderSent: boolean;
  status: string;
}

function toLocalDatetime(d: string | Date | null): string {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const offset = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - offset).toISOString().slice(0, 16);
}

export default function AppointmentFormComp({
  customers,
  orders,
  defaultCustomerId,
  defaultOrderId,
  existing,
}: {
  customers: Customer[];
  orders: Order[];
  defaultCustomerId?: string;
  defaultOrderId?: string;
  existing?: ExistingAppt;
}) {
  const router = useRouter();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    customerId: existing?.customerId ?? defaultCustomerId ?? "",
    orderFormId: existing?.orderFormId ?? defaultOrderId ?? "",
    appointmentDate: toLocalDatetime(existing?.appointmentDate ?? null),
    appointmentType: existing?.appointmentType ?? "CONSULTATION",
    location: existing?.location ?? "38 Great Queen Street, London WC2B 5AA",
    conductedBy: existing?.conductedBy ?? "Carla",
    notes: existing?.notes ?? "",
    reminderSent: existing?.reminderSent ?? false,
    status: existing?.status ?? "SCHEDULED",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredOrders = orders.filter((o) => !form.customerId || o.customerId === form.customerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/appointments/${existing.id}` : "/api/appointments";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/appointments");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointments/${existing.id}`, { method: "DELETE" });
    router.push("/appointments");
    router.refresh();
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && <div className="warning-red">{error}</div>}

      <div className="bg-white border border-cream-dark p-6 space-y-4">
        <div className="field">
          <label className="label">Customer *</label>
          <select required className="select" value={form.customerId} onChange={set("customerId")}>
            <option value="">Select customer…</option>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Appointment Type *</label>
            <select required className="select" value={form.appointmentType} onChange={set("appointmentType")}>
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={set("status")}>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">Date & Time *</label>
          <input required type="datetime-local" className="input" value={form.appointmentDate} onChange={set("appointmentDate")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={set("location")} />
          </div>
          <div className="field">
            <label className="label">Conducted By</label>
            <StaffMemberSelect
              value={form.conductedBy}
              onChange={(v) => setForm((f) => ({ ...f, conductedBy: v }))}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Notes</label>
          <textarea rows={3} className="textarea" value={form.notes} onChange={set("notes")} />
        </div>

        <div className="field">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.reminderSent}
              onChange={(e) => setForm((f) => ({ ...f, reminderSent: e.target.checked }))}
              className="w-4 h-4 accent-gold"
            />
            <span className="text-sm text-green">Reminder sent to customer</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Book Appointment"}
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} className="btn-danger text-xs">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
