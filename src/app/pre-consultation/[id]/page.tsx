import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, garmentTypeLabel, preConsultationStatusLabel } from "@/lib/format";
import FinalizeButton from "@/components/FinalizeButton";

export const dynamic = "force-dynamic";

export default async function PreConsultationDetailPage({ params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!form) notFound();

  const fields: [string, string, string | null][] = [
    ["Occasion / Purpose", "occasionOrPurpose", form.occasionOrPurpose],
    ["Garment Type", "garmentType", form.garmentType ? garmentTypeLabel(form.garmentType) : null],
    ["Style Preferences", "stylePreferences", form.stylePreferences],
    ["Fabric Preferences", "fabricPreferences", form.fabricPreferences],
    ["Inspiration Notes", "inspirationNotes", form.inspirationNotes],
    ["Approximate Budget", "budgetRange", form.budgetRange],
    ["Existing Fit Issues", "existingFitIssues", form.existingFitIssues],
    ["Additional Notes", "additionalNotes", form.additionalNotes],
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-green-muted mb-1">
            <Link href="/pre-consultation" className="hover:text-gold">Pre-Consultations</Link> /
          </p>
          <h1 className="text-3xl font-medium text-green">
            Pre-Consultation Form
          </h1>
          <div className="text-sm text-green-muted mt-1">
            <Link href={`/customers/${form.customer.id}`} className="hover:text-gold">
              {form.customer.firstName} {form.customer.lastName}
            </Link>
            {" · "}
            {formatDate(form.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pre-consultation/${form.id}/print`} target="_blank" className="btn-secondary text-sm">
            Export PDF
          </Link>
          <Link href={`/pre-consultation/${form.id}/edit`} className="btn-primary text-sm">
            Edit
          </Link>
          <FinalizeButton
            endpoint={`/api/pre-consultation/${form.id}/finalize`}
            finalized={form.finalized}
            label="Finalize & Send"
            finalizedLabel="Finalized"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Consultation Details</h2>
            <dl className="space-y-5">
              {fields.map(([label, , value]) =>
                value ? (
                  <div key={label}>
                    <dt className="text-xs text-green-muted uppercase tracking-wide mb-1">{label}</dt>
                    <dd className="text-sm text-green whitespace-pre-line">{value}</dd>
                  </div>
                ) : null
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Status</h2>
            <div className="text-sm text-green">{preConsultationStatusLabel(form.status)}</div>
            <div className="mt-2 text-xs text-green-muted">Completed by {form.completedBy}</div>
          </div>
          <div className="bg-white border border-cream-dark p-6">
            <h2 className="section-title">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/orders/new?customerId=${form.customerId}&preConsultationId=${form.id}`}
                className="block w-full btn-primary text-sm text-center"
              >
                Create Order from this Form
              </Link>
              <Link
                href={`/pre-consultation/${form.id}/print`}
                target="_blank"
                className="block w-full btn-secondary text-sm text-center"
              >
                Print / Export PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
