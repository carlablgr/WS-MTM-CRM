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
import { GARMENT_MEASUREMENTS } from "@/lib/makingRates";
import FinalizeButton from "@/components/FinalizeButton";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.orderForm.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { measurements: true } },
      preConsultation: true,
      items: { orderBy: { sortOrder: "asc" } },
      appointments: { orderBy: { appointmentDate: "asc" } },
      reminders: { where: { completed: false }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!order) notFound();

  const balanceDue =
    order.totalIncVat && order.depositPaid
      ? Number(order.totalIncVat) - Number(order.depositPaid)
      : order.totalIncVat
      ? Number(order.totalIncVat)
      : null;

  const garmentSummary = order.items.length
    ? order.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
    : garmentTypeLabel(order.garmentType);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
            <Link href="/orders" className="hover:text-gold">Orders</Link> /
          </p>
          <h1 className="text-3xl font-medium text-green">
            {garmentSummary} — {order.customer.firstName} {order.customer.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-0.5 ${orderStatusColor(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
            <span className="text-xs text-green-muted">{formatDate(order.createdAt)}</span>
            {order.items.length > 1 && (
              <span className="text-xs bg-cream px-2 py-0.5 border border-cream-dark text-green">
                {order.items.length} garments
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/orders/${order.id}/brief`} target="_blank" className="btn-secondary text-sm">
            Tailor Brief PDF
          </Link>
          <Link href={`/orders/${order.id}/edit`} className="btn-primary text-sm">
            Edit
          </Link>
          <FinalizeButton
            endpoint={`/api/orders/${order.id}/finalize`}
            finalized={order.finalized}
            label="Finalize & Send"
            finalizedLabel="Finalized"
          />
          <DeleteButton
            endpoint={`/api/orders/${order.id}`}
            label="Delete Order"
            confirmMessage="Are you sure you want to delete this MTM order? This cannot be undone."
            redirectTo={`/customers/${order.customer.id}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Garments */}
          {order.items.map((item, index) => {
            const fabricCost =
              item.fabricPricePerMetre && item.fabricMeterage
                ? Number(item.fabricPricePerMetre) * Number(item.fabricMeterage)
                : null;
            const mFields = GARMENT_MEASUREMENTS[item.garmentType] ?? [];
            const itemMeasurements = (item.measurements as Record<string, string> | null) ?? {};
            const activeMeasurements = mFields.filter(({ key }) => itemMeasurements[key]);

            return (
              <div key={item.id} className="bg-white border border-cream-dark overflow-hidden">
                {/* Garment header */}
                <div className="flex items-center gap-3 px-6 py-3 bg-green text-cream">
                  <span className="text-xs uppercase tracking-widest opacity-60">Garment {index + 1}</span>
                  <span className="font-medium">{garmentTypeLabel(item.garmentType)}</span>
                  <span className="text-xs opacity-60 ml-1 capitalize">{item.fabricPattern}</span>
                  {item.itemSubtotal && (
                    <span className="ml-auto text-xs text-gold">{formatCurrency(Number(item.itemSubtotal))} ex. VAT</span>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Fabric */}
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gold mb-3">Fabric</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {[
                        ["Description", item.fabricDescription],
                        ["Fabric Code", item.fabricCode],
                        ["Colour", item.fabricColour],
                        ["Price per Metre", item.fabricPricePerMetre ? formatCurrency(Number(item.fabricPricePerMetre)) : null],
                        ["Meterage", item.fabricMeterage ? `${item.fabricMeterage}m` : null],
                        ["Fabric Total", fabricCost ? formatCurrency(fabricCost) : null],
                        ["Making Rate", item.makingRate ? formatCurrency(Number(item.makingRate)) : null],
                        ["Item Subtotal", item.itemSubtotal ? formatCurrency(Number(item.itemSubtotal)) + " ex. VAT" : null],
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
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-gold mb-3">Construction</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {[
                        ["Lining", item.lining ? `Yes${item.liningColour ? ` — ${item.liningColour}` : ""}` : "No lining"],
                        item.liningDescription ? ["Lining Description", item.liningDescription] : null,
                        item.buttons ? ["Buttons", item.buttons + (item.buttonCount ? ` (×${item.buttonCount})` : "")] : null,
                        item.pockets ? ["Pockets", item.pockets] : null,
                        item.lapelStyle ? ["Lapel Style", item.lapelStyle] : null,
                        item.ventStyle ? ["Vent Style", item.ventStyle] : null,
                        item.sleeveButtons ? ["Sleeve Buttons", String(item.sleeveButtons)] : null,
                        item.waistbandStyle ? ["Waistband Style", item.waistbandStyle] : null,
                        item.hemStyle ? ["Hem Style", item.hemStyle] : null,
                      ].filter(Boolean).map((row) => {
                        const [label, val] = row as [string, string];
                        return (
                          <div key={label}>
                            <div className="text-xs text-green-muted">{label}</div>
                            <div className="text-sm text-green">{val}</div>
                          </div>
                        );
                      })}
                    </div>
                    {item.additionalConstructionNotes && (
                      <div className="mt-3 pt-3 border-t border-cream-dark">
                        <div className="text-xs text-green-muted mb-1">Additional Notes</div>
                        <p className="text-sm text-green whitespace-pre-line">{item.additionalConstructionNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Measurements */}
                  {activeMeasurements.length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-3">Measurements</h3>
                      <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                        {activeMeasurements.map(({ key, label }) => (
                          <div key={key} className="flex justify-between text-sm border-b border-cream-dark pb-1">
                            <span className="text-green-muted text-xs">{label}</span>
                            <span className="text-green font-medium">{itemMeasurements[key]}&Prime;</span>
                          </div>
                        ))}
                      </div>
                      {item.measurementNotes && (
                        <div className="mt-3 pt-3 border-t border-cream-dark">
                          <div className="text-xs text-green-muted mb-1">Measurement Notes</div>
                          <p className="text-sm text-green whitespace-pre-line">{item.measurementNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Images */}
                  {(item.sketchUrl || item.fabricSwatchUrl) && (
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-3">Sketch & References</h3>
                      <div className="flex flex-wrap gap-4">
                        {item.sketchUrl && (
                          <div>
                            <div className="text-xs text-green-muted mb-1">Sketch</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.sketchUrl} alt="Sketch" className="max-w-xs max-h-64 object-contain border border-cream-dark" />
                          </div>
                        )}
                        {item.fabricSwatchUrl && (
                          <div>
                            <div className="text-xs text-green-muted mb-1">Fabric Swatch</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.fabricSwatchUrl} alt="Swatch" className="max-w-xs max-h-48 object-contain border border-cream-dark" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* No items fallback */}
          {order.items.length === 0 && (
            <div className="bg-white border border-cream-dark p-6 text-sm text-green-muted">
              No garments recorded. <Link href={`/orders/${order.id}/edit`} className="text-gold underline">Edit this order →</Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Pricing</h2>
            <dl className="space-y-2">
              {order.items.map((it, i) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span className="text-green-muted">
                    {garmentTypeLabel(it.garmentType)}{order.items.length > 1 ? ` (${i + 1})` : ""}
                  </span>
                  <span className="text-green">
                    {it.itemSubtotal ? formatCurrency(Number(it.itemSubtotal)) : "—"}
                  </span>
                </div>
              ))}
              {order.items.length > 1 && (
                <div className="flex justify-between text-sm border-t border-cream-dark pt-2">
                  <span className="text-green-muted">Garments subtotal</span>
                  <span className="text-green">
                    {formatCurrency(order.items.reduce((s, it) => s + (it.itemSubtotal ? Number(it.itemSubtotal) : 0), 0))}
                  </span>
                </div>
              )}
              {[
                ["Block Fee", order.blockFee !== null ? formatCurrency(Number(order.blockFee)) : "—"],
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
                  <span>{formatCurrency(Math.max(0, balanceDue))}</span>
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

          {/* Measurements link */}
          <div className="bg-white border border-cream-dark p-4">
            <Link href={`/customers/${order.customer.id}/measurements`} className="text-xs text-gold hover:underline">
              View / edit customer body measurements →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
