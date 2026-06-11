import { resend, FROM_EMAIL, STUDIO_EMAIL } from "@/lib/resend";
import { renderEmailLayout, field, paragraph } from "./layout";
import { formatCurrency, formatDate, garmentTypeLabel } from "@/lib/format";
import { renderOrderSummaryPdf } from "@/lib/pdf/renderOrderSummaryPdf";
import type { Customer, OrderForm, OrderItem } from "@prisma/client";

type OrderWithDetails = OrderForm & {
  customer: Pick<Customer, "firstName" | "lastName">;
  items: OrderItem[];
};

export async function sendOrderConfirmationEmail(order: OrderWithDetails) {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const garmentSummary = order.items.length
    ? order.items.map((it) => garmentTypeLabel(it.garmentType)).join(", ")
    : garmentTypeLabel(order.garmentType);
  const fabricCodes = order.items
    .map((it, i) => (it.fabricCode ? `${order.items.length > 1 ? `Garment ${i + 1}: ` : ""}${it.fabricCode}` : null))
    .filter(Boolean)
    .join(", ");

  const bodyHtml =
    paragraph("A new order has been submitted.") +
    field("Customer", customerName) +
    field("Garment Type", garmentSummary) +
    (fabricCodes ? field("Fabric Code", fabricCodes) : "") +
    field("Total (inc. VAT)", order.totalIncVat ? formatCurrency(Number(order.totalIncVat)) : "—") +
    field("Deposit Required", order.depositRequired ? formatCurrency(Number(order.depositRequired)) : "—") +
    field("Estimated Completion", formatDate(order.estimatedCompletionDate));

  const html = renderEmailLayout({
    heading: `New MTM Order — ${customerName} — ${garmentSummary}`,
    bodyHtml,
  });

  const pdfBuffer = await renderOrderSummaryPdf(order);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: STUDIO_EMAIL,
    subject: `New MTM Order — ${customerName} — ${garmentSummary}`,
    html,
    attachments: [
      {
        filename: `order-summary-${order.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
