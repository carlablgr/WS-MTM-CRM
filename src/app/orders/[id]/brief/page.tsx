import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, garmentTypeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TailorBriefPage({ params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { measurements: true } },
    },
  });
  if (!order) notFound();

  const m = order.customer.measurements as Record<string, unknown> | null;

  const fabricTotal = order.fabricPricePerMetre && order.fabricMeterage
    ? Number(order.fabricPricePerMetre) * Number(order.fabricMeterage)
    : null;

  const measurementFields: [string, string][] = [
    ["height", "Height"], ["neck", "Neck"], ["chest", "Chest"], ["underChest", "Under Chest"],
    ["waist", "Waist"], ["highHip", "High Hip"], ["hip", "Hip"],
    ["shoulderWidth", "Shoulder Width"], ["shoulderToWaist", "Shoulder to Waist"],
    ["shoulderToHip", "Shoulder to Hip"], ["shoulderToKnee", "Shoulder to Knee"],
    ["shoulderToFloor", "Shoulder to Floor"], ["backLength", "Back Length"],
    ["sleeveLength", "Sleeve Length"], ["sleeveWidth", "Sleeve Width"],
    ["wristWidth", "Wrist Width"], ["frontChestWidth", "Front Chest Width"],
    ["backChestWidth", "Back Chest Width"], ["napeToWaist", "Nape to Waist"],
    ["bustPointToBustPoint", "Bust Pt–Bust Pt"], ["shoulderToBust", "Shoulder to Bust"],
    ["underarm", "Underarm"], ["armhole", "Armhole"], ["necklineDepth", "Neckline Depth"],
    ["waistToHip", "Waist to Hip"], ["waistToKnee", "Waist to Knee"],
    ["waistToFloor", "Waist to Floor"], ["thigh", "Thigh"], ["knee", "Knee"],
    ["calf", "Calf"], ["ankle", "Ankle"], ["inseam", "Inseam"], ["outseam", "Outseam"],
    ["rise", "Rise"], ["trouserWidth", "Trouser Width"], ["skirtLength", "Skirt Length"],
  ];

  const activeMeasurements = m
    ? measurementFields.filter(([key]) => m[key] !== null && m[key] !== undefined)
    : [];

  return (
    <html lang="en">
      <head>
        <title>Tailor Brief — {order.customer.firstName} {order.customer.lastName} — {garmentTypeLabel(order.garmentType)}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; color: #1e3d2f; background: white; padding: 40px 48px; max-width: 800px; margin: 0 auto; font-size: 13px; }
          .header { background: #1e3d2f; color: #f5f0e8; padding: 20px 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
          .header-left .brand { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #c4a35a; margin-bottom: 4px; }
          .header-left .title { font-size: 18px; font-weight: normal; }
          .header-right { text-align: right; font-size: 11px; color: #f5f0e8/80; line-height: 1.8; }
          .section { margin-bottom: 24px; page-break-inside: avoid; }
          .section-title { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #c4a35a; border-bottom: 1px solid #ede7d9; padding-bottom: 5px; margin-bottom: 12px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 20px; }
          .field { margin-bottom: 8px; }
          .label { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #4a7c5f; }
          .value { font-size: 13px; line-height: 1.5; margin-top: 1px; }
          .meas-row { display: flex; justify-content: space-between; border-bottom: 1px solid #ede7d9; padding: 3px 0; font-size: 12px; }
          .meas-label { color: #4a7c5f; }
          .meas-value { font-weight: normal; }
          .pricing-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ede7d9; }
          .pricing-total { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .sketch { max-width: 240px; max-height: 320px; object-fit: contain; border: 1px solid #ede7d9; }
          .note-box { background: #faf7f2; border: 1px solid #ede7d9; padding: 10px; font-size: 12px; line-height: 1.6; white-space: pre-line; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3d2f; color: #f5f0e8; border: none; padding: 10px 20px; font-family: Georgia, serif; font-size: 13px; cursor: pointer; }
          @media print { .print-btn { display: none; } body { padding: 0; } }
        `}</style>
      </head>
      <body>
        <button className="print-btn" suppressHydrationWarning>Print / Save as PDF</button>

        <div className="header">
          <div className="header-left">
            <div className="brand">Walker Slater · Made to Measure</div>
            <div className="title">Tailor Brief — {garmentTypeLabel(order.garmentType)}</div>
          </div>
          <div className="header-right">
            <div>Customer: {order.customer.firstName} {order.customer.lastName}</div>
            <div>Order Date: {formatDate(order.createdAt)}</div>
            {order.appointmentDate && <div>Appointment: {formatDate(order.appointmentDate)}</div>}
            {order.estimatedCompletionDate && <div>Est. Completion: {formatDate(order.estimatedCompletionDate)}</div>}
          </div>
        </div>

        {/* Fabric */}
        <div className="section">
          <div className="section-title">Fabric</div>
          <div className="grid-2">
            {[
              ["Description", order.fabricDescription],
              ["Code", order.fabricCode],
              ["Colour", order.fabricColour],
              ["Price per Metre", order.fabricPricePerMetre ? `£${Number(order.fabricPricePerMetre).toFixed(2)}` : null],
              ["Meterage", order.fabricMeterage ? `${order.fabricMeterage}m` : null],
              ["Fabric Total", fabricTotal ? `£${fabricTotal.toFixed(2)} ex. VAT` : null],
            ].map(([label, val]) => val ? (
              <div key={String(label)} className="field">
                <div className="label">{label}</div>
                <div className="value">{String(val)}</div>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Construction */}
        <div className="section">
          <div className="section-title">Construction</div>
          <div className="grid-2">
            {[
              ["Lining", order.lining ? `Yes${order.liningColour ? ` — ${order.liningColour}` : ""}` : "No lining"],
              order.liningDescription ? ["Lining Description", order.liningDescription] : null,
              order.buttons ? ["Buttons", `${order.buttons}${order.buttonCount ? ` (×${order.buttonCount})` : ""}`] : null,
              order.pockets ? ["Pockets", order.pockets] : null,
              order.lapelStyle ? ["Lapel Style", order.lapelStyle] : null,
              order.ventStyle ? ["Vent Style", order.ventStyle] : null,
              order.sleeveButtons ? ["Sleeve Buttons", String(order.sleeveButtons)] : null,
              order.waistbandStyle ? ["Waistband Style", order.waistbandStyle] : null,
              order.hemStyle ? ["Hem Style", order.hemStyle] : null,
            ].filter(Boolean).map((item) => {
              const [label, val] = item as [string, string];
              return (
                <div key={label} className="field">
                  <div className="label">{label}</div>
                  <div className="value">{val}</div>
                </div>
              );
            })}
          </div>
          {order.additionalConstructionNotes && (
            <div className="field" style={{ marginTop: 10 }}>
              <div className="label">Additional Notes</div>
              <div className="note-box">{order.additionalConstructionNotes}</div>
            </div>
          )}
        </div>

        {/* Sketch */}
        {order.sketchUrl && (
          <div className="section">
            <div className="section-title">Sketch</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.sketchUrl} alt="Sketch" className="sketch" />
          </div>
        )}

        {/* Measurements */}
        {activeMeasurements.length > 0 && (
          <div className="section">
            <div className="section-title">Measurements (all in inches)</div>
            {order.measurementNotes && (
              <div style={{ marginBottom: 10, fontSize: 11, color: "#c4a35a" }}>
                Per-order adjustments: {order.measurementNotes}
              </div>
            )}
            <div className="grid-3">
              {activeMeasurements.map(([key, label]) => (
                <div key={key} className="meas-row">
                  <span className="meas-label">{label}</span>
                  <span className="meas-value">{String(m![key])}&Prime;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing — ex VAT only (for tailor brief) */}
        <div className="section">
          <div className="section-title">Pricing Summary (ex. VAT)</div>
          <div style={{ maxWidth: 300 }}>
            {[
              ["Making Rate", order.makingRate ? formatCurrency(Number(order.makingRate)) : "—"],
              ["Block Fee", order.blockFee !== null ? formatCurrency(Number(order.blockFee)) : "—"],
              ["Fabric Cost", fabricTotal ? formatCurrency(fabricTotal) : "—"],
              ["Subtotal ex. VAT", order.subtotalExVat ? formatCurrency(Number(order.subtotalExVat)) : "—"],
            ].map(([label, val]) => (
              <div key={String(label)} className="pricing-row">
                <span style={{ color: "#4a7c5f" }}>{label}</span>
                <span>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Internal notes */}
        {order.internalNotes && (
          <div className="section">
            <div className="section-title">Notes for Anthony</div>
            <div className="note-box">{order.internalNotes}</div>
          </div>
        )}

        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.print-btn').addEventListener('click', function() { window.print(); });
        `}} />
      </body>
    </html>
  );
}
