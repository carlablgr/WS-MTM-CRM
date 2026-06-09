"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MEASUREMENT_GROUPS: { title: string; fields: [string, string][] }[] = [
  {
    title: "General",
    fields: [
      ["height", "Height"], ["weight", "Weight (lbs)"], ["neck", "Neck"],
    ],
  },
  {
    title: "Upper Body",
    fields: [
      ["chest", "Chest"], ["underChest", "Under Chest"], ["frontChestWidth", "Front Chest Width"],
      ["backChestWidth", "Back Chest Width"], ["shoulderWidth", "Shoulder Width"],
      ["shoulderToWaist", "Shoulder to Waist"], ["shoulderToHip", "Shoulder to Hip"],
      ["shoulderToKnee", "Shoulder to Knee"], ["shoulderToFloor", "Shoulder to Floor"],
      ["backLength", "Back Length"], ["napeToWaist", "Nape to Waist"],
    ],
  },
  {
    title: "Bust",
    fields: [
      ["bustPointToBustPoint", "Bust Point to Bust Point"], ["shoulderToBust", "Shoulder to Bust"],
      ["necklineDepth", "Neckline Depth"],
    ],
  },
  {
    title: "Arms",
    fields: [
      ["sleeveLength", "Sleeve Length"], ["sleeveWidth", "Sleeve Width"],
      ["wristWidth", "Wrist Width"], ["underarm", "Underarm"], ["armhole", "Armhole"],
    ],
  },
  {
    title: "Waist & Hip",
    fields: [
      ["waist", "Waist"], ["highHip", "High Hip"], ["hip", "Hip"],
      ["waistToHip", "Waist to Hip"], ["waistToKnee", "Waist to Knee"],
      ["waistToFloor", "Waist to Floor"],
    ],
  },
  {
    title: "Legs",
    fields: [
      ["thigh", "Thigh"], ["knee", "Knee"], ["calf", "Calf"], ["ankle", "Ankle"],
      ["inseam", "Inseam"], ["outseam", "Outseam"], ["rise", "Rise"],
      ["trouserWidth", "Trouser Width"], ["skirtLength", "Skirt Length"],
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MeasurementData = Record<string, any>;

export default function MeasurementsForm({
  customerId,
  measurements,
}: {
  customerId: string;
  measurements: MeasurementData | null;
}) {
  const router = useRouter();

  const allFields = MEASUREMENT_GROUPS.flatMap((g) => g.fields.map(([k]) => k));
  const initial: Record<string, string> = {};
  for (const key of allFields) {
    const v = measurements?.[key];
    initial[key] = v !== null && v !== undefined ? String(v) : "";
  }

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch(`/api/customers/${customerId}/measurements`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {MEASUREMENT_GROUPS.map((group) => (
          <div key={group.title} className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">{group.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.fields.map(([key, label]) => (
                <div key={key} className="field mb-0">
                  <label className="label">{label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      className="input pr-6"
                      placeholder="0.00"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-muted pointer-events-none">
                      &Prime;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save Measurements"}
        </button>
        {saved && (
          <span className="text-sm text-green-muted">Measurements saved.</span>
        )}
      </div>
    </form>
  );
}
