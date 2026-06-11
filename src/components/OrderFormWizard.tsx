"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StaffMemberSelect from "./StaffMemberSelect";
import {
  MAKING_RATES,
  FABRIC_METERAGE_DEFAULTS,
  BLOCK_FEE,
  GARMENT_MEASUREMENTS,
  calculateItemPricing,
  calculateOrderTotals,
} from "@/lib/makingRates";

const GARMENT_TYPES = [
  { value: "JACKET", label: "Jacket" },
  { value: "TROUSERS", label: "Trousers" },
  { value: "SKIRT", label: "Skirt" },
  { value: "WAISTCOAT", label: "Waistcoat" },
  { value: "THREE_QUARTER_COAT", label: "¾ Coat" },
  { value: "FULL_LENGTH_COAT", label: "Full Length Coat" },
];

export const ORDER_STATUSES = [
  { value: "CONSULTATION_BOOKED", label: "Consultation Booked" },
  { value: "DEPOSIT_TAKEN", label: "Deposit Taken" },
  { value: "BRIEF_SENT_TO_TAILOR", label: "Brief Sent to Tailor" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "FITTING_SCHEDULED", label: "Fitting Scheduled" },
  { value: "COMPLETE", label: "Complete" },
  { value: "DELIVERED", label: "Delivered" },
];

export interface OrderItemData {
  _id: string; // local only for UI keying
  garmentType: string;
  fabricPattern: string;
  fabricDescription: string;
  fabricCode: string;
  fabricColour: string;
  fabricPricePerMetre: string;
  fabricMeterage: string;
  lining: boolean;
  liningColour: string;
  liningDescription: string;
  buttons: string;
  buttonCount: string;
  pockets: string;
  lapelStyle: string;
  ventStyle: string;
  sleeveButtons: string;
  waistbandStyle: string;
  hemStyle: string;
  additionalConstructionNotes: string;
  measurements: Record<string, string>; // { chest: "38.5", ... }
  measurementNotes: string;
  sketchUrl: string;
  inspirationImageUrls: string[];
  fabricSwatchUrl: string;
  makingRate: string;
}

interface OrderFormData {
  customerId: string;
  preConsultationId: string;
  conductedBy: string;
  appointmentDate: string;
  blockFee: string;
  depositPaid: string;
  depositPaidDate: string;
  balancePaidDate: string;
  fullyPaid: boolean;
  status: string;
  estimatedCompletionDate: string;
  briefSentAt: string;
  fittingDate: string;
  completedAt: string;
  deliveredAt: string;
  internalNotes: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  hasBlock: boolean;
  measurements?: Record<string, unknown> | null;
}

interface PreConsultation {
  id: string;
  customerId: string;
  garmentType?: string | null;
  occasionOrPurpose?: string | null;
}

let _uid = 0;
function uid() { return `item-${++_uid}`; }

function blankItem(garmentType = ""): OrderItemData {
  return {
    _id: uid(),
    garmentType,
    fabricPattern: "plain",
    fabricDescription: "",
    fabricCode: "",
    fabricColour: "",
    fabricPricePerMetre: "",
    fabricMeterage: "",
    lining: false,
    liningColour: "",
    liningDescription: "",
    buttons: "",
    buttonCount: "",
    pockets: "",
    lapelStyle: "",
    ventStyle: "",
    sleeveButtons: "",
    waistbandStyle: "",
    hemStyle: "",
    additionalConstructionNotes: "",
    measurements: {},
    measurementNotes: "",
    sketchUrl: "",
    inspirationImageUrls: [],
    fabricSwatchUrl: "",
    makingRate: "",
  };
}

const STEPS = ["Customer & Appointment", "Garments", "Pricing", "Status & Timeline"];

export default function OrderFormWizard({
  customers,
  preConsultations,
  defaultCustomerId,
  defaultPreConsultationId,
  existing,
}: {
  customers: Customer[];
  preConsultations: PreConsultation[];
  defaultCustomerId?: string;
  defaultPreConsultationId?: string;
  existing?: Record<string, unknown>;
}) {
  const router = useRouter();
  const isEdit = !!existing;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Header form ──────────────────────────────────────────────────────────
  const [form, setForm] = useState<OrderFormData>(() => {
    if (existing) {
      return {
        customerId: (existing.customerId as string) ?? "",
        preConsultationId: (existing.preConsultationId as string) ?? "",
        conductedBy: (existing.conductedBy as string) ?? "Carla",
        appointmentDate: existing.appointmentDate
          ? new Date(existing.appointmentDate as string).toISOString().slice(0, 16)
          : "",
        blockFee: existing.blockFee != null ? String(existing.blockFee) : "",
        depositPaid: existing.depositPaid != null ? String(existing.depositPaid) : "",
        depositPaidDate: existing.depositPaidDate
          ? new Date(existing.depositPaidDate as string).toISOString().split("T")[0]
          : "",
        balancePaidDate: existing.balancePaidDate
          ? new Date(existing.balancePaidDate as string).toISOString().split("T")[0]
          : "",
        fullyPaid: Boolean(existing.fullyPaid),
        status: (existing.status as string) ?? "CONSULTATION_BOOKED",
        estimatedCompletionDate: existing.estimatedCompletionDate
          ? new Date(existing.estimatedCompletionDate as string).toISOString().split("T")[0]
          : "",
        briefSentAt: existing.briefSentAt
          ? new Date(existing.briefSentAt as string).toISOString().split("T")[0]
          : "",
        fittingDate: existing.fittingDate
          ? new Date(existing.fittingDate as string).toISOString().split("T")[0]
          : "",
        completedAt: existing.completedAt
          ? new Date(existing.completedAt as string).toISOString().split("T")[0]
          : "",
        deliveredAt: existing.deliveredAt
          ? new Date(existing.deliveredAt as string).toISOString().split("T")[0]
          : "",
        internalNotes: (existing.internalNotes as string) ?? "",
      };
    }
    return {
      customerId: defaultCustomerId ?? "",
      preConsultationId: defaultPreConsultationId ?? "",
      conductedBy: "Carla",
      appointmentDate: "",
      blockFee: "",
      depositPaid: "",
      depositPaidDate: "",
      balancePaidDate: "",
      fullyPaid: false,
      status: "CONSULTATION_BOOKED",
      estimatedCompletionDate: "",
      briefSentAt: "",
      fittingDate: "",
      completedAt: "",
      deliveredAt: "",
      internalNotes: "",
    };
  });

  // ── Items ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<OrderItemData[]>(() => {
    if (existing && Array.isArray((existing as Record<string, unknown>).items)) {
      const existingItems = (existing as Record<string, unknown>).items as Record<string, unknown>[];
      return existingItems.map((it) => ({
        _id: uid(),
        garmentType: (it.garmentType as string) ?? "",
        fabricPattern: (it.fabricPattern as string) ?? "plain",
        fabricDescription: (it.fabricDescription as string) ?? "",
        fabricCode: (it.fabricCode as string) ?? "",
        fabricColour: (it.fabricColour as string) ?? "",
        fabricPricePerMetre: it.fabricPricePerMetre != null ? String(it.fabricPricePerMetre) : "",
        fabricMeterage: it.fabricMeterage != null ? String(it.fabricMeterage) : "",
        lining: Boolean(it.lining),
        liningColour: (it.liningColour as string) ?? "",
        liningDescription: (it.liningDescription as string) ?? "",
        buttons: (it.buttons as string) ?? "",
        buttonCount: it.buttonCount != null ? String(it.buttonCount) : "",
        pockets: (it.pockets as string) ?? "",
        lapelStyle: (it.lapelStyle as string) ?? "",
        ventStyle: (it.ventStyle as string) ?? "",
        sleeveButtons: it.sleeveButtons != null ? String(it.sleeveButtons) : "",
        waistbandStyle: (it.waistbandStyle as string) ?? "",
        hemStyle: (it.hemStyle as string) ?? "",
        additionalConstructionNotes: (it.additionalConstructionNotes as string) ?? "",
        measurements: (it.measurements as Record<string, string>) ?? {},
        measurementNotes: (it.measurementNotes as string) ?? "",
        sketchUrl: (it.sketchUrl as string) ?? "",
        inspirationImageUrls: Array.isArray(it.inspirationImageUrls) ? it.inspirationImageUrls as string[] : [],
        fabricSwatchUrl: (it.fabricSwatchUrl as string) ?? "",
        makingRate: it.makingRate != null ? String(it.makingRate) : "",
      }));
    }
    return [blankItem()];
  });

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  // Auto-set block fee: £350 × number of garments for new customers, £0 for returning
  useEffect(() => {
    if (!form.customerId) return;
    const c = customers.find((c) => c.id === form.customerId);
    if (!c) return;
    const garmentCount = Math.max(1, items.length);
    setForm((f) => ({ ...f, blockFee: c.hasBlock ? "0" : String(BLOCK_FEE * garmentCount) }));
  }, [form.customerId, customers, items.length]);

  // ── Item helpers ──────────────────────────────────────────────────────────
  function updateItem(index: number, patch: Partial<OrderItemData>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, blankItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // When garmentType or fabricPattern changes, auto-fill making rate, meterage,
  // and measurements from customer profile
  function onGarmentChange(index: number, garmentType: string, fabricPattern?: string) {
    const pattern = (fabricPattern ?? items[index].fabricPattern) as "plain" | "check";
    const rate = MAKING_RATES[garmentType]?.[pattern]?.exVat;
    const meterage = FABRIC_METERAGE_DEFAULTS[garmentType];

    // Pull measurements from stored customer profile
    const storedM = selectedCustomer?.measurements as Record<string, unknown> | null | undefined;
    const mFields = GARMENT_MEASUREMENTS[garmentType] ?? [];
    const measurements: Record<string, string> = {};
    if (storedM) {
      for (const { key } of mFields) {
        const val = storedM[key];
        if (val !== null && val !== undefined) measurements[key] = String(val);
      }
    }

    updateItem(index, {
      garmentType,
      fabricPattern: pattern,
      makingRate: rate != null ? String(rate) : "",
      fabricMeterage: meterage != null ? String(meterage) : "",
      measurements,
    });
  }

  function onPatternChange(index: number, fabricPattern: string) {
    const garmentType = items[index].garmentType;
    if (!garmentType) return;
    const rate = MAKING_RATES[garmentType]?.[fabricPattern as "plain" | "check"]?.exVat;
    updateItem(index, {
      fabricPattern,
      makingRate: rate != null ? String(rate) : items[index].makingRate,
    });
  }

  function onMeasurementChange(index: number, key: string, value: string) {
    const newM = { ...items[index].measurements, [key]: value };
    updateItem(index, { measurements: newM });
  }

  async function handleImageUpload(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
    field: "sketchUrl" | "fabricSwatchUrl" | "inspirationImageUrls"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (field === "inspirationImageUrls") {
        updateItem(index, { inspirationImageUrls: [...items[index].inspirationImageUrls, base64] });
      } else {
        updateItem(index, { [field]: base64 });
      }
    };
    reader.readAsDataURL(file);
  }

  // ── Pricing calc ──────────────────────────────────────────────────────────
  const itemSubtotals = items.map((it) => {
    const { itemSubtotal } = calculateItemPricing(
      parseFloat(it.makingRate) || 0,
      parseFloat(it.fabricPricePerMetre) || 0,
      parseFloat(it.fabricMeterage) || 0
    );
    return itemSubtotal;
  });

  const totals = calculateOrderTotals(itemSubtotals, parseFloat(form.blockFee) || 0);
  const balanceDue = totals.totalIncVat - (parseFloat(form.depositPaid) || 0);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    if (!form.customerId) { setError("Please select a customer."); return; }
    if (items.length === 0 || !items[0].garmentType) { setError("Please add at least one garment."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        garmentType: items[0].garmentType,
        subtotalExVat: totals.subtotalExVat,
        vatAmount: totals.vatAmount,
        totalIncVat: totals.totalIncVat,
        depositRequired: totals.depositRequired,
        items: items.map((it) => {
          const { itemSubtotal } = calculateItemPricing(
            parseFloat(it.makingRate) || 0,
            parseFloat(it.fabricPricePerMetre) || 0,
            parseFloat(it.fabricMeterage) || 0
          );
          return { ...it, itemSubtotal };
        }),
      };

      const url = isEdit ? `/api/orders/${(existing as Record<string, unknown>).id}` : "/api/orders";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const setF =
    (key: keyof OrderFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const filteredPreConsultations = preConsultations.filter(
    (p) => !form.customerId || p.customerId === form.customerId
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl">
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

      {/* ── Step 1: Customer & Appointment ── */}
      {step === 0 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Customer & Appointment</h2>

          <div className="field">
            <label className="label">Customer *</label>
            <select required className="select" value={form.customerId} onChange={setF("customerId")}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName}, {c.firstName}{c.hasBlock ? " (block cut)" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && !selectedCustomer.hasBlock && (
            <div className="warning-yellow">
              First order for this customer — block fee of £{BLOCK_FEE} ex. VAT applies per garment (calculated automatically on the Pricing step).
            </div>
          )}

          {filteredPreConsultations.length > 0 && (
            <div className="field">
              <label className="label">Pre-Consultation Form (optional)</label>
              <select className="select" value={form.preConsultationId} onChange={setF("preConsultationId")}>
                <option value="">— None —</option>
                {filteredPreConsultations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.garmentType?.replace(/_/g, " ") ?? "General"}{p.occasionOrPurpose ? ` — ${p.occasionOrPurpose}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Appointment Date</label>
              <input type="datetime-local" className="input" value={form.appointmentDate} onChange={setF("appointmentDate")} />
            </div>
            <div className="field">
              <label className="label">Conducted By</label>
              <StaffMemberSelect
                value={form.conductedBy}
                onChange={(v) => setForm((f) => ({ ...f, conductedBy: v }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Garments ── */}
      {step === 1 && (
        <div className="space-y-6">
          {items.map((item, index) => (
            <GarmentCard
              key={item._id}
              item={item}
              index={index}
              total={items.length}
              selectedCustomer={selectedCustomer}
              onGarmentChange={onGarmentChange}
              onPatternChange={onPatternChange}
              onUpdate={updateItem}
              onRemove={removeItem}
              onMeasurementChange={onMeasurementChange}
              onImageUpload={handleImageUpload}
            />
          ))}

          <button
            type="button"
            onClick={addItem}
            className="btn-secondary w-full text-sm"
          >
            + Add Another Garment
          </button>
        </div>
      )}

      {/* ── Step 3: Pricing ── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Per-item breakdown */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Garment Costs</h2>
            <table className="w-full mb-4">
              <thead>
                <tr className="bg-cream">
                  <th className="table-th">Garment</th>
                  <th className="table-th text-right">Making Rate</th>
                  <th className="table-th text-right">Fabric Cost</th>
                  <th className="table-th text-right">Item Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const { fabricCost, itemSubtotal } = calculateItemPricing(
                    parseFloat(it.makingRate) || 0,
                    parseFloat(it.fabricPricePerMetre) || 0,
                    parseFloat(it.fabricMeterage) || 0
                  );
                  const label = GARMENT_TYPES.find((g) => g.value === it.garmentType)?.label ?? it.garmentType;
                  const warn = it.garmentType ? MAKING_RATES[it.garmentType]?.[it.fabricPattern as "plain" | "check"]?.note : null;
                  return (
                    <tr key={it._id} className="border-b border-cream-dark">
                      <td className="px-4 py-3 text-sm">
                        {label || `Garment ${i + 1}`}
                        {warn && <div className="text-xs text-amber-700 mt-0.5">{warn}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">
                        <input
                          type="number"
                          step="0.01"
                          className="input w-28 text-right"
                          value={it.makingRate}
                          onChange={(e) => updateItem(i, { makingRate: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">£{fabricCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">£{itemSubtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Block fee */}
            <div className="flex items-center gap-4 border-t border-cream-dark pt-4">
              <div className="flex-1">
                <label className="label">Block Fee (£ ex. VAT)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input w-36"
                    value={form.blockFee}
                    onChange={setF("blockFee")}
                  />
                  <span className="text-xs text-green-muted">
                    {selectedCustomer?.hasBlock
                      ? "Block already cut — fee waived"
                      : `First order — £${BLOCK_FEE} × ${items.length} garment${items.length !== 1 ? "s" : ""} = £${BLOCK_FEE * items.length}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Order Total</h2>
            <div className="max-w-sm space-y-2">
              {[
                ["All garments subtotal", `£${totals.itemsTotal.toFixed(2)}`],
                ["Block fee", `£${(parseFloat(form.blockFee) || 0).toFixed(2)}`],
                ["Subtotal ex. VAT", `£${totals.subtotalExVat.toFixed(2)}`],
                ["VAT (20%)", `£${totals.vatAmount.toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-green-muted">{label}</span>
                  <span className="text-green">{val}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium border-t border-cream-dark pt-2">
                <span className="text-green">Total inc. VAT</span>
                <span className="text-green">£{totals.totalIncVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">50% Deposit Required</span>
                <span className="text-green font-medium">£{totals.depositRequired.toFixed(2)}</span>
              </div>
            </div>

            <div className="divider" />
            <h2 className="section-title">Payment</h2>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
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
              <div className={`flex justify-between text-sm font-medium mt-2 ${balanceDue > 0 ? "text-amber-700" : "text-green"}`}>
                <span>Balance Due</span>
                <span>£{Math.max(0, balanceDue).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Status & Timeline ── */}
      {step === 3 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Status & Timeline</h2>

          <div className="field">
            <label className="label">Order Status</label>
            <select className="select max-w-xs" value={form.status} onChange={setF("status")}>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {[
              ["Brief Sent to Tailor", "briefSentAt"],
              ["Est. Completion Date", "estimatedCompletionDate"],
              ["Fitting Date", "fittingDate"],
              ["Completed Date", "completedAt"],
              ["Delivered Date", "deliveredAt"],
            ].map(([label, key]) => (
              <div key={key} className="field">
                <label className="label">{label}</label>
                <input type="date" className="input" value={form[key as keyof OrderFormData] as string} onChange={setF(key as keyof OrderFormData)} />
              </div>
            ))}
          </div>

          <div className="field">
            <label className="label">Internal Notes (not shown on tailor brief)</label>
            <textarea rows={4} className="textarea" value={form.internalNotes} onChange={setF("internalNotes")} />
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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Garment Card ─────────────────────────────────────────────────────────────
function GarmentCard({
  item,
  index,
  total,
  selectedCustomer,
  onGarmentChange,
  onPatternChange,
  onUpdate,
  onRemove,
  onMeasurementChange,
  onImageUpload,
}: {
  item: OrderItemData;
  index: number;
  total: number;
  selectedCustomer?: Customer;
  onGarmentChange: (i: number, type: string, pattern?: string) => void;
  onPatternChange: (i: number, pattern: string) => void;
  onUpdate: (i: number, patch: Partial<OrderItemData>) => void;
  onRemove: (i: number) => void;
  onMeasurementChange: (i: number, key: string, val: string) => void;
  onImageUpload: (i: number, e: React.ChangeEvent<HTMLInputElement>, field: "sketchUrl" | "fabricSwatchUrl" | "inspirationImageUrls") => void;
}) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"fabric" | "construction" | "measurements" | "images">("fabric");

  const garmentLabel = GARMENT_TYPES.find((g) => g.value === item.garmentType)?.label ?? `Garment ${index + 1}`;
  const measurementFields = GARMENT_MEASUREMENTS[item.garmentType] ?? [];
  const storedM = selectedCustomer?.measurements as Record<string, unknown> | null | undefined;

  const warning = item.garmentType
    ? MAKING_RATES[item.garmentType]?.[item.fabricPattern as "plain" | "check"]?.note
    : null;

  const set =
    (key: keyof OrderItemData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onUpdate(index, { [key]: e.target.value } as Partial<OrderItemData>);

  const tabs: { key: "fabric" | "construction" | "measurements" | "images"; label: string }[] = [
    { key: "fabric", label: "Fabric" },
    { key: "construction", label: "Construction" },
    { key: "measurements", label: `Measurements (${measurementFields.length})` },
    { key: "images", label: "Sketch & Images" },
  ];

  return (
    <div className="bg-white border border-cream-dark overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark bg-cream/50">
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-widest text-green-muted">
            Garment {index + 1}
          </span>
          <div className="flex gap-2">
            <select
              className="select text-sm py-1 min-w-36"
              value={item.garmentType}
              onChange={(e) => onGarmentChange(index, e.target.value)}
            >
              <option value="">— Select type —</option>
              {GARMENT_TYPES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            <select
              className="select text-sm py-1 w-24"
              value={item.fabricPattern}
              onChange={(e) => onPatternChange(index, e.target.value)}
            >
              <option value="plain">Plain</option>
              <option value="check">Check</option>
            </select>
          </div>
          {warning && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
              ⚠ {warning}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {total > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-green-muted hover:text-green"
          >
            {open ? "Collapse ▲" : "Expand ▼"}
          </button>
        </div>
      </div>

      {open && (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-cream-dark">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-xs transition-colors border-r border-cream-dark last:border-r-0 ${
                  activeTab === t.key
                    ? "bg-green text-cream"
                    : "bg-white text-green-muted hover:bg-cream"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Fabric tab */}
            {activeTab === "fabric" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="label">Fabric Description</label>
                    <input className="input" placeholder="e.g. Harris Tweed herringbone" value={item.fabricDescription} onChange={set("fabricDescription")} />
                  </div>
                  <div className="field">
                    <label className="label">Fabric Code</label>
                    <input className="input" placeholder="e.g. HT-WHB" value={item.fabricCode} onChange={set("fabricCode")} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Colour</label>
                  <input className="input" value={item.fabricColour} onChange={set("fabricColour")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="label">Price per Metre (£ ex. VAT)</label>
                    <input type="number" step="0.01" min="0" className="input" value={item.fabricPricePerMetre} onChange={set("fabricPricePerMetre")} />
                  </div>
                  <div className="field">
                    <label className="label">
                      Meterage{item.garmentType === "SKIRT" && <span className="text-amber-700 ml-1">— confirm with Tailor</span>}
                    </label>
                    <input type="number" step="0.25" min="0" className="input" value={item.fabricMeterage} onChange={set("fabricMeterage")} />
                  </div>
                </div>
                {item.fabricPricePerMetre && item.fabricMeterage && (
                  <div className="text-sm text-green">
                    Fabric cost: <strong>£{(parseFloat(item.fabricPricePerMetre) * parseFloat(item.fabricMeterage)).toFixed(2)}</strong> ex. VAT
                  </div>
                )}
              </div>
            )}

            {/* Construction tab */}
            {activeTab === "construction" && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={item.lining} onChange={(e) => onUpdate(index, { lining: e.target.checked })} className="w-4 h-4 accent-gold" />
                  <span className="text-sm text-green">Lined</span>
                </label>
                {item.lining && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="field">
                      <label className="label">Lining Colour</label>
                      <input className="input" value={item.liningColour} onChange={set("liningColour")} />
                    </div>
                    <div className="field">
                      <label className="label">Lining Description</label>
                      <input className="input" value={item.liningDescription} onChange={set("liningDescription")} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="label">Buttons</label>
                    <input className="input" value={item.buttons} onChange={set("buttons")} />
                  </div>
                  <div className="field">
                    <label className="label">Button Count</label>
                    <input type="number" min="0" className="input" value={item.buttonCount} onChange={set("buttonCount")} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Pockets</label>
                  <input className="input" value={item.pockets} onChange={set("pockets")} />
                </div>
                {["JACKET", "WAISTCOAT", "THREE_QUARTER_COAT", "FULL_LENGTH_COAT"].includes(item.garmentType) && (
                  <div className="field">
                    <label className="label">Lapel Style</label>
                    <input className="input" placeholder="e.g. Notch, Peak, Shawl" value={item.lapelStyle} onChange={set("lapelStyle")} />
                  </div>
                )}
                {["JACKET", "THREE_QUARTER_COAT", "FULL_LENGTH_COAT"].includes(item.garmentType) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="field">
                      <label className="label">Vent Style</label>
                      <select className="select" value={item.ventStyle} onChange={set("ventStyle")}>
                        <option value="">— Select —</option>
                        {["SINGLE", "DOUBLE", "NONE"].map((v) => (
                          <option key={v} value={v}>{v.charAt(0) + v.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    {item.garmentType === "JACKET" && (
                      <div className="field">
                        <label className="label">Sleeve Buttons</label>
                        <input type="number" min="0" max="6" className="input" value={item.sleeveButtons} onChange={set("sleeveButtons")} />
                      </div>
                    )}
                  </div>
                )}
                {["TROUSERS", "SKIRT"].includes(item.garmentType) && (
                  <div className="field">
                    <label className="label">Waistband Style</label>
                    <input className="input" value={item.waistbandStyle} onChange={set("waistbandStyle")} />
                  </div>
                )}
                <div className="field">
                  <label className="label">Hem Style</label>
                  <input className="input" value={item.hemStyle} onChange={set("hemStyle")} />
                </div>
                <div className="field">
                  <label className="label">Additional Construction Notes</label>
                  <textarea rows={3} className="textarea" value={item.additionalConstructionNotes} onChange={set("additionalConstructionNotes")} />
                </div>
              </div>
            )}

            {/* Measurements tab */}
            {activeTab === "measurements" && (
              <div>
                {!item.garmentType ? (
                  <p className="text-sm text-green-muted">Select a garment type to see relevant measurements.</p>
                ) : (
                  <>
                    {storedM ? (
                      <p className="text-xs text-green-muted mb-4">
                        Pre-filled from this customer&apos;s stored measurements. Edit any field to override for this order.
                      </p>
                    ) : (
                      <div className="warning-yellow mb-4">
                        No stored measurements for this customer.
                        {selectedCustomer && (
                          <> <a href={`/customers/${selectedCustomer.id}/measurements`} target="_blank" rel="noreferrer" className="underline">Add measurements →</a></>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {measurementFields.map(({ key, label }) => {
                        const stored = storedM ? storedM[key] : null;
                        const current = item.measurements[key] ?? "";
                        const isDifferent = stored != null && String(stored) !== current && current !== "";
                        return (
                          <div key={key} className="field mb-0">
                            <label className="label">{label}</label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className={`input pr-6 ${isDifferent ? "border-gold ring-1 ring-gold" : ""}`}
                                placeholder={stored != null ? `Stored: ${stored}″` : "0.00"}
                                value={current}
                                onChange={(e) => onMeasurementChange(index, key, e.target.value)}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-muted pointer-events-none">″</span>
                            </div>
                            {isDifferent && (
                              <div className="text-xs text-gold mt-0.5">Stored: {String(stored)}″</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="field mt-4">
                      <label className="label">Measurement Notes / Adjustments</label>
                      <textarea rows={2} className="textarea" placeholder="Any per-garment adjustments…" value={item.measurementNotes} onChange={set("measurementNotes")} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Images tab */}
            {activeTab === "images" && (
              <div className="space-y-5">
                <div className="field">
                  <label className="label">Sketch</label>
                  <input type="file" accept="image/*" className="text-sm text-green" onChange={(e) => onImageUpload(index, e, "sketchUrl")} />
                  {item.sketchUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.sketchUrl} alt="Sketch" className="max-h-48 object-contain border border-cream-dark" />
                      <button type="button" className="text-xs text-red-600 mt-1" onClick={() => onUpdate(index, { sketchUrl: "" })}>Remove</button>
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="label">Fabric Swatch</label>
                  <input type="file" accept="image/*" className="text-sm text-green" onChange={(e) => onImageUpload(index, e, "fabricSwatchUrl")} />
                  {item.fabricSwatchUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.fabricSwatchUrl} alt="Swatch" className="max-h-32 object-contain border border-cream-dark" />
                      <button type="button" className="text-xs text-red-600 mt-1" onClick={() => onUpdate(index, { fabricSwatchUrl: "" })}>Remove</button>
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="label">Inspiration Images</label>
                  <input type="file" accept="image/*" className="text-sm text-green" onChange={(e) => onImageUpload(index, e, "inspirationImageUrls")} />
                  {item.inspirationImageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {item.inspirationImageUrls.map((url, j) => (
                        <div key={j} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Inspiration ${j + 1}`} className="h-24 w-24 object-cover border border-cream-dark" />
                          <button
                            type="button"
                            className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1"
                            onClick={() => onUpdate(index, { inspirationImageUrls: item.inspirationImageUrls.filter((_, k) => k !== j) })}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
