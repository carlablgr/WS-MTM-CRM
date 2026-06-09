"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GARMENT_TYPES = [
  { value: "JACKET", label: "Jacket" },
  { value: "TROUSERS", label: "Trousers" },
  { value: "SKIRT", label: "Skirt" },
  { value: "WAISTCOAT", label: "Waistcoat" },
  { value: "THREE_QUARTER_COAT", label: "¾ Coat" },
  { value: "FULL_LENGTH_COAT", label: "Full Length Coat" },
];

interface Customer { id: string; firstName: string; lastName: string }
interface ExistingForm {
  id: string;
  customerId: string;
  completedBy: string;
  occasionOrPurpose?: string | null;
  garmentType?: string | null;
  stylePreferences?: string | null;
  fabricPreferences?: string | null;
  inspirationNotes?: string | null;
  budgetRange?: string | null;
  existingFitIssues?: string | null;
  additionalNotes?: string | null;
  status: string;
}

export default function PreConsultationFormComp({
  customers,
  defaultCustomerId,
  existing,
}: {
  customers: Customer[];
  defaultCustomerId?: string;
  existing?: ExistingForm;
}) {
  const router = useRouter();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    customerId: existing?.customerId ?? defaultCustomerId ?? "",
    completedBy: existing?.completedBy ?? "Carla",
    occasionOrPurpose: existing?.occasionOrPurpose ?? "",
    garmentType: existing?.garmentType ?? "",
    stylePreferences: existing?.stylePreferences ?? "",
    fabricPreferences: existing?.fabricPreferences ?? "",
    inspirationNotes: existing?.inspirationNotes ?? "",
    budgetRange: existing?.budgetRange ?? "",
    existingFitIssues: existing?.existingFitIssues ?? "",
    additionalNotes: existing?.additionalNotes ?? "",
    status: existing?.status ?? "DRAFT",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/pre-consultation/${existing.id}` : "/api/pre-consultation";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      router.push(`/pre-consultation/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm({ ...form, [key]: e.target.value }),
    };
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="warning-red">{error}</div>}

      <div className="bg-white border border-cream-dark p-6 space-y-4">
        <h2 className="section-title">Customer</h2>

        {!isEdit ? (
          <div className="field">
            <label className="label">Customer *</label>
            <select required className="select" {...field("customerId")}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName}, {c.firstName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-sm text-green">
            {customers.find((c) => c.id === form.customerId)
              ? `${customers.find((c) => c.id === form.customerId)!.lastName}, ${customers.find((c) => c.id === form.customerId)!.firstName}`
              : form.customerId}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Completed By</label>
            <input className="input" {...field("completedBy")} />
          </div>
          <div className="field">
            <label className="label">Garment Type</label>
            <select className="select" {...field("garmentType")}>
              <option value="">— Select —</option>
              {GARMENT_TYPES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-cream-dark p-6 space-y-4">
        <h2 className="section-title">Consultation</h2>

        <div className="field">
          <label className="label">Occasion / Purpose</label>
          <textarea rows={2} className="textarea" placeholder="Wedding, work, event…" {...field("occasionOrPurpose")} />
        </div>

        <div className="field">
          <label className="label">Style Preferences</label>
          <textarea rows={3} className="textarea" placeholder="How they want it to look and feel…" {...field("stylePreferences")} />
        </div>

        <div className="field">
          <label className="label">Fabric Preferences</label>
          <textarea rows={3} className="textarea" placeholder="Colours, textures, weight preferences…" {...field("fabricPreferences")} />
        </div>

        <div className="field">
          <label className="label">Inspiration Notes</label>
          <textarea rows={2} className="textarea" placeholder="References, images, ideas…" {...field("inspirationNotes")} />
        </div>

        <div className="field">
          <label className="label">Approximate Budget</label>
          <input className="input" placeholder="e.g. £2,000–£3,000" {...field("budgetRange")} />
        </div>

        <div className="field">
          <label className="label">Existing Fit Issues (from RTW)</label>
          <textarea rows={3} className="textarea" placeholder="Known fit problems the customer experiences off-the-rack…" {...field("existingFitIssues")} />
        </div>

        <div className="field">
          <label className="label">Additional Notes</label>
          <textarea rows={3} className="textarea" {...field("additionalNotes")} />
        </div>
      </div>

      <div className="bg-white border border-cream-dark p-6">
        <h2 className="section-title">Status</h2>
        <div className="field mb-0">
          <select className="select max-w-xs" {...field("status")}>
            <option value="DRAFT">Draft</option>
            <option value="SENT_TO_CUSTOMER">Sent to Customer</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Form"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
