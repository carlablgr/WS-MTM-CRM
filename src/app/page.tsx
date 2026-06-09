import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  garmentTypeLabel,
  orderStatusLabel,
  orderStatusColor,
  appointmentTypeLabel,
  reminderTypeLabel,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    activeOrders,
    ordersByStatus,
    upcomingAppointments,
    overdueReminders,
    recentCustomers,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.orderForm.count({ where: { status: { notIn: ["COMPLETE", "DELIVERED"] } } }),
    prisma.orderForm.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.appointment.findMany({
      where: { appointmentDate: { gte: now, lte: weekFromNow }, status: "SCHEDULED" },
      orderBy: { appointmentDate: "asc" },
      take: 8,
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.reminder.findMany({
      where: { completed: false, dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  const statusMap = Object.fromEntries(ordersByStatus.map((s) => [s.status, s._count.id]));

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Measure</p>
        <h1 className="text-3xl font-medium text-green">Overview</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Customers", value: totalCustomers, href: "/customers" },
          { label: "Active Orders", value: activeOrders, href: "/orders" },
          { label: "Upcoming Appointments", value: upcomingAppointments.length, href: "/appointments" },
          { label: "Overdue Reminders", value: overdueReminders.length, href: "/reminders" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white border border-cream-dark p-5 hover:border-gold transition-colors"
          >
            <div className="text-3xl font-medium text-green mb-1">{stat.value}</div>
            <div className="text-xs uppercase tracking-widest text-green-muted">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Order pipeline */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-green-muted">Order Pipeline</h2>
          <Link href="/orders" className="text-xs text-gold hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            "CONSULTATION_BOOKED",
            "DEPOSIT_TAKEN",
            "BRIEF_SENT_TO_TAILOR",
            "IN_PRODUCTION",
            "FITTING_SCHEDULED",
            "COMPLETE",
            "DELIVERED",
          ].map((s) => (
            <Link
              key={s}
              href={`/orders?status=${s}`}
              className="bg-white border border-cream-dark p-3 text-center hover:border-gold transition-colors"
            >
              <div className="text-2xl font-medium text-green">{statusMap[s] ?? 0}</div>
              <div className="text-xs text-green-muted mt-1 leading-tight">{orderStatusLabel(s)}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="bg-white border border-cream-dark">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
            <h2 className="text-xs uppercase tracking-widest text-green-muted">This Week</h2>
            <Link href="/appointments" className="text-xs text-gold hover:underline">All →</Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <div className="px-5 py-8 text-sm text-green-muted text-center">No appointments this week</div>
          ) : (
            <ul className="divide-y divide-cream-dark">
              {upcomingAppointments.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <div className="text-sm font-medium text-green">
                    {a.customer.firstName} {a.customer.lastName}
                  </div>
                  <div className="text-xs text-green-muted mt-0.5">
                    {appointmentTypeLabel(a.appointmentType)} · {formatDateTime(a.appointmentDate)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Overdue reminders */}
        <div className="bg-white border border-cream-dark">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
            <h2 className="text-xs uppercase tracking-widest text-green-muted">Overdue Tasks</h2>
            <Link href="/reminders" className="text-xs text-gold hover:underline">All →</Link>
          </div>
          {overdueReminders.length === 0 ? (
            <div className="px-5 py-8 text-sm text-green-muted text-center">No overdue reminders</div>
          ) : (
            <ul className="divide-y divide-cream-dark">
              {overdueReminders.map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="text-sm font-medium text-green">{reminderTypeLabel(r.type)}</div>
                  <div className="text-xs text-green-muted mt-0.5">
                    {r.customer ? `${r.customer.firstName} ${r.customer.lastName} · ` : ""}
                    Due {formatDate(r.dueDate)}
                  </div>
                  {r.description && (
                    <div className="text-xs text-green-muted/70 mt-0.5 truncate">{r.description}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent customers */}
        <div className="bg-white border border-cream-dark">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
            <h2 className="text-xs uppercase tracking-widest text-green-muted">Recent Customers</h2>
            <Link href="/customers" className="text-xs text-gold hover:underline">All →</Link>
          </div>
          {recentCustomers.length === 0 ? (
            <div className="px-5 py-8 text-sm text-green-muted text-center">No customers yet</div>
          ) : (
            <ul className="divide-y divide-cream-dark">
              {recentCustomers.map((c) => (
                <li key={c.id}>
                  <Link href={`/customers/${c.id}`} className="block px-5 py-3 hover:bg-cream transition-colors">
                    <div className="text-sm font-medium text-green">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-xs text-green-muted mt-0.5">
                      {c._count.orders} order{c._count.orders !== 1 ? "s" : ""}
                      {c.hasBlock ? " · Block cut" : ""}
                      {" · "}Added {formatDate(c.createdAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
