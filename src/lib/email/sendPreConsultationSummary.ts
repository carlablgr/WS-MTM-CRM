import { sendMail, STUDIO_EMAIL } from "@/lib/mailer";
import { renderEmailLayout, field, paragraph } from "./layout";
import { garmentTypeLabel } from "@/lib/format";
import type { Customer, PreConsultationForm } from "@prisma/client";

type PreConsultationWithCustomer = PreConsultationForm & {
  customer: Pick<Customer, "firstName" | "lastName">;
};

export async function sendPreConsultationSummaryEmail(form: PreConsultationWithCustomer) {
  const customerName = `${form.customer.firstName} ${form.customer.lastName}`;
  const garment = form.garmentType ? garmentTypeLabel(form.garmentType) : "—";

  const bodyHtml =
    paragraph("A pre-consultation form has been completed.") +
    field("Customer", customerName) +
    field("Garment Type", garment) +
    (form.occasionOrPurpose ? field("Occasion / Purpose", form.occasionOrPurpose) : "") +
    (form.stylePreferences ? field("Style Preferences", form.stylePreferences) : "") +
    (form.fabricPreferences ? field("Fabric Preferences", form.fabricPreferences) : "") +
    (form.inspirationNotes ? field("Inspiration Notes", form.inspirationNotes) : "") +
    (form.budgetRange ? field("Approximate Budget", form.budgetRange) : "") +
    (form.existingFitIssues ? field("Existing Fit Issues", form.existingFitIssues) : "") +
    (form.additionalNotes ? field("Additional Notes", form.additionalNotes) : "");

  const html = renderEmailLayout({
    heading: `Pre-Consultation Summary — ${customerName} — ${garment}`,
    bodyHtml,
  });

  await sendMail({
    to: STUDIO_EMAIL,
    subject: `Pre-Consultation Summary — ${customerName} — ${garment}`,
    html,
  });
}
