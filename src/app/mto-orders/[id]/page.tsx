import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, mtoStatusLabel, mtoStatusColor } from "@/lib/format";
import { calculateMtoOrderTotals, mtoEstimatedArrival } from "@/lib/mtoUtils";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function MtoOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.mtoOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!order) notFound();

  const totals = calculateMtoOrderTotals(order.items.map((it) => Number(it.totalIncVat ?? 0)));
  const balanceDue = order.fullyPaid ? 0 : totals.grandTotal - Number(order.depositPaid ?? 0);
  const estimatedArrival = mtoEstimatedArrival(order.submissionDate);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
            <Link href="/mto-orders" className="hover:text-gold">MTO Orders</Link> /
          </p>
          <h1 className="text-3xl font-medium text-green">
            {order.items.map((it) => it.garmentName).join(", ") || "MTO Order"} — {order.customer.firstName} {order.customer.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-0.5 ${mtoStatusColor(order.status)}`}>
              {mtoStatusLabel(order.status)}
            </span>
            <span className="text-xs bg-green text-cream px-2 py-0.5 uppercase tracking-widest">
              Made to Order
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
          <Link href={`/mto-orders/${order.id}/print`} target="_blank" className="btn-secondary text-sm">
            Print / Export PDF
          </Link>
          <Link href={`/mto-orders/${order.id}/edit`} className="btn-primary text-sm">
            Edit
          </Link>
          <DeleteButton
            endpoint={`/api/mto-orders/${order.id}`}
            label="Delete Order"
            confirmMessage="Are you sure you want to delete this MTO order? This cannot be undone."
            redirectTo={`/customers/${order.customer.id}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {order.items.map((item, index) => (
            <div key={item.id} className="bg-white border border-cream-dark overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-3 bg-green text-cream">
                <span className="text-xs uppercase tracking-widest opacity-60">Garment {index + 1}</span>
                <span className="font-medium">{item.garmentName}</span>
                {item.totalIncVat && (
                  <span className="ml-auto text-xs text-gold">{formatCurrency(Number(item.totalIncVat))} inc. VAT</span>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    ["Block Size", item.blockSize],
                    ["Cloth", item.cloth],
                    ["Lining", item.lining],
                    ["Internal", item.internal],
                    ["Accents", item.accents],
                    ["Buttons", item.buttons],
                    ["Retail Price", item.retailPrice ? formatCurrency(Number(item.retailPrice)) : null],
                    ["External Fabric Cost", Number(item.externalFabricCost) > 0 ? formatCurrency(Number(item.externalFabricCost)) : null],
                  ].map(([label, val]) =>
                    val ? (
                      <div key={String(label)}>
                        <div className="text-xs text-green-muted">{label}</div>
                        <div className="text-sm text-green">{String(val)}</div>
                      </div>
                    ) : null
                  )}
                </div>
                {item.notes && (
                  <div className="mt-3 pt-3 border-t border-cream-dark">
                    <div className="text-xs text-green-muted mb-1">Notes</div>
                    <p className="text-sm text-green whitespace-pre-line">{item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {order.notes && (
            <div className="bg-white border border-cream-dark p-6">
              <h2 className="section-title">Order Notes</h2>
              <p className="text-sm text-green whitespace-pre-line">{order.notes}</p>
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
                    {it.garmentName}{order.items.length > 1 ? ` (${i + 1})` : ""}
                  </span>
                  <span className="text-green">{it.totalIncVat ? formatCurrency(Number(it.totalIncVat)) : "—"}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-cream-dark">
                <span className="text-green">Total inc. VAT</span>
                <span className="text-green">{formatCurrency(totals.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">50% Deposit Required</span>
                <span className="text-green">{formatCurrency(totals.depositRequired)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">Deposit Paid</span>
                <span className={order.depositPaid && Number(order.depositPaid) > 0 ? "text-green" : "text-amber-700"}>
                  {order.depositPaid ? formatCurrency(Number(order.depositPaid)) : "—"}
                </span>
              </div>
              <div className={`flex justify-between text-sm font-medium pt-2 border-t border-cream-dark ${balanceDue > 0 ? "text-amber-700" : "text-green"}`}>
                <span>Balance Due</span>
                <span>{formatCurrency(Math.max(0, balanceDue))}</span>
              </div>
            </dl>
          </div>

          {/* Dates */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">MTO Progress</h2>
            <dl className="space-y-2">
              {[
                ["Date Required", order.dateRequired ? formatDate(order.dateRequired) : "—"],
                ["Submission Date", order.submissionDate ? formatDate(order.submissionDate) : "—"],
                ["Est. Arrival (guide)", estimatedArrival ? estimatedArrival.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "—"],
                ["Deposit Paid Date", order.depositPaidDate ? formatDate(order.depositPaidDate) : "—"],
                ["Balance Paid Date", order.balancePaidDate ? formatDate(order.balancePaidDate) : "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-green-muted">{label}</span>
                  <span className="text-green">{String(val)}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Order details */}
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Order Details</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">Shop</span>
                <span className="text-green">{order.shop}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">Staff Member</span>
                <span className="text-green">{order.conductedBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-muted">Date</span>
                <span className="text-green">{formatDate(order.date)}</span>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-cream-dark p-4">
            <Link href={`/customers/${order.customer.id}`} className="text-xs text-gold hover:underline">
              View customer profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
