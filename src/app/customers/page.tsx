import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { lastName: "asc" },
    include: {
      _count: { select: { orders: true } },
      measurements: { select: { updatedAt: true } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Measure</p>
          <h1 className="text-3xl font-medium text-green">Customers</h1>
        </div>
        <Link href="/customers/new" className="btn-primary">
          + New Customer
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="input max-w-sm"
        />
      </form>

      {customers.length === 0 ? (
        <div className="bg-white border border-cream-dark px-8 py-16 text-center">
          <p className="text-green-muted mb-4">
            {q ? `No customers matching "${q}"` : "No customers yet"}
          </p>
          {!q && (
            <Link href="/customers/new" className="btn-primary inline-flex">
              Add first customer
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-cream-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream">
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Phone</th>
                <th className="table-th text-center">Orders</th>
                <th className="table-th text-center">Block</th>
                <th className="table-th">Measurements</th>
                <th className="table-th">Added</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-cream/50 transition-colors">
                  <td className="table-td font-medium">
                    <Link href={`/customers/${c.id}`} className="hover:text-gold">
                      {c.lastName}, {c.firstName}
                    </Link>
                  </td>
                  <td className="table-td text-green-muted">{c.email ?? "—"}</td>
                  <td className="table-td text-green-muted">{c.phone ?? "—"}</td>
                  <td className="table-td text-center">{c._count.orders}</td>
                  <td className="table-td text-center">
                    {c.hasBlock ? (
                      <span className="text-xs bg-green text-cream px-2 py-0.5">Cut</span>
                    ) : (
                      <span className="text-xs text-green-muted">—</span>
                    )}
                  </td>
                  <td className="table-td text-green-muted text-xs">
                    {c.measurements ? formatDate(c.measurements.updatedAt) : "—"}
                  </td>
                  <td className="table-td text-green-muted text-xs">{formatDate(c.createdAt)}</td>
                  <td className="table-td">
                    <Link href={`/customers/${c.id}`} className="text-xs text-gold hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
