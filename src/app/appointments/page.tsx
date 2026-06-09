import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, appointmentTypeLabel, appointmentStatusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: { appointmentDate: { gte: now } },
      orderBy: { appointmentDate: "asc" },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        orderForm: { select: { id: true, garmentType: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { appointmentDate: { lt: now } },
      orderBy: { appointmentDate: "desc" },
      take: 30,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        orderForm: { select: { id: true, garmentType: true } },
      },
    }),
  ]);

  const statusBadge: Record<string, string> = {
    SCHEDULED: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-800",
    CANCELLED: "bg-stone-100 text-stone-500",
    NO_SHOW: "bg-red-50 text-red-700",
  };

  function AppointmentTable({ appts }: { appts: typeof upcoming }) {
    if (appts.length === 0) return <div className="px-6 py-6 text-sm text-green-muted">None.</div>;
    return (
      <table className="w-full">
        <thead>
          <tr className="bg-cream">
            <th className="table-th">Date & Time</th>
            <th className="table-th">Customer</th>
            <th className="table-th">Type</th>
            <th className="table-th">Order</th>
            <th className="table-th">Status</th>
            <th className="table-th">Notes</th>
            <th className="table-th"></th>
          </tr>
        </thead>
        <tbody>
          {appts.map((a) => (
            <tr key={a.id} className="hover:bg-cream/50 transition-colors">
              <td className="table-td tabular-nums whitespace-nowrap">{formatDateTime(a.appointmentDate)}</td>
              <td className="table-td font-medium">
                <Link href={`/customers/${a.customer.id}`} className="hover:text-gold">
                  {a.customer.lastName}, {a.customer.firstName}
                </Link>
              </td>
              <td className="table-td">{appointmentTypeLabel(a.appointmentType)}</td>
              <td className="table-td text-green-muted text-xs">
                {a.orderForm ? (
                  <Link href={`/orders/${a.orderForm.id}`} className="hover:text-gold">
                    {a.orderForm.garmentType?.replace("_", " ") ?? "Order"}
                  </Link>
                ) : "—"}
              </td>
              <td className="table-td">
                <span className={`text-xs px-2 py-0.5 ${statusBadge[a.status] ?? ""}`}>
                  {appointmentStatusLabel(a.status)}
                </span>
              </td>
              <td className="table-td text-green-muted text-xs max-w-xs truncate">{a.notes ?? "—"}</td>
              <td className="table-td">
                <Link href={`/appointments/${a.id}/edit`} className="text-xs text-gold hover:underline">
                  Edit →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Measure</p>
          <h1 className="text-3xl font-medium text-green">Appointments</h1>
        </div>
        <Link href="/appointments/new" className="btn-primary">
          + New Appointment
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="section-title mb-4">Upcoming ({upcoming.length})</h2>
          <div className="bg-white border border-cream-dark overflow-hidden">
            <AppointmentTable appts={upcoming} />
          </div>
        </div>

        <div>
          <h2 className="section-title mb-4">Past (last 30)</h2>
          <div className="bg-white border border-cream-dark overflow-hidden">
            <AppointmentTable appts={past} />
          </div>
        </div>
      </div>
    </div>
  );
}
