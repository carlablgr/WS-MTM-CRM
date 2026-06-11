import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, garmentTypeLabel } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!form) return {};
  return { title: `Pre-Consultation — ${form.customer.firstName} ${form.customer.lastName}` };
}

export default async function PreConsultationPrintPage({ params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!form) notFound();

  return (
    <div className="print-doc">
      <PrintButton />

      <div className="pd-header">
        <div>
          <div className="pd-brand">Walker Slater · Covent Garden Ladieswear</div>
          <div className="pd-title">Made-to-Measure Pre-Consultation</div>
          <div className="pd-subtitle">
            {form.customer.firstName} {form.customer.lastName}
            {form.customer.email ? ` · ${form.customer.email}` : ""}
            {" · "}
            {formatDate(form.createdAt)}
          </div>
        </div>
      </div>

      <div className="pd-section">
        {form.garmentType && (
          <div className="pd-field">
            <div className="pd-label">Garment Type</div>
            <div className="pd-value">{garmentTypeLabel(form.garmentType)}</div>
          </div>
        )}
        {form.occasionOrPurpose && (
          <div className="pd-field">
            <div className="pd-label">Occasion / Purpose</div>
            <div className="pd-value">{form.occasionOrPurpose}</div>
          </div>
        )}
        {form.budgetRange && (
          <div className="pd-field">
            <div className="pd-label">Approximate Budget</div>
            <div className="pd-value">{form.budgetRange}</div>
          </div>
        )}
      </div>

      {(form.stylePreferences || form.fabricPreferences || form.inspirationNotes) && (
        <div className="pd-section">
          <div className="pd-section-title">Style & Fabric</div>
          {form.stylePreferences && (
            <div className="pd-field">
              <div className="pd-label">Style Preferences</div>
              <div className="pd-value">{form.stylePreferences}</div>
            </div>
          )}
          {form.fabricPreferences && (
            <div className="pd-field">
              <div className="pd-label">Fabric Preferences</div>
              <div className="pd-value">{form.fabricPreferences}</div>
            </div>
          )}
          {form.inspirationNotes && (
            <div className="pd-field">
              <div className="pd-label">Inspiration</div>
              <div className="pd-value">{form.inspirationNotes}</div>
            </div>
          )}
        </div>
      )}

      {form.existingFitIssues && (
        <div className="pd-section">
          <div className="pd-section-title">Fit Notes</div>
          <div className="pd-field">
            <div className="pd-label">Known Fit Issues (from RTW)</div>
            <div className="pd-value">{form.existingFitIssues}</div>
          </div>
        </div>
      )}

      {form.additionalNotes && (
        <div className="pd-section">
          <div className="pd-section-title">Additional Notes</div>
          <div className="pd-value">{form.additionalNotes}</div>
        </div>
      )}

      <div className="pd-footer">
        <span>38 Great Queen Street, London WC2B 5AA</span>
        <span>walkerslatersaville.com</span>
      </div>
    </div>
  );
}
