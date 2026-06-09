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

const STATUSES = [
  "CONSULTATION_BOOKED",
  "DEPOSIT_TAKEN",
  "BRIEF_SENT_TO_TAILOR",
  "IN_PRODUCTION",
  "FITTING_SCHEDULED",
  "COMPLETE",
  "DELIVERED",
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status;

  const orders = await prisma.orderForm.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Measure</p>
          <h1 className="text-3xl font-medium text-green">Orders</h1>
        </div>
        <Link href="/orders/new" className="btn-primary">
          + New Order
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/orders"
          className={`text-xs px-3 py-1.5 border transition-colors ${
            !statusFilter ? "bg-green text-cream border-green" : "border-cream-dark text-green hover:border-gold"
          }`}
        >
          All ({orders.length})
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/orders?status=${s}`}
            className={`text-xs px-3 py-1.5 border transition-colors ${
              statusFilter === s
                ? "bg-green text-cream border-green"
                : "border-cream-dark text-green hover:border-gold"
            }`}
          >
            {orderStatusLabel(s)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-cream-dark px-8 py-16 text-center">
          <p className="text-green-muted mb-4">No orders{statusFilter ? ` with status "${orderStatusLabel(statusFilter)}"` : " yet"}</p>
          <Link href="/orders/new" className="btn-primary inline-flex">
            Create first order
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-cream-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream">
                <th className="table-th">Customer</th>
                <th className="table-th">Garment</th>
                <th className="table-th">Status</th>
                <th className="table-th">Total inc. VAT</th>
                <th className="table-th">Deposit</th>
                <th className="table-th">Appointment</th>
                <th className="table-th">Created</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const depositBalance = o.depositRequired && o.depositPaid
                  ? Number(o.depositRequired) - Number(o.depositPaid)
                  : o.depositRequired
                  ? Number(o.depositRequired)
                  : null;

                return (
                  <tr key={o.id} className="hover:bg-cream/50 transition-colors">
                    <td className="table-td font-medium">
                      <Link href={`/customers/${o.customer.id}`} className="hover:text-gold">
                        {o.customer.lastName}, {o.customer.firstName}
                      </Link>
                    </td>
                    <td className="table-td">{garmentTypeLabel(o.garmentType)}</td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-0.5 ${orderStatusColor(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="table-td tabular-nums">
                      {o.totalIncVat ? formatCurrency(Number(o.totalIncVat)) : "—"}
                    </td>
                    <td className="table-td tabular-nums">
                      {depositBalance !== null && depositBalance > 0 ? (
                        <span className="text-amber-700">{formatCurrency(depositBalance)} owed</span>
                      ) : depositBalance === 0 || (o.depositPaid && Number(o.depositPaid) > 0) ? (
                        <span className="text-green-700 text-xs">Paid</span>
                      ) : "—"}
                    </td>
                    <td className="table-td text-green-muted text-xs">
                      {o.appointmentDate ? formatDate(o.appointmentDate) : "—"}
                    </td>
                    <td className="table-td text-green-muted text-xs">{formatDate(o.createdAt)}</td>
                    <td className="table-td">
                      <Link href={`/orders/${o.id}`} className="text-xs text-gold hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
