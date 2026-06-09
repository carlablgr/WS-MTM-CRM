import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, garmentTypeLabel } from "@/lib/format";
import { GARMENT_MEASUREMENTS } from "@/lib/makingRates";

export const dynamic = "force-dynamic";

export default async function TailorBriefPage({ params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { measurements: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!order) notFound();

  const garmentSummary = order.items.length
    ? order.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
    : garmentTypeLabel(order.garmentType);

  return (
    <html lang="en">
      <head>
        <title>Tailor Brief — {order.customer.firstName} {order.customer.lastName} — {garmentSummary}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; color: #1e3d2f; background: white; padding: 40px 48px; max-width: 820px; margin: 0 auto; font-size: 13px; }
          .header { background: #1e3d2f; color: #f5f0e8; padding: 20px 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
          .header-left .brand { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #c4a35a; margin-bottom: 4px; }
          .header-left .title { font-size: 18px; font-weight: normal; }
          .header-right { text-align: right; font-size: 11px; line-height: 1.8; }
          .garment-block { margin-bottom: 32px; page-break-inside: avoid; border: 1px solid #ede7d9; }
          .garment-header { background: #1e3d2f; color: #f5f0e8; padding: 10px 16px; display: flex; align-items: center; gap: 16px; }
          .garment-header .g-num { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #c4a35a; }
          .garment-header .g-name { font-size: 15px; }
          .garment-header .g-subtotal { margin-left: auto; font-size: 11px; color: #c4a35a; }
          .garment-body { padding: 16px; }
          .section { margin-bottom: 18px; }
          .section-title { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #c4a35a; border-bottom: 1px solid #ede7d9; padding-bottom: 5px; margin-bottom: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 28px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 18px; }
          .field { margin-bottom: 6px; }
          .label { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #4a7c5f; }
          .value { font-size: 13px; line-height: 1.5; margin-top: 1px; }
          .meas-row { display: flex; justify-content: space-between; border-bottom: 1px solid #ede7d9; padding: 3px 0; font-size: 12px; }
          .meas-label { color: #4a7c5f; }
          .pricing-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ede7d9; font-size: 12px; }
          .pricing-total { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: bold; }
          .sketch { max-width: 220px; max-height: 280px; object-fit: contain; border: 1px solid #ede7d9; }
          .note-box { background: #faf7f2; border: 1px solid #ede7d9; padding: 10px; font-size: 12px; line-height: 1.6; white-space: pre-line; }
          .order-totals { border: 1px solid #ede7d9; padding: 16px; margin-bottom: 24px; max-width: 320px; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3d2f; color: #f5f0e8; border: none; padding: 10px 20px; font-family: Georgia, serif; font-size: 13px; cursor: pointer; }
          @media print { .print-btn { display: none; } body { padding: 0; } }
        `}</style>
      </head>
      <body>
        <button className="print-btn" suppressHydrationWarning>Print / Save as PDF</button>

        <div className="header">
          <div className="header-left">
            <div className="brand">Walker Slater · Made to Measure</div>
            <div className="title">Tailor Brief — {garmentSummary}</div>
          </div>
          <div className="header-right">
            <div>Customer: {order.customer.firstName} {order.customer.lastName}</div>
            <div>Order Date: {formatDate(order.createdAt)}</div>
            {order.appointmentDate && <div>Appointment: {formatDate(order.appointmentDate)}</div>}
            {order.estimatedCompletionDate && <div>Est. Completion: {formatDate(order.estimatedCompletionDate)}</div>}
            {order.items.length > 1 && <div>{order.items.length} garments in this order</div>}
          </div>
        </div>

        {/* One block per garment */}
        {order.items.map((item, index) => {
          const fabricCost =
            item.fabricPricePerMetre && item.fabricMeterage
              ? Number(item.fabricPricePerMetre) * Number(item.fabricMeterage)
              : null;

          const mFields = GARMENT_MEASUREMENTS[item.garmentType] ?? [];
          const itemMeasurements = (item.measurements as Record<string, string> | null) ?? {};
          const activeMeasurements = mFields.filter(({ key }) => itemMeasurements[key]);

          return (
            <div key={item.id} className="garment-block">
              <div className="garment-header">
                <span className="g-num">Garment {index + 1}</span>
                <span className="g-name">{garmentTypeLabel(item.garmentType)} — {item.fabricPattern === "check" ? "Check" : "Plain"}</span>
                {item.itemSubtotal && (
                  <span className="g-subtotal">{formatCurrency(Number(item.itemSubtotal))} ex. VAT</span>
                )}
              </div>

              <div className="garment-body">
                {/* Fabric */}
                <div className="section">
                  <div className="section-title">Fabric</div>
                  <div className="grid-2">
                    {[
                      ["Description", item.fabricDescription],
                      ["Code", item.fabricCode],
                      ["Colour", item.fabricColour],
                      ["Price per Metre", item.fabricPricePerMetre ? `£${Number(item.fabricPricePerMetre).toFixed(2)}` : null],
                      ["Meterage", item.fabricMeterage ? `${item.fabricMeterage}m` : null],
                      ["Fabric Total", fabricCost ? `£${fabricCost.toFixed(2)} ex. VAT` : null],
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
                      ["Lining", item.lining ? `Yes${item.liningColour ? ` — ${item.liningColour}` : ""}` : "No lining"],
                      item.liningDescription ? ["Lining Description", item.liningDescription] : null,
                      item.buttons ? ["Buttons", `${item.buttons}${item.buttonCount ? ` (×${item.buttonCount})` : ""}`] : null,
                      item.pockets ? ["Pockets", item.pockets] : null,
                      item.lapelStyle ? ["Lapel Style", item.lapelStyle] : null,
                      item.ventStyle ? ["Vent Style", item.ventStyle] : null,
                      item.sleeveButtons ? ["Sleeve Buttons", String(item.sleeveButtons)] : null,
                      item.waistbandStyle ? ["Waistband Style", item.waistbandStyle] : null,
                      item.hemStyle ? ["Hem Style", item.hemStyle] : null,
                    ].filter(Boolean).map((row) => {
                      const [label, val] = row as [string, string];
                      return (
                        <div key={label} className="field">
                          <div className="label">{label}</div>
                          <div className="value">{val}</div>
                        </div>
                      );
                    })}
                  </div>
                  {item.additionalConstructionNotes && (
                    <div className="field" style={{ marginTop: 10 }}>
                      <div className="label">Additional Notes</div>
                      <div className="note-box">{item.additionalConstructionNotes}</div>
                    </div>
                  )}
                </div>

                {/* Sketch */}
                {item.sketchUrl && (
                  <div className="section">
                    <div className="section-title">Sketch</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.sketchUrl} alt="Sketch" className="sketch" />
                  </div>
                )}

                {/* Measurements */}
                {activeMeasurements.length > 0 && (
                  <div className="section">
                    <div className="section-title">Measurements for this garment (inches)</div>
                    {item.measurementNotes && (
                      <div style={{ marginBottom: 8, fontSize: 11, color: "#c4a35a" }}>
                        Adjustments: {item.measurementNotes}
                      </div>
                    )}
                    <div className="grid-3">
                      {activeMeasurements.map(({ key, label }) => (
                        <div key={key} className="meas-row">
                          <span className="meas-label">{label}</span>
                          <span>{itemMeasurements[key]}&Prime;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Order Totals */}
        <div className="section">
          <div className="section-title">Pricing Summary (ex. VAT)</div>
          <div className="order-totals">
            {order.items.map((it, i) => (
              <div key={it.id} className="pricing-row">
                <span style={{ color: "#4a7c5f" }}>{garmentTypeLabel(it.garmentType)}{order.items.length > 1 ? ` (${i + 1})` : ""}</span>
                <span>{it.itemSubtotal ? formatCurrency(Number(it.itemSubtotal)) : "—"}</span>
              </div>
            ))}
            {order.blockFee !== null && Number(order.blockFee) > 0 && (
              <div className="pricing-row">
                <span style={{ color: "#4a7c5f" }}>Block Fee</span>
                <span>{formatCurrency(Number(order.blockFee))}</span>
              </div>
            )}
            {order.subtotalExVat && (
              <div className="pricing-total">
                <span>Subtotal ex. VAT</span>
                <span>{formatCurrency(Number(order.subtotalExVat))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes for Anthony */}
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
