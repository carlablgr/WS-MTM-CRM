import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  formatCurrency,
  garmentTypeLabel,
  orderStatusLabel,
  orderStatusColor,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { measurements: true } },
      preConsultation: true,
      appointments: { orderBy: { appointmentDate: "asc" } },
      reminders: { where: { completed: false }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!order) notFound();

  const m = order.customer.measurements as Record<string, unknown> | null;

  const measurementFields: [string, string][] = [
    ["chest", "Chest"], ["underChest", "Under Chest"], ["waist", "Waist"],
    ["hip", "Hip"], ["shoulderWidth", "Shoulder Width"],
    ["shoulderToWaist", "Shoulder to Waist"], ["shoulderToFloor", "Shoulder to Floor"],
    ["backLength", "Back Length"], ["sleeveLength", "Sleeve Length"],
    ["bustPointToBustPoint", "Bust Pt to Bust Pt"], ["shoulderToBust", "Shoulder to Bust"],
    ["waistToKnee", "Waist to Knee"], ["waistToFloor", "Waist to Floor"],
    ["inseam", "Inseam"], ["rise", "Rise"],
  ];

  const fabricTotal = order.fabricPricePerMetre && order.fabricMeterage
    ? Number(order.fabricPricePerMetre) * Number(order.fabricMeterage)
    : null;

  const balanceDue = order.totalIncVat && order.depositPaid
    ? Number(order.totalIncVat) - Number(order.depositPaid)
    : order.totalIncVat
    ? Number(order.totalIncVat)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
            <Link href="/orders" className="hover:text-gold">Orders</Link> /
          </p>
          <h1 className="text-3xl font-medium text-green">
            {garmentTypeLabel(order.garmentType)} — {order.customer.firstName} {order.customer.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-0.5 ${orderStatusColor(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
            <span className="text-xs text-green-muted">{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/orders/${order.id}/brief`} target="_blank" className="btn-secondary text-sm">
            Tailor Brief PDF
          </Link>
          <Link href={`/orders/${order.id}/edit`} className="btn-primary text-sm">
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Fabric */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Fabric</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Description", order.fabricDescription],
                ["Fabric Code", order.fabricCode],
                ["Colour", order.fabricColour],
                ["Price per Metre", order.fabricPricePerMetre ? formatCurrency(Number(order.fabricPricePerMetre)) : null],
                ["Meterage", order.fabricMeterage ? `${order.fabricMeterage}m` : null],
                ["Fabric Total", fabricTotal ? formatCurrency(fabricTotal) : null],
              ].map(([label, val]) =>
                val ? (
                  <div key={String(label)}>
                    <div className="text-xs text-green-muted">{label}</div>
                    <div className="text-sm text-green">{String(val)}</div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Construction */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Construction</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Lining", order.lining ? `Yes${order.liningColour ? ` — ${order.liningColour}` : ""}` : "No lining"],
                ["Lining Description", order.liningDescription],
                ["Buttons", order.buttons],
                ["Button Count", order.buttonCount ? String(order.buttonCount) : null],
                ["Pockets", order.pockets],
                ["Lapel Style", order.lapelStyle],
                ["Vent Style", order.ventStyle],
                ["Sleeve Buttons", order.sleeveButtons ? String(order.sleeveButtons) : null],
                ["Waistband Style", order.waistbandStyle],
                ["Hem Style", order.hemStyle],
              ].map(([label, val]) =>
                val ? (
                  <div key={String(label)}>
                    <div className="text-xs text-green-muted">{label}</div>
                    <div className="text-sm text-green">{String(val)}</div>
                  </div>
                ) : null
              )}
            </div>
            {order.additionalConstructionNotes && (
              <div className="mt-4 pt-4 border-t border-cream-dark">
                <div className="text-xs text-green-muted mb-1">Additional Construction Notes</div>
                <div className="text-sm text-green whitespace-pre-line">{order.additionalConstructionNotes}</div>
              </div>
            )}
          </div>

          {/* Measurements */}
          <div className="bg-white border border-cream-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Measurements</h2>
              <Link href={`/customers/${order.customer.id}/measurements`} className="text-xs text-gold hover:underline">
                Edit →
              </Link>
            </div>
            {order.useStoredMeasurements ? (
              <>
                {m ? (
                  <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                    {measurementFields.map(([key, label]) => {
                      const val = m[key];
                      if (!val) return null;
                      return (
                        <div key={key} className="flex justify-between text-sm border-b border-cream-dark pb-1">
                          <span className="text-green-muted text-xs">{label}</span>
                          <span className="text-green font-medium">{String(val)}&Prime;</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-green-muted">No measurements on file for this customer.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-green-muted">Custom measurements — see notes below.</p>
            )}
            {order.measurementNotes && (
              <div className="mt-4 pt-4 border-t border-cream-dark">
                <div className="text-xs text-green-muted mb-1">Order-specific notes / adjustments</div>
                <div className="text-sm text-green whitespace-pre-line">{order.measurementNotes}</div>
              </div>
            )}
          </div>

          {/* Sketch/images */}
          {(order.sketchUrl || order.fabricSwatchUrl) && (
            <div className="bg-white border border-cream-dark p-6">
              <h2 className="section-title">Sketch & References</h2>
              <div className="flex flex-wrap gap-4">
                {order.sketchUrl && (
                  <div>
                    <div className="text-xs text-green-muted mb-1">Sketch</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.sketchUrl} alt="Sketch" className="max-w-xs max-h-64 object-contain border border-cream-dark" />
                  </div>
                )}
                {order.fabricSwatchUrl && (
                  <div>
                    <div className="text-xs text-green-muted mb-1">Fabric Swatch</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.fabricSwatchUrl} alt="Swatch" className="max-w-xs max-h-64 object-contain border border-cream-dark" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Pricing</h2>
            <dl className="space-y-2">
              {[
                ["Making Rate", order.makingRate ? formatCurrency(Number(order.makingRate)) : "—"],
                ["Block Fee", order.blockFee !== null ? formatCurrency(Number(order.blockFee)) : "—"],
                ["Fabric Cost", fabricTotal ? formatCurrency(fabricTotal) : "—"],
                ["Subtotal ex. VAT", order.subtotalExVat ? formatCurrency(Number(order.subtotalExVat)) : "—"],
                ["VAT (20%)", order.vatAmount ? formatCurrency(Number(order.vatAmount)) : "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-green-muted">{label}</span>
                  <span className="text-green">{String(val)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-cream-dark">
                <span className="text-green">Total inc. VAT</span>
                <span className="text-green">
                  {order.totalIncVat ? formatCurrency(Number(order.totalIncVat)) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">50% Deposit</span>
                <span className="text-green">
                  {order.depositRequired ? formatCurrency(Number(order.depositRequired)) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">Deposit Paid</span>
                <span className={order.depositPaid && Number(order.depositPaid) > 0 ? "text-green" : "text-amber-700"}>
                  {order.depositPaid ? formatCurrency(Number(order.depositPaid)) : "—"}
                </span>
              </div>
              {balanceDue !== null && (
                <div className={`flex justify-between text-sm font-medium pt-2 border-t border-cream-dark ${balanceDue > 0 ? "text-amber-700" : "text-green"}`}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              )}
            </dl>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Timeline</h2>
            <dl className="space-y-2">
              {[
                ["Appointment", order.appointmentDate ? formatDate(order.appointmentDate) : "—"],
                ["Brief Sent", order.briefSentAt ? formatDate(order.briefSentAt) : "—"],
                ["Fitting", order.fittingDate ? formatDate(order.fittingDate) : "—"],
                ["Est. Completion", order.estimatedCompletionDate ? formatDate(order.estimatedCompletionDate) : "—"],
                ["Completed", order.completedAt ? formatDate(order.completedAt) : "—"],
                ["Delivered", order.deliveredAt ? formatDate(order.deliveredAt) : "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-green-muted">{label}</span>
                  <span className="text-green">{String(val)}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Internal notes */}
          {order.internalNotes && (
            <div className="bg-white border border-cream-dark p-6">
              <h2 className="section-title">Internal Notes</h2>
              <p className="text-sm text-green whitespace-pre-line">{order.internalNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
