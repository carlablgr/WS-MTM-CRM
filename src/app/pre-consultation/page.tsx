import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, garmentTypeLabel, preConsultationStatusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PreConsultationListPage() {
  const forms = await prisma.preConsultationForm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const statusBadge: Record<string, string> = {
    DRAFT: "bg-stone-100 text-stone-600",
    SENT_TO_CUSTOMER: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-800",
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Made to Measure</p>
          <h1 className="text-3xl font-medium text-green">Pre-Consultations</h1>
        </div>
        <Link href="/pre-consultation/new" className="btn-primary">
          + New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white border border-cream-dark px-8 py-16 text-center">
          <p className="text-green-muted mb-4">No pre-consultation forms yet</p>
          <Link href="/pre-consultation/new" className="btn-primary inline-flex">
            Create first form
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-cream-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-cream">
                <th className="table-th">Customer</th>
                <th className="table-th">Garment</th>
                <th className="table-th">Occasion / Purpose</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.id} className="hover:bg-cream/50 transition-colors">
                  <td className="table-td font-medium">
                    <Link href={`/customers/${f.customer.id}`} className="hover:text-gold">
                      {f.customer.lastName}, {f.customer.firstName}
                    </Link>
                  </td>
                  <td className="table-td">
                    {f.garmentType ? garmentTypeLabel(f.garmentType) : "—"}
                  </td>
                  <td className="table-td text-green-muted text-xs max-w-xs truncate">
                    {f.occasionOrPurpose ?? "—"}
                  </td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 ${statusBadge[f.status] ?? ""}`}>
                      {preConsultationStatusLabel(f.status)}
                    </span>
                  </td>
                  <td className="table-td text-green-muted text-xs">{formatDate(f.createdAt)}</td>
                  <td className="table-td">
                    <Link href={`/pre-consultation/${f.id}`} className="text-xs text-gold hover:underline">
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
