"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StaffMemberSelect from "./StaffMemberSelect";
import {
  calculateMtoItemPricing,
  calculateMtoOrderTotals,
  mtoEstimatedArrival,
  MTO_STATUSES,
} from "@/lib/mtoUtils";

export interface MtoItemData {
  _id: string;
  garmentName: string;
  blockSize: string;
  cloth: string;
  lining: string;
  internal: string;
  accents: string;
  buttons: string;
  retailPrice: string;
  externalFabric: boolean;
  externalFabricCost: string;
  notes: string;
}

interface MtoFormData {
  customerId: string;
  conductedBy: string;
  date: string;
  shop: string;
  depositPaid: string;
  depositPaidDate: string;
  balancePaidDate: string;
  fullyPaid: boolean;
  dateRequired: string;
  submissionDate: string;
  status: string;
  notes: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

let _uid = 0;
function uid() { return `mto-item-${++_uid}`; }

function blankItem(): MtoItemData {
  return {
    _id: uid(),
    garmentName: "",
    blockSize: "",
    cloth: "",
    lining: "",
    internal: "",
    accents: "",
    buttons: "",
    retailPrice: "",
    externalFabric: false,
    externalFabricCost: "",
    notes: "",
  };
}

const STEPS = ["Customer", "Garments", "Pricing", "Payment", "Dates"];

export default function MtoOrderFormWizard({
  customers,
  defaultCustomerId,
  existing,
}: {
  customers: Customer[];
  defaultCustomerId?: string;
  existing?: Record<string, unknown>;
}) {
  const router = useRouter();
  const isEdit = !!existing;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── New customer inline creation ────────────────────────────────────────
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "" });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>(customers);

  const [form, setForm] = useState<MtoFormData>(() => {
    if (existing) {
      return {
        customerId: (existing.customerId as string) ?? "",
        conductedBy: (existing.conductedBy as string) ?? "Carla",
        date: existing.date
          ? new Date(existing.date as string).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        shop: (existing.shop as string) ?? "Covent Garden Ladieswear",
        depositPaid: existing.depositPaid != null ? String(existing.depositPaid) : "",
        depositPaidDate: existing.depositPaidDate
          ? new Date(existing.depositPaidDate as string).toISOString().split("T")[0]
          : "",
        balancePaidDate: existing.balancePaidDate
          ? new Date(existing.balancePaidDate as string).toISOString().split("T")[0]
          : "",
        fullyPaid: Boolean(existing.fullyPaid),
        dateRequired: existing.dateRequired
          ? new Date(existing.dateRequired as string).toISOString().split("T")[0]
          : "",
        submissionDate: existing.submissionDate
          ? new Date(existing.submissionDate as string).toISOString().split("T")[0]
          : "",
        status: (existing.status as string) ?? "DEPOSIT_TAKEN",
        notes: (existing.notes as string) ?? "",
      };
    }
    return {
      customerId: defaultCustomerId ?? "",
      conductedBy: "Carla",
      date: new Date().toISOString().split("T")[0],
      shop: "Covent Garden Ladieswear",
      depositPaid: "",
      depositPaidDate: "",
      balancePaidDate: "",
      fullyPaid: false,
      dateRequired: "",
      submissionDate: "",
      status: "DEPOSIT_TAKEN",
      notes: "",
    };
  });

  const [items, setItems] = useState<MtoItemData[]>(() => {
    if (existing && Array.isArray((existing as Record<string, unknown>).items)) {
      const existingItems = (existing as Record<string, unknown>).items as Record<string, unknown>[];
      if (existingItems.length) {
        return existingItems.map((it) => ({
          _id: uid(),
          garmentName: (it.garmentName as string) ?? "",
          blockSize: (it.blockSize as string) ?? "",
          cloth: (it.cloth as string) ?? "",
          lining: (it.lining as string) ?? "",
          internal: (it.internal as string) ?? "",
          accents: (it.accents as string) ?? "",
          buttons: (it.buttons as string) ?? "",
          retailPrice: it.retailPrice != null ? String(it.retailPrice) : "",
          externalFabric: it.externalFabricCost != null && Number(it.externalFabricCost) > 0,
          externalFabricCost: it.externalFabricCost != null ? String(it.externalFabricCost) : "",
          notes: (it.notes as string) ?? "",
        }));
      }
    }
    return [blankItem()];
  });

  const selectedCustomer = customerList.find((c) => c.id === form.customerId);

  function updateItem(index: number, patch: Partial<MtoItemData>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, blankItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Pricing calc ──────────────────────────────────────────────────────────
  const itemPricing = items.map((it) => {
    const retailPrice = parseFloat(it.retailPrice) || 0;
    const externalFabricCost = it.externalFabric ? (parseFloat(it.externalFabricCost) || 0) : 0;
    return calculateMtoItemPricing(retailPrice, externalFabricCost);
  });

  const totals = calculateMtoOrderTotals(itemPricing.map((p) => p.totalIncVat));
  const balanceDue = totals.grandTotal - (parseFloat(form.depositPaid) || 0);
  const estimatedArrival = mtoEstimatedArrival(form.submissionDate || null);

  async function createCustomer() {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      setError("Please enter the new customer's first and last name.");
      return;
    }
    setCreatingCustomer(true);
    setError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      const data = await res.json();
      setCustomerList((prev) => [...prev, { id: data.id, firstName: data.firstName, lastName: data.lastName }]);
      setForm((f) => ({ ...f, customerId: data.id }));
      setShowNewCustomer(false);
      setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "" });
    } catch {
      setError("Could not create customer. Please try again.");
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function save() {
    if (!form.customerId) { setError("Please select or create a customer."); return; }
    if (items.length === 0 || !items[0].garmentName) { setError("Please add at least one garment."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({
          garmentName: it.garmentName,
          blockSize: it.blockSize,
          cloth: it.externalFabric ? (it.cloth || "See notes") : it.cloth,
          lining: it.lining,
          internal: it.internal,
          accents: it.accents,
          buttons: it.buttons,
          retailPrice: it.retailPrice,
          externalFabricCost: it.externalFabric ? it.externalFabricCost : "0",
          notes: it.notes,
        })),
      };

      const url = isEdit ? `/api/mto-orders/${(existing as Record<string, unknown>).id}` : "/api/mto-orders";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      router.push(`/mto-orders/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const setF =
    (key: keyof MtoFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-4xl">
      {/* MTO badge */}
      <div className="mb-6 flex items-center gap-2 bg-green text-cream px-4 py-2 text-xs uppercase tracking-widest">
        <span className="text-gold">Made to Order</span>
        <span className="text-cream/50">·</span>
        <span className="text-cream/70">Factory · No measurements · 8–10 week turnaround</span>
      </div>

      {/* Step tabs */}
      <div className="flex mb-8 border border-cream-dark overflow-hidden">
        {STEPS.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 px-3 py-2.5 text-xs transition-colors border-r border-cream-dark last:border-r-0 ${
              i === step ? "bg-green text-cream" : i < step ? "bg-cream-dark text-green" : "bg-white text-green-muted hover:bg-cream"
            }`}
          >
            <div className="font-medium">{i + 1}</div>
            <div className="hidden sm:block mt-0.5 leading-tight">{s}</div>
          </button>
        ))}
      </div>

      {error && <div className="warning-red mb-4">{error}</div>}

      {/* ── Step 1: Customer ── */}
      {step === 0 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Customer</h2>

          {!showNewCustomer ? (
            <>
              <div className="field">
                <label className="label">Customer *</label>
                <select required className="select" value={form.customerId} onChange={setF("customerId")}>
                  <option value="">Select customer…</option>
                  {customerList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.lastName}, {c.firstName}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="text-xs text-gold hover:underline" onClick={() => setShowNewCustomer(true)}>
                + Create new customer
              </button>
            </>
          ) : (
            <div className="space-y-4 border border-cream-dark p-4 bg-cream/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="label">First Name *</label>
                  <input className="input" value={newCustomer.firstName} onChange={(e) => setNewCustomer((c) => ({ ...c, firstName: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Last Name *</label>
                  <input className="input" value={newCustomer.lastName} onChange={(e) => setNewCustomer((c) => ({ ...c, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" value={newCustomer.email} onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Phone</label>
                  <input className="input" value={newCustomer.phone} onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label className="label">Address</label>
                <input className="input" value={newCustomer.address} onChange={(e) => setNewCustomer((c) => ({ ...c, address: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-primary text-sm" disabled={creatingCustomer} onClick={createCustomer}>
                  {creatingCustomer ? "Creating…" : "Create Customer"}
                </button>
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowNewCustomer(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectedCustomer && (
            <div className="text-sm text-green-muted">
              Selected: <span className="text-green font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="field">
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={setF("date")} />
            </div>
            <div className="field">
              <label className="label">Shop</label>
              <input className="input" value={form.shop} onChange={setF("shop")} />
            </div>
            <div className="field">
              <label className="label">Staff Member</label>
              <StaffMemberSelect
                value={form.conductedBy}
                onChange={(v) => setForm((f) => ({ ...f, conductedBy: v }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Garment Lines ── */}
      {step === 1 && (
        <div className="space-y-6">
          {items.map((item, index) => (
            <MtoGarmentCard
              key={item._id}
              item={item}
              index={index}
              total={items.length}
              pricing={itemPricing[index]}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
          <button type="button" onClick={addItem} className="btn-secondary w-full text-sm">
            + Add Another Garment
          </button>
        </div>
      )}

      {/* ── Step 3: Pricing Summary ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-cream border border-cream-dark p-4 text-xs text-green-muted leading-relaxed">
            <strong className="text-green">Pricing rules:</strong> Base price = retail price (VAT already included) + 60% surcharge.
            If using in-house fabric, no extra cost is added. If using external fabric, the fabric cost plus 20% VAT
            on that fabric cost only is added on top.
          </div>

          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Garment Pricing</h2>
            <table className="w-full mb-4">
              <thead>
                <tr className="bg-cream">
                  <th className="table-th">Garment</th>
                  <th className="table-th text-right">Retail Price</th>
                  <th className="table-th text-right">+60% Surcharge</th>
                  <th className="table-th text-right">External Fabric</th>
                  <th className="table-th text-right">Fabric VAT (20%)</th>
                  <th className="table-th text-right">Total inc. VAT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const p = itemPricing[i];
                  return (
                    <tr key={it._id} className="border-b border-cream-dark">
                      <td className="px-4 py-3 text-sm">{it.garmentName || `Garment ${i + 1}`}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">£{(parseFloat(it.retailPrice) || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">£{p.surcharge.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">
                        {it.externalFabric ? `£${(parseFloat(it.externalFabricCost) || 0).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">
                        {it.externalFabric ? `£${p.externalFabricVat.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">£{p.totalIncVat.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-sm font-medium border-t border-cream-dark pt-2">
                <span className="text-green">Order Total inc. VAT</span>
                <span className="text-green">£{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">50% Deposit Required</span>
                <span className="text-green font-medium">£{totals.depositRequired.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Payment ── */}
      {step === 3 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Payment</h2>

          <div className="flex justify-between text-sm bg-cream/50 px-4 py-3 border border-cream-dark">
            <span className="text-green-muted">Order Total inc. VAT</span>
            <span className="text-green font-medium">£{totals.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm bg-cream/50 px-4 py-3 border border-cream-dark">
            <span className="text-green-muted">Deposit Required (50%)</span>
            <span className="text-green font-medium">£{totals.depositRequired.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="field">
              <label className="label">Deposit Paid (£)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.depositPaid} onChange={setF("depositPaid")} />
            </div>
            <div className="field">
              <label className="label">Deposit Paid Date</label>
              <input type="date" className="input" value={form.depositPaidDate} onChange={setF("depositPaidDate")} />
            </div>
            <div className="field">
              <label className="label">Balance Paid Date</label>
              <input type="date" className="input" value={form.balancePaidDate} onChange={setF("balancePaidDate")} />
            </div>
            <div className="field pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.fullyPaid}
                  onChange={(e) => setForm((f) => ({ ...f, fullyPaid: e.target.checked }))}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm text-green">Fully paid</span>
              </label>
            </div>
          </div>

          {form.depositPaid && (
            <div className={`flex justify-between text-sm font-medium max-w-md ${balanceDue > 0 ? "text-amber-700" : "text-green"}`}>
              <span>Balance Due</span>
              <span>£{Math.max(0, balanceDue).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 5: Dates ── */}
      {step === 4 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Dates & Status</h2>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="field">
              <label className="label">Date Required</label>
              <input type="date" className="input" value={form.dateRequired} onChange={setF("dateRequired")} />
            </div>
            <div className="field">
              <label className="label">Submission Date</label>
              <input type="date" className="input" value={form.submissionDate} onChange={setF("submissionDate")} />
            </div>
          </div>

          {estimatedArrival && (
            <div className="text-sm text-green-muted">
              Estimated arrival (guide, ~10 weeks from submission):{" "}
              <span className="text-green font-medium">{estimatedArrival.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
          )}

          <div className="field max-w-xs">
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={setF("status")}>
              {MTO_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Notes (e.g. external fabric details — supplier, bunch, code, length ordered)</label>
            <textarea rows={4} className="textarea" value={form.notes} onChange={setF("notes")} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary">← Back</button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="btn-primary">Next →</button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !form.customerId}
            className={step === STEPS.length - 1 ? "btn-gold" : "btn-secondary text-sm"}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Save MTO Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Garment Card ─────────────────────────────────────────────────────────────
function MtoGarmentCard({
  item,
  index,
  total,
  pricing,
  onUpdate,
  onRemove,
}: {
  item: MtoItemData;
  index: number;
  total: number;
  pricing: { surcharge: number; externalFabricVat: number; totalIncVat: number };
  onUpdate: (i: number, patch: Partial<MtoItemData>) => void;
  onRemove: (i: number) => void;
}) {
  const set =
    (key: keyof MtoItemData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onUpdate(index, { [key]: e.target.value } as Partial<MtoItemData>);

  return (
    <div className="bg-white border border-cream-dark overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark bg-cream/50">
        <span className="text-xs uppercase tracking-widest text-green-muted">Garment {index + 1}</span>
        {total > 1 && (
          <button type="button" onClick={() => onRemove(index)} className="text-xs text-red-600 hover:underline">
            Remove
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Garment Name *</label>
            <input className="input" placeholder="e.g. Iona Jacket" value={item.garmentName} onChange={set("garmentName")} />
          </div>
          <div className="field">
            <label className="label">Block Size</label>
            <input className="input" value={item.blockSize} onChange={set("blockSize")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Lining</label>
            <input className="input" value={item.lining} onChange={set("lining")} />
          </div>
          <div className="field">
            <label className="label">Internal</label>
            <input className="input" value={item.internal} onChange={set("internal")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <label className="label">Accents</label>
            <input className="input" value={item.accents} onChange={set("accents")} />
          </div>
          <div className="field">
            <label className="label">Buttons</label>
            <input className="input" value={item.buttons} onChange={set("buttons")} />
          </div>
        </div>

        <div className="divider" />

        {/* Fabric source toggle */}
        <div className="field">
          <label className="label">Fabric Source</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdate(index, { externalFabric: false, cloth: "" })}
              className={`flex-1 text-sm px-3 py-2 border transition-colors ${
                !item.externalFabric ? "bg-green text-cream border-green" : "border-cream-dark text-green hover:border-gold"
              }`}
            >
              In-house fabric
            </button>
            <button
              type="button"
              onClick={() => onUpdate(index, { externalFabric: true })}
              className={`flex-1 text-sm px-3 py-2 border transition-colors ${
                item.externalFabric ? "bg-green text-cream border-green" : "border-cream-dark text-green hover:border-gold"
              }`}
            >
              External fabric
            </button>
          </div>
        </div>

        {!item.externalFabric ? (
          <div className="field">
            <label className="label">Cloth</label>
            <input className="input" value={item.cloth} onChange={set("cloth")} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="warning-yellow">
              External fabric — cloth will show as &quot;See notes&quot;. Record supplier, bunch, code and length ordered in the order notes (Dates step).
            </div>
            <div className="field">
              <label className="label">External Fabric Cost (£)</label>
              <input type="number" step="0.01" min="0" className="input max-w-xs" value={item.externalFabricCost} onChange={set("externalFabricCost")} />
            </div>
          </div>
        )}

        <div className="field">
          <label className="label">Retail Price (£, VAT included)</label>
          <input type="number" step="0.01" min="0" className="input max-w-xs" value={item.retailPrice} onChange={set("retailPrice")} />
        </div>

        <div className="field">
          <label className="label">Notes</label>
          <textarea rows={2} className="textarea" value={item.notes} onChange={set("notes")} />
        </div>

        {/* Live pricing preview */}
        <div className="bg-cream/50 border border-cream-dark px-4 py-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-green-muted">Retail price (incl. VAT)</span>
            <span className="text-green">£{(parseFloat(item.retailPrice) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-muted">+ 60% surcharge</span>
            <span className="text-green">£{pricing.surcharge.toFixed(2)}</span>
          </div>
          {item.externalFabric && (
            <>
              <div className="flex justify-between">
                <span className="text-green-muted">+ External fabric cost</span>
                <span className="text-green">£{(parseFloat(item.externalFabricCost) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-muted">+ Fabric VAT (20%)</span>
                <span className="text-green">£{pricing.externalFabricVat.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-medium border-t border-cream-dark pt-1">
            <span className="text-green">Total inc. VAT</span>
            <span className="text-green">£{pricing.totalIncVat.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
