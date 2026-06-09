import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, garmentTypeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PreConsultationPrintPage({ params }: { params: { id: string } }) {
  const form = await prisma.preConsultationForm.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!form) notFound();

  return (
    <html lang="en">
      <head>
        <title>Pre-Consultation — {form.customer.firstName} {form.customer.lastName}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; color: #1e3d2f; background: white; padding: 48px; max-width: 720px; margin: 0 auto; }
          .header { border-bottom: 2px solid #1e3d2f; padding-bottom: 24px; margin-bottom: 32px; }
          .brand { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #c4a35a; margin-bottom: 4px; }
          .title { font-size: 22px; font-weight: normal; color: #1e3d2f; margin-bottom: 4px; }
          .subtitle { font-size: 13px; color: #4a7c5f; }
          .section { margin-bottom: 28px; }
          .section-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #4a7c5f; border-bottom: 1px solid #ede7d9; padding-bottom: 6px; margin-bottom: 14px; }
          .field { margin-bottom: 16px; }
          .label { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #4a7c5f; margin-bottom: 3px; }
          .value { font-size: 13px; line-height: 1.6; white-space: pre-line; }
          .footer { margin-top: 48px; border-top: 1px solid #ede7d9; padding-top: 16px; font-size: 10px; color: #4a7c5f; display: flex; justify-content: space-between; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3d2f; color: #f5f0e8; border: none; padding: 10px 20px; font-family: Georgia, serif; font-size: 13px; cursor: pointer; }
          @media print { .print-btn { display: none; } body { padding: 0; } }
        `}</style>
      </head>
      <body>
        <button className="print-btn" suppressHydrationWarning>
          Print / Save as PDF
        </button>

        <div className="header">
          <div className="brand">Walker Slater · Covent Garden Ladieswear</div>
          <div className="title">Made-to-Measure Pre-Consultation</div>
          <div className="subtitle">
            {form.customer.firstName} {form.customer.lastName}
            {form.customer.email ? ` · ${form.customer.email}` : ""}
            {" · "}
            {formatDate(form.createdAt)}
          </div>
        </div>

        <div className="section">
          {form.garmentType && (
            <div className="field">
              <div className="label">Garment Type</div>
              <div className="value">{garmentTypeLabel(form.garmentType)}</div>
            </div>
          )}
          {form.occasionOrPurpose && (
            <div className="field">
              <div className="label">Occasion / Purpose</div>
              <div className="value">{form.occasionOrPurpose}</div>
            </div>
          )}
          {form.budgetRange && (
            <div className="field">
              <div className="label">Approximate Budget</div>
              <div className="value">{form.budgetRange}</div>
            </div>
          )}
        </div>

        {(form.stylePreferences || form.fabricPreferences || form.inspirationNotes) && (
          <div className="section">
            <div className="section-title">Style & Fabric</div>
            {form.stylePreferences && (
              <div className="field">
                <div className="label">Style Preferences</div>
                <div className="value">{form.stylePreferences}</div>
              </div>
            )}
            {form.fabricPreferences && (
              <div className="field">
                <div className="label">Fabric Preferences</div>
                <div className="value">{form.fabricPreferences}</div>
              </div>
            )}
            {form.inspirationNotes && (
              <div className="field">
                <div className="label">Inspiration</div>
                <div className="value">{form.inspirationNotes}</div>
              </div>
            )}
          </div>
        )}

        {form.existingFitIssues && (
          <div className="section">
            <div className="section-title">Fit Notes</div>
            <div className="field">
              <div className="label">Known Fit Issues (from RTW)</div>
              <div className="value">{form.existingFitIssues}</div>
            </div>
          </div>
        )}

        {form.additionalNotes && (
          <div className="section">
            <div className="section-title">Additional Notes</div>
            <div className="value">{form.additionalNotes}</div>
          </div>
        )}

        <div className="footer">
          <span>19 Great Queen Street, London WC2B</span>
          <span>walkerslatersaville.com</span>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.print-btn').addEventListener('click', function() { window.print(); });
        `}} />
      </body>
    </html>
  );
}
