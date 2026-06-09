"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  hasBlock: boolean;
  blockCreatedAt?: Date | string | null;
}

export default function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const isEdit = !!customer;

  const [form, setForm] = useState({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
    hasBlock: customer?.hasBlock ?? false,
    blockCreatedAt: customer?.blockCreatedAt
      ? new Date(customer.blockCreatedAt).toISOString().split("T")[0]
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/customers/${customer.id}` : "/api/customers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      router.push(`/customers/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!customer) return;
    if (!confirm(`Delete ${customer.firstName} ${customer.lastName}? This cannot be undone.`)) return;
    await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
    router.push("/customers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      {error && <div className="warning-red mb-4">{error}</div>}

      <div className="bg-white border border-cream-dark p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">First Name *</label>
            <input
              required
              className="input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Last Name *</label>
            <input
              required
              className="input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label">Address</label>
          <textarea
            rows={3}
            className="textarea"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label">Notes</label>
          <textarea
            rows={3}
            className="textarea"
            placeholder="Any notes about this customer…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="field pt-2 border-t border-cream-dark">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasBlock}
              onChange={(e) => setForm({ ...form, hasBlock: e.target.checked })}
              className="w-4 h-4 accent-gold"
            />
            <span className="text-sm text-green">Block cut — first garment block has been made</span>
          </label>
        </div>

        {form.hasBlock && (
          <div className="field">
            <label className="label">Block Created Date</label>
            <input
              type="date"
              className="input"
              value={form.blockCreatedAt}
              onChange={(e) => setForm({ ...form, blockCreatedAt: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Customer"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger text-xs"
          >
            Delete Customer
          </button>
        )}
      </div>
    </form>
  );
}
