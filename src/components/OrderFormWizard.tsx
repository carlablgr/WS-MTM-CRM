"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MAKING_RATES, FABRIC_METERAGE_DEFAULTS, BLOCK_FEE, calculatePricing } from "@/lib/makingRates";

const GARMENT_TYPES = [
  { value: "JACKET", label: "Jacket" },
  { value: "TROUSERS", label: "Trousers" },
  { value: "SKIRT", label: "Skirt" },
  { value: "WAISTCOAT", label: "Waistcoat" },
  { value: "THREE_QUARTER_COAT", label: "¾ Coat" },
  { value: "FULL_LENGTH_COAT", label: "Full Length Coat" },
];

const ORDER_STATUSES = [
  { value: "CONSULTATION_BOOKED", label: "Consultation Booked" },
  { value: "DEPOSIT_TAKEN", label: "Deposit Taken" },
  { value: "BRIEF_SENT_TO_TAILOR", label: "Brief Sent to Tailor" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "FITTING_SCHEDULED", label: "Fitting Scheduled" },
  { value: "COMPLETE", label: "Complete" },
  { value: "DELIVERED", label: "Delivered" },
];

const VENT_STYLES = ["SINGLE", "DOUBLE", "NONE"];

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

interface OrderData {
  customerId: string;
  preConsultationId: string;
  conductedBy: string;
  appointmentDate: string;
  garmentType: string;
  fabricPattern: string; // "plain" | "check" — used to select making rate
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
  useStoredMeasurements: boolean;
  measurementNotes: string;
  sketchUrl: string;
  inspirationImageUrls: string[];
  fabricSwatchUrl: string;
  makingRate: string;
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

const emptyForm = (): OrderData => ({
  customerId: "",
  preConsultationId: "",
  conductedBy: "Carla",
  appointmentDate: "",
  garmentType: "",
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
  useStoredMeasurements: true,
  measurementNotes: "",
  sketchUrl: "",
  inspirationImageUrls: [],
  fabricSwatchUrl: "",
  makingRate: "",
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
});

const STEPS = [
  "Customer & Garment",
  "Fabric Details",
  "Construction",
  "Measurements",
  "Sketch & Images",
  "Pricing",
  "Status & Timeline",
];

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
  const [form, setForm] = useState<OrderData>(() => {
    if (existing) {
      return {
        ...emptyForm(),
        ...(existing as Partial<OrderData>),
        blockFee: existing.blockFee != null ? String(existing.blockFee) : "",
        makingRate: existing.makingRate != null ? String(existing.makingRate) : "",
        fabricPricePerMetre: existing.fabricPricePerMetre != null ? String(existing.fabricPricePerMetre) : "",
        fabricMeterage: existing.fabricMeterage != null ? String(existing.fabricMeterage) : "",
        depositPaid: existing.depositPaid != null ? String(existing.depositPaid) : "",
        lining: Boolean(existing.lining),
        useStoredMeasurements: existing.useStoredMeasurements !== false,
        fullyPaid: Boolean(existing.fullyPaid),
        inspirationImageUrls: Array.isArray(existing.inspirationImageUrls) ? existing.inspirationImageUrls as string[] : [],
        fabricPattern: "plain",
      };
    }
    const f = emptyForm();
    if (defaultCustomerId) f.customerId = defaultCustomerId;
    if (defaultPreConsultationId) f.preConsultationId = defaultPreConsultationId;
    return f;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  // Auto-fill block fee based on customer's hasBlock status
  useEffect(() => {
    if (!form.customerId) return;
    const c = customers.find((c) => c.id === form.customerId);
    if (!c) return;
    const fee = c.hasBlock ? "0" : String(BLOCK_FEE);
    setForm((f) => ({ ...f, blockFee: fee }));
  }, [form.customerId, customers]);

  // Auto-fill making rate and meterage when garmentType or pattern changes
  useEffect(() => {
    if (!form.garmentType) return;
    const rates = MAKING_RATES[form.garmentType];
    if (!rates) return;
    const pattern = (form.fabricPattern as "plain" | "check") ?? "plain";
    const rate = rates[pattern];
    setForm((f) => ({
      ...f,
      makingRate: String(rate.exVat),
      fabricMeterage: FABRIC_METERAGE_DEFAULTS[form.garmentType] != null
        ? String(FABRIC_METERAGE_DEFAULTS[form.garmentType])
        : "",
    }));
  }, [form.garmentType, form.fabricPattern]);

  // Compute pricing
  const pricing = (() => {
    const making = parseFloat(form.makingRate) || 0;
    const block = parseFloat(form.blockFee) || 0;
    const pricePerM = parseFloat(form.fabricPricePerMetre) || 0;
    const meterage = parseFloat(form.fabricMeterage) || 0;
    return calculatePricing(making, block, pricePerM, meterage);
  })();

  // Check for pricing warnings
  const garmentWarning = (() => {
    if (!form.garmentType) return null;
    const rates = MAKING_RATES[form.garmentType];
    if (!rates) return null;
    const pattern = (form.fabricPattern as "plain" | "check") ?? "plain";
    return rates[pattern]?.note ?? null;
  })();

  const set = (key: keyof OrderData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setBool = (key: keyof OrderData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.checked }));

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "sketchUrl" | "fabricSwatchUrl" | "inspirationImageUrls"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (field === "inspirationImageUrls") {
        setForm((f) => ({ ...f, inspirationImageUrls: [...f.inspirationImageUrls, base64] }));
      } else {
        setForm((f) => ({ ...f, [field]: base64 }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function save(asDraft = false) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        subtotalExVat: pricing.subtotalExVat,
        vatAmount: pricing.vatAmount,
        totalIncVat: pricing.totalIncVat,
        depositRequired: pricing.depositRequired,
        status: asDraft ? form.status : form.status,
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

  const filteredPreConsultations = preConsultations.filter(
    (p) => !form.customerId || p.customerId === form.customerId
  );

  return (
    <div className="max-w-3xl">
      {/* Step nav */}
      <div className="flex gap-0 mb-8 border border-cream-dark overflow-hidden">
        {STEPS.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 px-3 py-2.5 text-xs transition-colors border-r border-cream-dark last:border-r-0 ${
              i === step
                ? "bg-green text-cream"
                : i < step
                ? "bg-cream-dark text-green"
                : "bg-white text-green-muted hover:bg-cream"
            }`}
          >
            <div className="font-medium">{i + 1}</div>
            <div className="hidden sm:block mt-0.5 leading-tight">{s}</div>
          </button>
        ))}
      </div>

      {error && <div className="warning-red mb-4">{error}</div>}

      {/* Step 1: Customer & Garment */}
      {step === 0 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Customer & Garment</h2>

          <div className="field">
            <label className="label">Customer *</label>
            <select required className="select" value={form.customerId} onChange={set("customerId")}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName}, {c.firstName}{c.hasBlock ? " (block cut)" : ""}
                </option>
              ))}
            </select>
          </div>

          {filteredPreConsultations.length > 0 && (
            <div className="field">
              <label className="label">Pre-Consultation Form (optional)</label>
              <select className="select" value={form.preConsultationId} onChange={set("preConsultationId")}>
                <option value="">— None —</option>
                {filteredPreConsultations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.garmentType?.replace("_", " ") ?? "General"}{p.occasionOrPurpose ? ` — ${p.occasionOrPurpose}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Garment Type *</label>
              <select required className="select" value={form.garmentType} onChange={set("garmentType")}>
                <option value="">— Select —</option>
                {GARMENT_TYPES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Pattern Type</label>
              <select className="select" value={form.fabricPattern} onChange={set("fabricPattern")}>
                <option value="plain">Plain</option>
                <option value="check">Check</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Appointment Date</label>
              <input type="datetime-local" className="input" value={form.appointmentDate} onChange={set("appointmentDate")} />
            </div>
            <div className="field">
              <label className="label">Conducted By</label>
              <input className="input" value={form.conductedBy} onChange={set("conductedBy")} />
            </div>
          </div>

          {selectedCustomer && !selectedCustomer.hasBlock && (
            <div className="warning-yellow">
              This customer does not yet have a block cut. A block fee of £350 ex. VAT will be added automatically.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Fabric */}
      {step === 1 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Fabric Details</h2>

          {garmentWarning && form.garmentType === "SKIRT" && (
            <div className="warning-yellow">{garmentWarning}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Fabric Description</label>
              <input className="input" placeholder="e.g. Harris Tweed herringbone" value={form.fabricDescription} onChange={set("fabricDescription")} />
            </div>
            <div className="field">
              <label className="label">Fabric Code</label>
              <input className="input" placeholder="e.g. HT-WHB, CW-PL" value={form.fabricCode} onChange={set("fabricCode")} />
            </div>
          </div>

          <div className="field">
            <label className="label">Colour</label>
            <input className="input" value={form.fabricColour} onChange={set("fabricColour")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Price per Metre (£ ex. VAT)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.fabricPricePerMetre} onChange={set("fabricPricePerMetre")} />
            </div>
            <div className="field">
              <label className="label">
                Meterage (m)
                {form.garmentType === "SKIRT" && (
                  <span className="text-amber-700 ml-1">— confirm with Anthony</span>
                )}
              </label>
              <input type="number" step="0.25" min="0" className="input" value={form.fabricMeterage} onChange={set("fabricMeterage")} />
            </div>
          </div>

          {form.fabricPricePerMetre && form.fabricMeterage && (
            <div className="text-sm text-green">
              Fabric total: <strong>£{(parseFloat(form.fabricPricePerMetre) * parseFloat(form.fabricMeterage)).toFixed(2)}</strong> ex. VAT
            </div>
          )}
        </div>
      )}

      {/* Step 3: Construction */}
      {step === 2 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Construction Details</h2>

          <div className="field pt-2 border-t border-cream-dark">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.lining} onChange={setBool("lining")} className="w-4 h-4 accent-gold" />
              <span className="text-sm text-green">Lined</span>
            </label>
          </div>

          {form.lining && (
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="label">Lining Colour</label>
                <input className="input" value={form.liningColour} onChange={set("liningColour")} />
              </div>
              <div className="field">
                <label className="label">Lining Description</label>
                <input className="input" value={form.liningDescription} onChange={set("liningDescription")} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Buttons</label>
              <input className="input" placeholder="Description of buttons…" value={form.buttons} onChange={set("buttons")} />
            </div>
            <div className="field">
              <label className="label">Button Count</label>
              <input type="number" min="0" className="input" value={form.buttonCount} onChange={set("buttonCount")} />
            </div>
          </div>

          <div className="field">
            <label className="label">Pockets</label>
            <input className="input" placeholder="Pocket style and placement…" value={form.pockets} onChange={set("pockets")} />
          </div>

          {/* Jacket-specific */}
          {(form.garmentType === "JACKET" || form.garmentType === "WAISTCOAT") && (
            <div className="field">
              <label className="label">Lapel Style</label>
              <input className="input" placeholder="e.g. Notch, Peak, Shawl" value={form.lapelStyle} onChange={set("lapelStyle")} />
            </div>
          )}

          {/* Jacket/Coat vents */}
          {["JACKET", "THREE_QUARTER_COAT", "FULL_LENGTH_COAT"].includes(form.garmentType) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="label">Vent Style</label>
                <select className="select" value={form.ventStyle} onChange={set("ventStyle")}>
                  <option value="">— Select —</option>
                  {VENT_STYLES.map((v) => (
                    <option key={v} value={v}>{v.charAt(0) + v.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              {form.garmentType === "JACKET" && (
                <div className="field">
                  <label className="label">Sleeve Buttons</label>
                  <input type="number" min="0" max="6" className="input" value={form.sleeveButtons} onChange={set("sleeveButtons")} />
                </div>
              )}
            </div>
          )}

          {/* Trouser/Skirt waistband */}
          {["TROUSERS", "SKIRT"].includes(form.garmentType) && (
            <div className="field">
              <label className="label">Waistband Style</label>
              <input className="input" value={form.waistbandStyle} onChange={set("waistbandStyle")} />
            </div>
          )}

          <div className="field">
            <label className="label">Hem Style</label>
            <input className="input" value={form.hemStyle} onChange={set("hemStyle")} />
          </div>

          <div className="field">
            <label className="label">Additional Construction Notes</label>
            <textarea rows={4} className="textarea" value={form.additionalConstructionNotes} onChange={set("additionalConstructionNotes")} />
          </div>
        </div>
      )}

      {/* Step 4: Measurements */}
      {step === 3 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Measurements</h2>

          <div className="field">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.useStoredMeasurements}
                onChange={setBool("useStoredMeasurements")}
                className="w-4 h-4 accent-gold"
              />
              <span className="text-sm text-green">Use stored measurements from customer profile</span>
            </label>
          </div>

          {selectedCustomer?.measurements ? (
            <div className="bg-cream p-4 text-sm text-green-muted">
              Customer measurements are on file.
              {!form.useStoredMeasurements && " They will not be used for this order."}
            </div>
          ) : (
            <div className="warning-yellow">
              No measurements on file for this customer.{" "}
              {selectedCustomer && (
                <a href={`/customers/${selectedCustomer.id}/measurements`} target="_blank" rel="noreferrer" className="underline">
                  Add measurements →
                </a>
              )}
            </div>
          )}

          <div className="field">
            <label className="label">Per-order adjustments / notes</label>
            <textarea
              rows={4}
              className="textarea"
              placeholder="Any measurement adjustments or special notes for this order…"
              value={form.measurementNotes}
              onChange={set("measurementNotes")}
            />
          </div>
        </div>
      )}

      {/* Step 5: Images */}
      {step === 4 && (
        <div className="bg-white border border-cream-dark p-6 space-y-6">
          <h2 className="section-title">Sketch & Reference Images</h2>

          <div className="field">
            <label className="label">Sketch</label>
            <input type="file" accept="image/*" className="text-sm text-green" onChange={(e) => handleImageUpload(e, "sketchUrl")} />
            {form.sketchUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.sketchUrl} alt="Sketch" className="max-h-48 object-contain border border-cream-dark" />
                <button type="button" className="text-xs text-red-600 mt-1" onClick={() => setForm((f) => ({ ...f, sketchUrl: "" }))}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">Fabric Swatch</label>
            <input type="file" accept="image/*" className="text-sm text-green" onChange={(e) => handleImageUpload(e, "fabricSwatchUrl")} />
            {form.fabricSwatchUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.fabricSwatchUrl} alt="Swatch" className="max-h-32 object-contain border border-cream-dark" />
                <button type="button" className="text-xs text-red-600 mt-1" onClick={() => setForm((f) => ({ ...f, fabricSwatchUrl: "" }))}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">Inspiration Images</label>
            <input type="file" accept="image/*" className="text-sm text-green" onChange={(e) => handleImageUpload(e, "inspirationImageUrls")} />
            {form.inspirationImageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {form.inspirationImageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Inspiration ${i + 1}`} className="h-24 w-24 object-cover border border-cream-dark" />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          inspirationImageUrls: f.inspirationImageUrls.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 6: Pricing */}
      {step === 5 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Pricing</h2>

          {garmentWarning && (
            <div className="warning-yellow">{garmentWarning}</div>
          )}

          {form.garmentType === "SKIRT" && !garmentWarning && (
            <div className="warning-yellow">Skirt fabric meterage to be confirmed with Anthony</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Making Rate (£ ex. VAT)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.makingRate} onChange={set("makingRate")} />
              {form.garmentType && form.fabricPattern && (
                <div className="text-xs text-green-muted mt-1">
                  Default for {GARMENT_TYPES.find((g) => g.value === form.garmentType)?.label} ({form.fabricPattern}):{" "}
                  £{MAKING_RATES[form.garmentType]?.[form.fabricPattern as "plain" | "check"]?.exVat ?? "—"}
                </div>
              )}
            </div>
            <div className="field">
              <label className="label">Block Fee (£ ex. VAT)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.blockFee} onChange={set("blockFee")} />
              {selectedCustomer && (
                <div className="text-xs text-green-muted mt-1">
                  {selectedCustomer.hasBlock
                    ? "Block already cut — fee waived"
                    : "First garment — £350 block fee applies"}
                </div>
              )}
            </div>
          </div>

          <div className="bg-cream border border-cream-dark p-4 space-y-2">
            {[
              ["Making Rate", parseFloat(form.makingRate) || 0],
              ["Block Fee", parseFloat(form.blockFee) || 0],
              ["Fabric Cost", pricing.fabricTotalCost],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm">
                <span className="text-green-muted">{label}</span>
                <span className="text-green">£{(val as number).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t border-cream-dark pt-2">
              <span className="text-green-muted">Subtotal ex. VAT</span>
              <span className="text-green">£{pricing.subtotalExVat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-muted">VAT (20%)</span>
              <span className="text-green">£{pricing.vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-cream-dark pt-2">
              <span className="text-green">Total inc. VAT</span>
              <span className="text-green">£{pricing.totalIncVat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-muted">50% Deposit Required</span>
              <span className="text-green font-medium">£{pricing.depositRequired.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Deposit Paid (£)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.depositPaid} onChange={set("depositPaid")} />
            </div>
            <div className="field">
              <label className="label">Deposit Paid Date</label>
              <input type="date" className="input" value={form.depositPaidDate} onChange={set("depositPaidDate")} />
            </div>
          </div>

          {form.depositPaid && (
            <div className="flex justify-between text-sm font-medium">
              <span className="text-green-muted">Balance Due</span>
              <span className={pricing.totalIncVat - (parseFloat(form.depositPaid) || 0) > 0 ? "text-amber-700" : "text-green"}>
                £{Math.max(0, pricing.totalIncVat - (parseFloat(form.depositPaid) || 0)).toFixed(2)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Balance Paid Date</label>
              <input type="date" className="input" value={form.balancePaidDate} onChange={set("balancePaidDate")} />
            </div>
            <div className="field pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.fullyPaid} onChange={setBool("fullyPaid")} className="w-4 h-4 accent-gold" />
                <span className="text-sm text-green">Fully paid</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Status & Timeline */}
      {step === 6 && (
        <div className="bg-white border border-cream-dark p-6 space-y-4">
          <h2 className="section-title">Status & Timeline</h2>

          <div className="field">
            <label className="label">Order Status</label>
            <select className="select" value={form.status} onChange={set("status")}>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Brief Sent to Tailor</label>
              <input type="date" className="input" value={form.briefSentAt} onChange={set("briefSentAt")} />
            </div>
            <div className="field">
              <label className="label">Est. Completion Date</label>
              <input type="date" className="input" value={form.estimatedCompletionDate} onChange={set("estimatedCompletionDate")} />
            </div>
            <div className="field">
              <label className="label">Fitting Date</label>
              <input type="date" className="input" value={form.fittingDate} onChange={set("fittingDate")} />
            </div>
            <div className="field">
              <label className="label">Completed Date</label>
              <input type="date" className="input" value={form.completedAt} onChange={set("completedAt")} />
            </div>
            <div className="field">
              <label className="label">Delivered Date</label>
              <input type="date" className="input" value={form.deliveredAt} onChange={set("deliveredAt")} />
            </div>
          </div>

          <div className="field">
            <label className="label">Internal Notes (not shown on tailor brief)</label>
            <textarea rows={4} className="textarea" value={form.internalNotes} onChange={set("internalNotes")} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary">
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="btn-primary">
              Next →
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => save(true)} disabled={saving || !form.customerId || !form.garmentType} className="btn-secondary text-sm">
            {saving ? "Saving…" : "Save Draft"}
          </button>
          {step === STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving || !form.customerId || !form.garmentType}
              className="btn-gold"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
