import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency, mtoStatusLabel, mtoStatusColor } from "@/lib/format";
import { calculateMtoOrderTotals } from "@/lib/mtoUtils";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES = [
  "DEPOSIT_TAKEN",
  "SUBMITTED_TO_FACTORY",
  "IN_PRODUCTION",
  "ARRIVED",
  "COLLECTED",
];

export default async function MtoOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const statusFilter = searchParams.status;
  const search = searchParams.search?.trim();

  const where: Prisma.MtoOrderWhereInput = {
    ...(statusFilter ? { status: statusFilter as never } : {}),
    ...(search
      ? {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const orders = await prisma.mtoOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Order</p>
          <h1 className="text-3xl font-medium text-green">MTO Orders</h1>
          <p className="text-sm text-green-muted mt-1">Factory orders — no measurements, 8–10 week turnaround.</p>
        </div>
        <Link href="/mto-orders/new" className="btn-primary">
          + New MTO Order
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4" action="/mto-orders" method="get">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by customer name…"
          className="input max-w-sm"
        />
      </form>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/mto-orders${search ? `?search=${encodeURIComponent(search)}` : ""}`}
          className={`text-xs px-3 py-1.5 border transition-colors ${
            !statusFilter ? "bg-green text-cream border-green" : "border-cream-dark text-green hover:border-gold"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/mto-orders?status=${s}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`text-xs px-3 py-1.5 border transition-colors ${
              statusFilter === s
                ? "bg-green text-cream border-green"
                : "border-cream-dark text-green hover:border-gold"
            }`}
          >
            {mtoStatusLabel(s)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-cream-dark px-8 py-16 text-center">
          <p className="text-green-muted mb-4">
            No MTO orders{statusFilter ? ` with status "${mtoStatusLabel(statusFilter)}"` : ""}{search ? ` matching "${search}"` : ""}
          </p>
          <Link href="/mto-orders/new" className="btn-primary inline-flex">
            Create first MTO order
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-cream-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream">
                <th className="table-th">Customer</th>
                <th className="table-th">Garments</th>
                <th className="table-th">Status</th>
                <th className="table-th">Total inc. VAT</th>
                <th className="table-th">Balance</th>
                <th className="table-th">Date Required</th>
                <th className="table-th">Created</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const totals = calculateMtoOrderTotals(o.items.map((it) => Number(it.totalIncVat ?? 0)));
                const balance = o.fullyPaid ? 0 : totals.grandTotal - Number(o.depositPaid ?? 0);

                return (
                  <tr key={o.id} className="hover:bg-cream/50 transition-colors">
                    <td className="table-td font-medium">
                      <Link href={`/customers/${o.customer.id}`} className="hover:text-gold">
                        {o.customer.lastName}, {o.customer.firstName}
                      </Link>
                    </td>
                    <td className="table-td">
                      {o.items.map((it) => it.garmentName).join(", ") || "—"}
                      {o.items.length > 1 && (
                        <span className="ml-1 text-xs text-green-muted">({o.items.length})</span>
                      )}
                    </td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-0.5 ${mtoStatusColor(o.status)}`}>
                        {mtoStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="table-td tabular-nums">{formatCurrency(totals.grandTotal)}</td>
                    <td className="table-td tabular-nums">
                      {o.fullyPaid ? (
                        <span className="text-green-700 text-xs">Paid</span>
                      ) : balance > 0 ? (
                        <span className="text-amber-700">{formatCurrency(balance)} owed</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="table-td text-green-muted text-xs">
                      {o.dateRequired ? formatDate(o.dateRequired) : "—"}
                    </td>
                    <td className="table-td text-green-muted text-xs">{formatDate(o.createdAt)}</td>
                    <td className="table-td">
                      <Link href={`/mto-orders/${o.id}`} className="text-xs text-gold hover:underline">
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
